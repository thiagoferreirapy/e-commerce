import { randomUUID } from "node:crypto";
import { prisma } from "../../lib/prisma";
import { Conflict, Forbidden, NotFound } from "../../lib/errors";
import { discountPercent } from "../../lib/format";
import type { ProductDTO, ProductPageDTO, ProductTag } from "../../types";
import { productInclude, toProductDTO, type ProductWithRelations } from "./mapper";
import type { ProductQueryInput } from "./schema";

/* A lógica de filtragem/ordenação/facetas espelha src/services/catalog.ts do
   front. Dado o tamanho do catálogo, carregamos o conjunto "scoped" (categoria +
   busca + tag) com relações e aplicamos os demais filtros em memória — o que
   mantém paridade exata com o comportamento original e simplifica as facetas. */

function colorsOf(p: ProductWithRelations) {
  const map = new Map<string, { label: string; hex?: string }>();
  for (const v of p.variants) if (v.color) map.set(v.color, { label: "", hex: undefined });
  return [...map.keys()];
}
function sizesOf(p: ProductWithRelations) {
  return [...new Set(p.variants.filter((v) => v.size).map((v) => v.size as string))];
}

function matchesQuery(p: ProductWithRelations, q: string): boolean {
  const hay = `${p.name} ${p.shortDescription} ${p.ref} ${p.brand.name} ${p.categorySlug}`.toLowerCase();
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => hay.includes(term));
}

async function loadScoped(query: ProductQueryInput): Promise<ProductWithRelations[]> {
  // Filtro de categoria considerando subcategorias.
  let categorySlugs: string[] | undefined;
  if (query.category) {
    const subs = await prisma.category.findMany({
      where: { parentSlug: query.category },
      select: { slug: true },
    });
    categorySlugs = [query.category, ...subs.map((s) => s.slug)];
  }

  const products = await prisma.product.findMany({
    where: {
      ...(categorySlugs
        ? {
            OR: [
              { categorySlug: { in: categorySlugs } },
              { subcategorySlug: { in: categorySlugs } },
            ],
          }
        : {}),
      ...(query.tag ? { tags: { some: { tag: query.tag } } } : {}),
    },
    include: productInclude,
  });

  // Busca textual em memória (case-insensitive, paridade com o front).
  return query.q ? products.filter((p) => matchesQuery(p, query.q!)) : products;
}

function applyFacetFilters(
  list: ProductWithRelations[],
  q: ProductQueryInput,
): ProductWithRelations[] {
  return list.filter((p) => {
    if (q.brand && !q.brand.includes(p.brand.slug)) return false;
    if (q.inStock && p.totalStock <= 0) return false;
    if (q.freeShipping && !p.freeShipping) return false;
    if (q.minPrice != null && p.price < q.minPrice) return false;
    if (q.maxPrice != null && p.price > q.maxPrice) return false;
    if (q.minDiscount != null && discountPercent(p.listPrice, p.price) < q.minDiscount) return false;
    if (q.color) {
      const cs = colorsOf(p);
      if (!q.color.some((c) => cs.includes(c))) return false;
    }
    if (q.size) {
      const ss = sizesOf(p);
      if (!q.size.some((s) => ss.includes(s))) return false;
    }
    return true;
  });
}

function sortProducts(list: ProductWithRelations[], sort: ProductQueryInput["sort"]) {
  const copy = [...list];
  switch (sort) {
    case "mais-vendidos":
      return copy.sort((a, b) => b.soldCount - a.soldCount);
    case "menor-preco":
      return copy.sort((a, b) => a.price - b.price);
    case "maior-preco":
      return copy.sort((a, b) => b.price - a.price);
    case "maior-desconto":
      return copy.sort(
        (a, b) => discountPercent(b.listPrice, b.price) - discountPercent(a.listPrice, a.price),
      );
    case "nome":
      return copy.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    default: {
      const score = (p: ProductWithRelations) =>
        (p.tags.some((t) => t.tag === "destaque") ? 2 : 0) +
        (p.tags.some((t) => t.tag === "mais-vendido") ? 1 : 0);
      return copy.sort((a, b) => score(b) - score(a) || b.soldCount - a.soldCount);
    }
  }
}

