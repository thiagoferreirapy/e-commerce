import { Prisma } from "@prisma/client";
import type { ProductDTO, ProductTag } from "../../types";
import { buildVariantAxes, variantOptions } from "../../lib/variants";

/** Include canônico para montar um ProductDTO completo. */
export const productInclude = {
  brand: true,
  seller: true,
  images: { orderBy: { position: "asc" } },
  specs: { orderBy: { position: "asc" } },
  tags: true,
  variants: true,
  reviews: { orderBy: { date: "desc" } },
} satisfies Prisma.ProductInclude;

export type ProductWithRelations = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

/** Converte uma linha do Prisma (com relações) no DTO idêntico ao tipo do front. */
export function toProductDTO(p: ProductWithRelations): ProductDTO {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    brandId: p.brandId,
    brand: {
      id: p.brand.id,
      name: p.brand.name,
      slug: p.brand.slug,
      logoUrl: p.brand.logoUrl,
    },
    categorySlug: p.categorySlug,
    subcategorySlug: p.subcategorySlug ?? undefined,
    listPrice: p.listPrice,
    price: p.price,
    ref: p.ref,
    shortDescription: p.shortDescription,
    description: p.description,
    specs: p.specs.map((s) => ({ label: s.label, value: s.value })),
    images: p.images.map((i) => i.url),
    rating: p.rating,
    reviewCount: p.reviewCount,
    reviews: p.reviews.map((r) => ({
      id: r.id,
      author: r.author,
      rating: r.rating,
      title: r.title,
      comment: r.comment,
      date: r.date.toISOString(),
      verified: r.verified,
    })),
    variantAxes: buildVariantAxes(p.variants),
    variants: p.variants.map((v) => ({
      id: v.id,
      options: variantOptions(v),
      sku: v.sku,
      stock: v.stock,
      imageUrl: v.imageUrl ?? undefined,
    })),
    totalStock: p.totalStock,
    freeShipping: p.freeShipping,
    tags: p.tags.map((t) => t.tag as ProductTag),
    offerEndsAt: p.offerEndsAt ? p.offerEndsAt.toISOString() : undefined,
    seller: {
      id: p.seller.id,
      name: p.seller.name,
      rating: p.seller.rating,
      official: p.seller.official,
    },
    createdAt: p.createdAt.toISOString(),
    soldCount: p.soldCount,
  };
}
