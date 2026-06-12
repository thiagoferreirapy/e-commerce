import type { Product, ProductTag } from "@/types";
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
    colors: { value: string; label: string; hex?: string; count: number }[];
    sizes: { value: string; count: number }[];
  };
}

/** Lista principal com filtros, ordenação, paginação e facetas (via API). */
export async function listProducts(query: ProductQuery = {}): Promise<ProductPage> {
  const qs = toQuery({
    category: query.categorySlug,
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

export { getCategory, getSubcategories, getBrand };