function buildFacets(scoped: ProductWithRelations[]): ProductPageDTO["facets"] {
  const brandMap = new Map<string, { name: string; count: number }>();
  const colorMap = new Map<string, { label: string; hex?: string; count: number }>();
  const sizeMap = new Map<string, number>();

  for (const p of scoped) {
    const cur = brandMap.get(p.brand.slug) ?? { name: p.brand.name, count: 0 };
    cur.count++;
    brandMap.set(p.brand.slug, cur);
    // facetas de variante usam o DTO para obter label/hex consistentes
    const dto = toProductDTO(p);
    const colorAxis = dto.variantAxes.find((a) => a.axis === "color");
    for (const o of colorAxis?.options ?? []) {
      const c = colorMap.get(o.value) ?? { label: o.label, hex: o.hex, count: 0 };
      c.count++;
      colorMap.set(o.value, c);
    }
    const sizeAxis = dto.variantAxes.find((a) => a.axis === "size");
    for (const o of sizeAxis?.options ?? []) sizeMap.set(o.value, (sizeMap.get(o.value) ?? 0) + 1);
  }

  return {
    brands: [...brandMap.entries()]
      .map(([slug, v]) => ({ slug, name: v.name, count: v.count }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    colors: [...colorMap.entries()]
      .map(([value, v]) => ({ value, label: v.label, hex: v.hex, count: v.count }))
      .sort((a, b) => b.count - a.count),
    sizes: [...sizeMap.entries()]
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => a.value.localeCompare(b.value, "pt-BR", { numeric: true })),
  };
}

export async function listProducts(query: ProductQueryInput): Promise<ProductPageDTO> {
  const scoped = await loadScoped(query);
  const filtered = applyFacetFilters(scoped, query);
  const sorted = sortProducts(filtered, query.sort);

  const total = sorted.length;
  const pageCount = Math.max(1, Math.ceil(total / query.pageSize));
  const page = Math.min(query.page, pageCount);
  const start = (page - 1) * query.pageSize;
  const items = sorted.slice(start, start + query.pageSize).map(toProductDTO);

  const prices = scoped.map((p) => p.price);
  const priceBounds = {
    min: prices.length ? Math.floor(Math.min(...prices)) : 0,
    max: prices.length ? Math.ceil(Math.max(...prices)) : 0,
  };

  return {
    items,
    total,
    page,
    pageSize: query.pageSize,
    pageCount,
    priceBounds,
    facets: buildFacets(scoped),
  };
}

export interface NewReviewInput {
  rating: number;
  title: string;
  comment: string;
}

/**
 * Cria uma avaliação — somente para quem COMPROU o produto (verificado pelos
 * pedidos do usuário) e que ainda não avaliou. Recalcula a média/contagem.
 */
export async function addReview(
  slug: string,
  userId: string,
  input: NewReviewInput,
): Promise<ProductDTO> {
  const product = await prisma.product.findUnique({ where: { slug }, select: { id: true } });
  if (!product) throw NotFound("Produto não encontrado");

  // Só avalia quem comprou: precisa existir um item de pedido do usuário.
  const purchased = await prisma.orderItem.findFirst({
    where: { productId: product.id, order: { userId } },
    select: { id: true },
  });
  if (!purchased) {
    throw Forbidden("Você só pode avaliar produtos que comprou.");
  }

  // Uma avaliação por produto por usuário.
  const already = await prisma.review.findFirst({
    where: { productId: product.id, userId },
    select: { id: true },
  });
  if (already) throw Conflict("Você já avaliou este produto.");

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });

  await prisma.review.create({
    data: {
      id: randomUUID(),
      productId: product.id,
      userId,
      author: user?.name ?? "Cliente",
      rating: input.rating,
      title: input.title,
      comment: input.comment,
      date: new Date(),
      verified: true,
    },
  });

  const agg = await prisma.review.aggregate({
    where: { productId: product.id },
    _avg: { rating: true },
    _count: true,
  });

  await prisma.product.update({
    where: { id: product.id },
    data: {
      rating: Math.round((agg._avg.rating ?? 0) * 100) / 100,
      reviewCount: agg._count,
    },
  });

  const updated = await prisma.product.findUnique({ where: { id: product.id }, include: productInclude });
  return toProductDTO(updated!);
}

export async function getProductBySlug(slug: string): Promise<ProductDTO | null> {
  const p = await prisma.product.findUnique({ where: { slug }, include: productInclude });
  return p ? toProductDTO(p) : null;
}

export async function getRelatedProducts(slug: string, limit = 10): Promise<ProductDTO[]> {
  const product = await prisma.product.findUnique({ where: { slug }, select: { categorySlug: true } });
  if (!product) return [];
  const related = await prisma.product.findMany({
    where: { categorySlug: product.categorySlug, slug: { not: slug } },
    include: productInclude,
    take: limit,
  });
  return related.map(toProductDTO);
}

export async function getProductsByIds(ids: string[]): Promise<ProductDTO[]> {
  if (!ids.length) return [];
  const found = await prisma.product.findMany({ where: { id: { in: ids } }, include: productInclude });
  const byId = new Map(found.map((p) => [p.id, p]));
  // preserva a ordem solicitada
  return ids.map((id) => byId.get(id)).filter(Boolean).map((p) => toProductDTO(p!));
}

export async function getByTag(tag: ProductTag, limit = 10): Promise<ProductDTO[]> {
  const rows = await prisma.product.findMany({
    where: { tags: { some: { tag } } },
    include: productInclude,
    take: limit,
  });
  return rows.map(toProductDTO);
}

export async function getBestSellers(limit = 10): Promise<ProductDTO[]> {
  const rows = await prisma.product.findMany({
    include: productInclude,
    orderBy: { soldCount: "desc" },
    take: limit,
  });
  return rows.map(toProductDTO);
}

export async function getNewArrivals(limit = 10): Promise<ProductDTO[]> {
  const rows = await prisma.product.findMany({
    include: productInclude,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map(toProductDTO);
}

export async function getBiggestDiscounts(limit = 10): Promise<ProductDTO[]> {
  // desconto não é coluna; carrega e ordena em memória
  const rows = await prisma.product.findMany({ include: productInclude });
  return rows
    .sort((a, b) => discountPercent(b.listPrice, b.price) - discountPercent(a.listPrice, a.price))
    .slice(0, limit)
    .map(toProductDTO);
}
