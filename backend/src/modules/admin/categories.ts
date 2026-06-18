import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { asyncHandler, BadRequest, Conflict, NotFound } from "../../lib/errors";
import { validate } from "../../middleware/validate";

export const adminCategoriesRouter = Router();

const slugRegex = /^[a-z0-9-]+$/;

// URL opcional que aceita string vazia (tratada como "sem URL" -> placeholder padrão).
const optionalUrl = z.preprocess(
  (v) => (v === "" ? null : v),
  z.string().url("URL inválida.").nullable().optional(),
);

const categorySchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(slugRegex, "Slug deve conter apenas letras minúsculas, números e hífens."),
  parentSlug: z.string().nullable().optional(),
  imageUrl: optionalUrl,
  description: z.string().nullable().optional(),
  featured: z.boolean().default(false),
  position: z.coerce.number().int().min(0).default(0),
});

type CategoryBody = z.infer<typeof categorySchema>;

function defaultImage(name: string): string {
  return `https://placehold.co/600x600/0E0F12/FFFFFF/png?text=${encodeURIComponent(name)}`;
}

/**
 * Renumera as categorias DESTACADAS de um escopo (mesmo parentSlug; null = raízes)
 * para posições contíguas 1..N, mantendo a ordem atual (position, depois nome).
 * Mantém as não-destacadas em 0. Chamado após cada mutação para evitar buracos/drift.
 */
async function renumberFeatured(parentSlug: string | null) {
  const featured = await prisma.category.findMany({
    where: { parentSlug, featured: true },
    orderBy: [{ position: "asc" }, { name: "asc" }],
  });
  await prisma.$transaction([
    ...featured.map((c, i) =>
      prisma.category.update({ where: { id: c.id }, data: { position: i + 1 } }),
    ),
    // Garante que as não-destacadas fiquem zeradas.
    prisma.category.updateMany({
      where: { parentSlug, featured: false },
      data: { position: 0 },
    }),
  ]);
}

/** Garante que parentSlug exista e seja uma categoria-raiz (sem aninhamento profundo). */
async function validateParent(parentSlug: string | null | undefined, ownSlug?: string) {
  if (!parentSlug) return;
  if (parentSlug === ownSlug) throw BadRequest("Uma categoria não pode ser pai dela mesma.");
  const parent = await prisma.category.findUnique({ where: { slug: parentSlug } });
  if (!parent) throw BadRequest("Categoria-pai inexistente.");
  if (parent.parentSlug) throw BadRequest("A categoria-pai precisa ser uma categoria-raiz.");
}

/** Lista categorias com contagem de produtos e de subcategorias. */
adminCategoriesRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const cats = await prisma.category.findMany({
      orderBy: [{ featured: "desc" }, { position: "asc" }, { name: "asc" }],
    });
    const counts = await Promise.all(
      cats.map(async (c) => {
        const [products, subcats] = await Promise.all([
          prisma.product.count({
            where: { OR: [{ categorySlug: c.slug }, { subcategorySlug: c.slug }] },
          }),
          prisma.category.count({ where: { parentSlug: c.slug } }),
        ]);
        return { slug: c.slug, products, subcats };
      }),
    );
    const byCat = new Map(counts.map((c) => [c.slug, c]));
    res.json(
      cats.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        parentSlug: c.parentSlug ?? null,
        imageUrl: c.imageUrl,
        description: c.description ?? null,
        featured: c.featured,
        position: c.position,
        productCount: byCat.get(c.slug)?.products ?? 0,
        subcategoryCount: byCat.get(c.slug)?.subcats ?? 0,
      })),
    );
  }),
);

adminCategoriesRouter.post(
  "/",
  validate({ body: categorySchema }),
  asyncHandler(async (req, res) => {
    const body = req.body as CategoryBody;
    if (await prisma.category.findUnique({ where: { slug: body.slug } })) {
      throw Conflict("Já existe uma categoria com este slug.");
    }
    await validateParent(body.parentSlug, body.slug);
    const id = `c-${body.slug}`;
    if (await prisma.category.findUnique({ where: { id } })) {
      throw Conflict("Já existe uma categoria com este identificador.");
    }
    await prisma.category.create({
      data: {
        id,
        name: body.name,
        slug: body.slug,
        parentSlug: body.parentSlug || null,
        imageUrl: body.imageUrl || defaultImage(body.name),
        description: body.description || null,
        featured: body.featured,
        position: body.position,
      },
    });
    await renumberFeatured(body.parentSlug || null);
    res.status(201).json(await prisma.category.findUnique({ where: { id } }));
  }),
);

adminCategoriesRouter.put(
  "/:id",
  validate({ body: categorySchema }),
  asyncHandler(async (req, res) => {
    const body = req.body as CategoryBody;
    const existing = await prisma.category.findUnique({ where: { id: req.params.id } });
    if (!existing) throw NotFound("Categoria não encontrada");
    const slugOwner = await prisma.category.findUnique({ where: { slug: body.slug } });
    if (slugOwner && slugOwner.id !== req.params.id) throw Conflict("Slug já usado por outra categoria.");
    await validateParent(body.parentSlug, body.slug);
    await prisma.category.update({
      where: { id: req.params.id },
      data: {
        name: body.name,
        slug: body.slug,
        parentSlug: body.parentSlug || null,
        imageUrl: body.imageUrl || existing.imageUrl,
        description: body.description || null,
        featured: body.featured,
        position: body.position,
      },
    });
    // Renumera o escopo atual e, se mudou de pai, o anterior também.
    const newParent = body.parentSlug || null;
    const oldParent = existing.parentSlug ?? null;
    await renumberFeatured(newParent);
    if (oldParent !== newParent) await renumberFeatured(oldParent);
    res.json(await prisma.category.findUnique({ where: { id: req.params.id } }));
  }),
);

adminCategoriesRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const existing = await prisma.category.findUnique({ where: { id: req.params.id } });
    if (!existing) throw NotFound("Categoria não encontrada");

    const products = await prisma.product.count({
      where: { OR: [{ categorySlug: existing.slug }, { subcategorySlug: existing.slug }] },
    });
    if (products > 0) {
      throw BadRequest(
        `Não é possível excluir: há ${products} produto(s) nesta categoria. Reatribua ou remova-os antes.`,
      );
    }
    const subcats = await prisma.category.count({ where: { parentSlug: existing.slug } });
    if (subcats > 0) {
      throw BadRequest(
        `Não é possível excluir: esta categoria possui ${subcats} subcategoria(s). Exclua-as antes.`,
      );
    }
    await prisma.category.delete({ where: { id: req.params.id } });
    await renumberFeatured(existing.parentSlug ?? null);
    res.status(204).end();
  }),
);
