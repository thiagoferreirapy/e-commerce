import type { Coupon, CouponScope, OrderStatus, PaymentMethod, Product } from "@/types";
import { apiFetch, toQuery } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

/** Envia um arquivo de imagem (multipart) e retorna a URL pública salva. */
export async function uploadProductImage(file: File): Promise<{ url: string }> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`${API_BASE}/admin/uploads`, {
    method: "POST",
    body: fd,
    credentials: "include", // envia o cookie de sessão (admin)
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(
      (data as { error?: { message?: string } } | null)?.error?.message ??
        "Falha no upload da imagem.",
    );
  }
  return data as { url: string };
}

/* ----------------------------- Dashboard ------------------------------- */
export interface AdminStats {
  revenue: number;
  orderCount: number;
  avgTicket: number;
  statusCounts: { status: string; count: number }[];
  recentOrders: { id: string; number: string; total: number; status: string; createdAt: string }[];
  topProducts: { id: string; name: string; slug: string; soldCount: number; price: number }[];
  lowStock: { id: string; name: string; slug: string; totalStock: number }[];
  productCount: number;
  userCount: number;
  couponCount: number;
}

export function getStats(): Promise<AdminStats> {
  return apiFetch<AdminStats>("/admin/stats");
}

/* ----------------------------- Produtos -------------------------------- */
export interface AdminProductRow {
  id: string;
  name: string;
  slug: string;
  ref: string;
  brand: string;
  categorySlug: string;
  listPrice: number;
  price: number;
  totalStock: number;
  soldCount: number;
}
export interface AdminProductPage {
  items: AdminProductRow[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export interface ProductVariantInput {
  color?: string | null;
  size?: string | null;
  sku: string;
  stock: number;
  imageUrl?: string | null;
}
export interface ProductInput {
  name: string;
  slug: string;
  brandId: string;
  categorySlug: string;
  subcategorySlug?: string | null;
  listPrice: number;
  price: number;
  ref: string;
  shortDescription: string;
  description: string;
  freeShipping: boolean;
  offerEndsAt?: string | null;
  soldCount: number;
  tags: string[];
  images: string[];
  specs: { label: string; value: string }[];
  variants: ProductVariantInput[];
  totalStock: number;
}

export function listAdminProducts(params: {
  q?: string;
  page?: number;
  pageSize?: number;
} = {}): Promise<AdminProductPage> {
  return apiFetch<AdminProductPage>(`/admin/products${toQuery(params)}`);
}
export function getAdminProduct(id: string): Promise<Product> {
  return apiFetch<Product>(`/admin/products/${id}`);
}
export function createProduct(input: ProductInput): Promise<Product> {
  return apiFetch<Product>("/admin/products", { method: "POST", body: input });
}
export function updateProduct(id: string, input: ProductInput): Promise<Product> {
  return apiFetch<Product>(`/admin/products/${id}`, { method: "PUT", body: input });
}
export function deleteProduct(id: string): Promise<void> {
  return apiFetch<void>(`/admin/products/${id}`, { method: "DELETE" });
}

/* ------------------------------ Pedidos -------------------------------- */
export interface AdminOrderItem {
  name: string;
  variantLabel?: string | null;
  quantity: number;
  unitPrice: number;
  imageUrl: string;
}
export interface AdminOrder {
  id: string;
  number: string;
  createdAt: string;
  status: OrderStatus;
  customer: string;
  email: string | null;
  itemCount: number;
  payment: PaymentMethod;
  total: number;
  items: AdminOrderItem[];
  address: { city: string; state: string; recipient: string; street: string; number: string };
  shippingLabel: string;
}
export interface AdminOrderPage {
  items: AdminOrder[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export function listAdminOrders(params: {
  status?: OrderStatus;
  page?: number;
  pageSize?: number;
} = {}): Promise<AdminOrderPage> {
  return apiFetch<AdminOrderPage>(`/admin/orders${toQuery(params)}`);
}
export function updateOrderStatus(id: string, status: OrderStatus): Promise<{ id: string; status: string }> {
  return apiFetch(`/admin/orders/${id}/status`, { method: "PATCH", body: { status } });
}

/* ------------------------------ Cupons --------------------------------- */
export interface CouponInput {
  code: string;
  type: "percent" | "fixed";
  value: number;
  minSubtotal?: number | null;
  description: string;
  scope: CouponScope;
  scopeValue?: string | null;
  maxUses?: number | null;
  startsAt?: string | null;
  expiresAt?: string | null;
}
export function listAdminCoupons(): Promise<Coupon[]> {
  return apiFetch<Coupon[]>("/admin/coupons");
}
export function createCoupon(input: CouponInput): Promise<Coupon> {
  return apiFetch<Coupon>("/admin/coupons", { method: "POST", body: input });
}
export function updateCoupon(code: string, input: Partial<CouponInput>): Promise<Coupon> {
  return apiFetch<Coupon>(`/admin/coupons/${code}`, { method: "PUT", body: input });
}
export function deleteCoupon(code: string): Promise<void> {
  return apiFetch<void>(`/admin/coupons/${code}`, { method: "DELETE" });
}

/* ---- Marcas ---- */
export interface AdminBrandRow {
  id: string;
  name: string;
  slug: string;
  logoUrl: string;
  productCount: number;
}
export interface BrandInput {
  name: string;
  slug: string;
  logoUrl?: string | null;
}
export function listAdminBrands(): Promise<AdminBrandRow[]> {
  return apiFetch<AdminBrandRow[]>("/admin/brands");
}
export function createBrand(input: BrandInput): Promise<AdminBrandRow> {
  return apiFetch<AdminBrandRow>("/admin/brands", { method: "POST", body: input });
}
export function updateBrand(id: string, input: BrandInput): Promise<AdminBrandRow> {
  return apiFetch<AdminBrandRow>(`/admin/brands/${id}`, { method: "PUT", body: input });
}
export function deleteBrand(id: string): Promise<void> {
  return apiFetch<void>(`/admin/brands/${id}`, { method: "DELETE" });
}

/* ---- Categorias ---- */
export interface AdminCategoryRow {
  id: string;
  name: string;
  slug: string;
  parentSlug: string | null;
  imageUrl: string;
  description: string | null;
  featured: boolean;
  position: number;
  productCount: number;
  subcategoryCount: number;
}
export interface CategoryInput {
  name: string;
  slug: string;
  parentSlug?: string | null;
  imageUrl?: string | null;
  description?: string | null;
  featured: boolean;
  position: number;
}
export function listAdminCategories(): Promise<AdminCategoryRow[]> {
  return apiFetch<AdminCategoryRow[]>("/admin/categories");
}
export function createCategory(input: CategoryInput): Promise<AdminCategoryRow> {
  return apiFetch<AdminCategoryRow>("/admin/categories", { method: "POST", body: input });
}
export function updateCategory(id: string, input: CategoryInput): Promise<AdminCategoryRow> {
  return apiFetch<AdminCategoryRow>(`/admin/categories/${id}`, { method: "PUT", body: input });
}
export function deleteCategory(id: string): Promise<void> {
  return apiFetch<void>(`/admin/categories/${id}`, { method: "DELETE" });
}
