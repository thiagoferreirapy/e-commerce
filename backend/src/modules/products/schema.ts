import { z } from "zod";

/** Converte "a,b,c" (ou repetições) em string[] limpa. */
const csv = z
  .union([z.string(), z.array(z.string())])
  .optional()
  .transform((v) => {
    if (!v) return undefined;
    const arr = Array.isArray(v) ? v : v.split(",");
    const clean = arr.map((s) => s.trim()).filter(Boolean);
    return clean.length ? clean : undefined;
  });

const bool = z
  .union([z.string(), z.boolean()])
  .optional()
  .transform((v) => v === true || v === "true" || v === "1");

export const productQuerySchema = z.object({
  category: z.string().optional(),
  subcategory: csv,
  q: z.string().optional(),
  tag: z.string().optional(),
  brand: csv,
  color: csv,
  size: csv,
  inStock: bool,
  freeShipping: bool,
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  minDiscount: z.coerce.number().optional(),
  sort: z
    .enum(["relevancia", "mais-vendidos", "menor-preco", "maior-preco", "maior-desconto", "nome"])
    .default("relevancia"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(60).default(12),
});

export type ProductQueryInput = z.infer<typeof productQuerySchema>;

export const reviewSchema = z.object({
  author: z.string().trim().min(2).optional(),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().min(2).max(120),
  comment: z.string().trim().min(3).max(1000),
});

export const byIdsQuerySchema = z.object({
  ids: z
    .string()
    .optional()
    .transform((v) => (v ? v.split(",").map((s) => s.trim()).filter(Boolean) : [])),
});
