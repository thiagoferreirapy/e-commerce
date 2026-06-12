import { Router } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { asyncHandler, NotFound, Conflict } from "../../lib/errors";
import { validate } from "../../middleware/validate";
import { getQuery } from "../../middleware/validate";
import { productInclude, toProductDTO } from "../products/mapper";

export const adminProductsRouter = Router();

const variantSchema = z.object({
  color: z.string().nullable().optional(),
  size: z.string().nullable().optional(),
  sku: z.string().min(1),
  stock: z.coerce.number().int().min(0),
  imageUrl: z.string().nullable().optional(),
});

const productSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, "Slug deve conter apenas letras minúsculas, números e hífens."),
  brandId: z.string().min(1),
  categorySlug: z.string().min(1),
  subcategorySlug: z.string().nullable().optional(),
  listPrice: z.coerce.number().min(0),
  price: z.coerce.number().min(0),
  ref: z.string().min(1),
  shortDescription: z.string().min(2),
  description: z.string().min(2),
  freeShipping: z.boolean().default(false),
  offerEndsAt: z.string().nullable().optional(),
  soldCount: z.coerce.number().int().min(0).default(0),
  tags: z.array(z.string()).default([]),
  images: z.array(z.string().min(1)).min(1, "Adicione ao menos uma imagem."),
  specs: z.array(z.object({ label: z.string().min(1), value: z.string().min(1) })).default([]),
  variants: z.array(variantSchema).default([]),
  totalStock: z.coerce.number().int().min(0).default(0),
});

const listQuerySchema = z.object({
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

type ProductInput = z.infer<typeof productSchema>;

function computeTotalStock(input: ProductInput): number {
  return input.variants.length
    ? input.variants.reduce((acc, v) => acc + v.stock, 0)
    : input.totalStock;
}

function nestedCreate(input: ProductInput) {
  return {
    images: { create: input.images.map((url, i) => ({ url, position: i })) },
    specs: { create: input.specs.map((s, i) => ({ label: s.label, value: s.value, position: i })) },
    tags: { create: input.tags.map((tag) => ({ tag })) },
    variants: {
      create: input.variants.map((v) => ({
        id: randomUUID(),
        sku: v.sku,
        stock: v.stock,
        imageUrl: v.imageUrl ?? null,
        color: v.color ?? null,
        size: v.size ?? null,
      })),
    },
  };
}

/* ---- Listagem ---- */
adminProductsRouter.get(
  "/",
  validate({ query: listQuerySchema }),
  asyncHandler(async (req, res) => {
    const { q, page, pageSize } = getQuery<z.infer<typeof listQuerySchema>>(req);
    const where = q
      ? { OR: [{ name: { contains: q } }, { ref: { contains: q } }, { slug: { contains: q } }] }
      : {};
    const [rows, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { brand: true },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.product.count({ where }),
    ]);
    res.json({
      items: rows.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        ref: p.ref,
        brand: p.brand.name,
        categorySlug: p.categorySlug,
        listPrice: p.listPrice,
        price: p.price,
        totalStock: p.totalStock,
        soldCount: p.soldCount,
      })),
      total,
      page,
      pageSize,
      pageCount: Math.max(1, Math.ceil(total / pageSize)),
    });
  }),
);

/* ---- Detalhe (form de edição) ---- */
adminProductsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const p = await prisma.product.findUnique({ where: { id: req.params.id }, include: productInclude });
    if (!p) throw NotFound("Produto não encontrado");
    res.json(toProductDTO(p));
  }),
);

/* ---- Criar ---- */
adminProductsRouter.post(
  "/",
  validate({ body: productSchema }),
  asyncHandler(async (req, res) => {
    const input = req.body as ProductInput;
    const dupe = await prisma.product.findUnique({ where: { slug: input.slug } });
    if (dupe) throw Conflict("Já existe um produto com este slug.");

    const created = await prisma.product.create({
      data: {
        id: randomUUID(),
        name: input.name,
        slug: input.slug,
        brandId: input.brandId,
        sellerId: "s-torque",
        categorySlug: input.categorySlug,
        subcategorySlug: input.subcategorySlug ?? null,
        listPrice: input.listPrice,
        price: input.price,
        ref: input.ref,
        shortDescription: input.shortDescription,
        description: input.description,
        freeShipping: input.freeShipping,
        offerEndsAt: input.offerEndsAt ? new Date(input.offerEndsAt) : null,
        soldCount: input.soldCount,
        totalStock: computeTotalStock(input),
        rating: 0,
        reviewCount: 0,
        ...nestedCreate(input),
      },
      include: productInclude,
    });
    res.status(201).json(toProductDTO(created));
  }),
);

/* ---- Atualizar (substitui filhos) ---- */
adminProductsRouter.put(
  "/:id",
  validate({ body: productSchema }),
  asyncHandler(async (req, res) => {
    const input = req.body as ProductInput;
    const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!existing) throw NotFound("Produto não encontrado");

    const slugOwner = await prisma.product.findUnique({ where: { slug: input.slug } });
    if (slugOwner && slugOwner.id !== req.params.id) throw Conflict("Slug já usado por outro produto.");

    const updated = await prisma.$transaction(async (tx) => {
      await tx.productImage.deleteMany({ where: { productId: req.params.id } });
      await tx.productSpec.deleteMany({ where: { productId: req.params.id } });
      await tx.productTag.deleteMany({ where: { productId: req.params.id } });
      await tx.variant.deleteMany({ where: { productId: req.params.id } });
      return tx.product.update({
        where: { id: req.params.id },
        data: {
          name: input.name,
          slug: input.slug,
          brandId: input.brandId,
          categorySlug: input.categorySlug,
          subcategorySlug: input.subcategorySlug ?? null,
          listPrice: input.listPrice,
          price: input.price,
          ref: input.ref,
          shortDescription: input.shortDescription,
          description: input.description,
          freeShipping: input.freeShipping,
          offerEndsAt: input.offerEndsAt ? new Date(input.offerEndsAt) : null,
          soldCount: input.soldCount,
          totalStock: computeTotalStock(input),
          ...nestedCreate(input),
        },
        include: productInclude,
      });
    });
    res.json(toProductDTO(updated));
  }),
);

/* ---- Excluir ---- */
adminProductsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!existing) throw NotFound("Produto não encontrado");
    await prisma.product.delete({ where: { id: req.params.id } });
    res.status(204).end();
  }),
);
