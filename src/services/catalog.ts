import type { Category, Product, ProductTag } from "@/types";
import { apiFetch, toQuery } from "@/lib/api";
// Categorias e marcas são dados de referência estáticos (espelham o banco) e
// seguem sendo lidos localmente para metadata/navegação/SSG.
import { getCategory, getSubcategories, categories } from "@/data/categories";
import { getBrand, brands } from "@/data/brands";

export type SortKey =
  | "relevancia"
  | "mais-vendidos"
  | "menor-preco"
  | "maior-preco"
  | "maior-desconto"
  | "nome";

export interface ProductFilters {
  categorySlug?: string;
  subcategories?: string[];
  brandSlugs?: string[];
  inStock?: boolean;
  minPrice?: number;
  maxPrice?: number;
  colors?: string[];
  sizes?: string[];
  minDiscount?: number;
  freeShipping?: boolean;
  tag?: ProductTag;
  query?: string;
  sellerId?: string;
}

export interface ProductQuery extends ProductFilters {
  sort?: SortKey;
  page?: number;
  pageSize?: number;
}

export interface ProductPage {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  priceBounds: { min: number; max: number };
  facets: {
    brands: { slug: string; name: string; count: number }[];
    subcategories: { slug: string; name: string; count: number }[];
    colors: { value: string; label: string; hex?: string; count: number }[];
    sizes: { value: string; count: number }[];
  };
}

/** Lista principal com filtros, ordenação, paginação e facetas (via API). */
export async function listProducts(query: ProductQuery = {}): Promise<ProductPage> {
  const qs = toQuery({
    category: query.categorySlug,
    subcategory: query.subcategories,
    brand: query.brandSlugs,
    color: query.colors,
    size: query.sizes,
    inStock: query.inStock ? "true" : undefined,
    freeShipping: query.freeShipping ? "true" : undefined,
    minPrice: query.minPrice,
    maxPrice: query.maxPrice,
    minDiscount: query.minDiscount,
    tag: query.tag,
    q: query.query,
    sort: query.sort,
    page: query.page,
    pageSize: query.pageSize,
  });
  return apiFetch<ProductPage>(`/products${qs}`);
}

export async function getProductBySlugAsync(slug: string): Promise<Product | null> {
  try {
    return await apiFetch<Product>(`/products/${slug}`);
  } catch {
    return null;
  }
}

export async function getRelatedProducts(slug: string): Promise<Product[]> {
  return apiFetch<Product[]>(`/products/${encodeURIComponent(slug)}/related`);
}

/** Resolve vários produtos por id (carrinho, vistos recentemente, busca). */
export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  if (!ids.length) return [];
  return apiFetch<Product[]>(`/products/by-ids${toQuery({ ids })}`);
}

/** Publica uma avaliação e retorna o produto com a lista/nota atualizadas. */
export async function submitReview(
  slug: string,
  data: { author?: string; rating: number; title: string; comment: string },
): Promise<Product> {
  return apiFetch<Product>(`/products/${encodeURIComponent(slug)}/reviews`, {
    method: "POST",
    body: data,
  });
}

export async function getProductsByTag(tag: ProductTag, limit = 10): Promise<Product[]> {
  const page = await listProducts({ tag, pageSize: limit });
  return page.items;
}

export async function getBestSellers(limit = 10): Promise<Product[]> {
  const page = await listProducts({ sort: "mais-vendidos", pageSize: limit });
  return page.items;
}

export async function getNewArrivals(limit = 10): Promise<Product[]> {
  const { novidades } = await apiFetch<{ novidades: Product[] }>(`/home`);
  return novidades.slice(0, limit);
}

/** Vitrines da home em uma única chamada. */
export async function getHomeShowcases(): Promise<{
  ofertas: Product[];
  maisVendidos: Product[];
  novidades: Product[];
  descontos: Product[];
}> {
  return apiFetch(`/home`);
}

export async function getAllCategories() {
  return categories;
}
export async function getAllBrands() {
  return brands;
}

/**
 * Categoria + trilha (breadcrumb) a partir do slug, vindo do banco (dinâmico).
 * Fallback para os dados estáticos se a API falhar. Retorna null se não existir.
 */
export async function getCategoryContext(
  slug: string,
): Promise<{ category: Category; trail: Category[] } | null> {
  let all: Category[];
  try {
    all = await apiFetch<Category[]>(`/categories`);
  } catch {
    all = categories; // fallback estático (categorias semeadas)
  }
  const bySlug = new Map(all.map((c) => [c.slug, c]));
  const category = bySlug.get(slug);
  if (!category) return null;
  let trail: Category[] = [category];
  if (category.parentSlug) {
    const parent = bySlug.get(category.parentSlug);
    if (parent) trail = [parent, category];
  }
  return { category, trail };
}

export interface NavCategory {
  label: string;
  slug: string;
  href: string;
  subcategories: { label: string; href: string }[];
}

/**
 * Monta a navegação do header a partir das categorias do banco (dinâmica):
 * cada categoria-raiz vira um item principal com suas subcategorias.
 * Resiliente: se a API falhar, devolve lista vazia (a página ainda renderiza).
 */
export async function getNavCategories(): Promise<NavCategory[]> {
  try {
    const cats = await apiFetch<Category[]>(`/categories`);
    return cats
      .filter((c) => !c.parentSlug)
      .map((root) => ({
        label: root.name,
        slug: root.slug,
        href: `/categoria/${root.slug}`,
        subcategories: cats
          .filter((c) => c.parentSlug === root.slug)
          .map((c) => ({ label: c.name, href: `/categoria/${c.slug}` })),
      }));
  } catch {
    return [];
  }
}

export { getCategory, getSubcategories, getBrand };
