/** DTOs da API — espelham src/types do front para resposta idêntica. */

export type VariantAxis = "color" | "size";
export type ProductTag =
  | "destaque"
  | "novidade"
  | "mais-vendido"
  | "oferta-do-dia"
  | "ultimas-unidades";

export interface BrandDTO {
  id: string;
  name: string;
  slug: string;
  logoUrl: string;
}

export interface CategoryDTO {
  id: string;
  name: string;
  slug: string;
  parentSlug?: string;
  imageUrl: string;
  description?: string;
  featured: boolean;
  position: number;
}

export interface VariantOptionDTO {
  axis: VariantAxis;
  label: string;
  value: string;
  hex?: string;
}

export interface ProductVariantDTO {
  id: string;
  options: Partial<Record<VariantAxis, string>>;
  sku: string;
  stock: number;
  imageUrl?: string;
}

export interface ReviewDTO {
  id: string;
  author: string;
  rating: number;
  title: string;
  comment: string;
  date: string;
  verified: boolean;
}

export interface SellerDTO {
  id: string;
  name: string;
  rating: number;
  official: boolean;
}

export interface ProductDTO {
  id: string;
  name: string;
  slug: string;
  brandId: string;
  brand?: BrandDTO;
  categorySlug: string;
  subcategorySlug?: string;
  listPrice: number;
  price: number;
  ref: string;
  shortDescription: string;
  description: string;
  specs: { label: string; value: string }[];
  images: string[];
  rating: number;
  reviewCount: number;
  reviews: ReviewDTO[];
  variantAxes: { axis: VariantAxis; options: VariantOptionDTO[] }[];
  variants: ProductVariantDTO[];
  totalStock: number;
  freeShipping: boolean;
  tags: ProductTag[];
  offerEndsAt?: string;
  seller: SellerDTO;
  createdAt: string;
  soldCount: number;
}

export interface ProductPageDTO {
  items: ProductDTO[];
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

export interface AddressDTO {
  id: string;
  label: string;
  recipient: string;
  cep: string;
  street: string;
  number: string;
  complement?: string;
  district: string;
  city: string;
  state: string;
  isDefault?: boolean;
}

export interface UserDTO {
  id: string;
  name: string;
  email: string;
  role: string;
  cpf?: string;
  phone?: string;
  addresses: AddressDTO[];
}
