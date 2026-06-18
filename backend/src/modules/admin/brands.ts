import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { asyncHandler, BadRequest, Conflict, NotFound } from "../../lib/errors";
import { validate } from "../../middleware/validate";

export const adminBrandsRouter = Router();

const slugRegex = /^[a-z0-9-]+$/;

// URL opcional que aceita string vazia (tratada como "sem URL" -> logo padrão).
const optionalUrl = z.preprocess(
  (v) => (v === "" ? null : v),
  z.string().url("URL inválida.").nullable().optional(),
);

const brandSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(slugRegex, "Slug deve conter apenas letras minúsculas, números e hífens."),
  logoUrl: optionalUrl,
});

type BrandBody = z.infer<typeof brandSchema>;

/** Logo tipográfico padrão (mesmo estilo dos dados de seed). */
function defaultLogo(name: string): string {
  return `https://placehold.co/200x80/0E0F12/FFFFFF/png?text=${encodeURIComponent(name)}&font=montserrat`;
}

/** Lista as marcas com a contagem de produtos vinculados. */
adminBrandsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const brands = await prisma.brand.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { products: true } } },
    });
    res.json(
      brands.map((b) => ({
        id: b.id,
        name: b.name,
        slug: b.slug,
        logoUrl: b.logoUrl,
        productCount: b._count.products,
      })),
    );
  }),
);

adminBrandsRouter.post(
  "/",
  validate({ body: brandSchema }),
  asyncHandler(async (req, res) => {
    const body = req.body as BrandBody;
    if (await prisma.brand.findUnique({ where: { slug: body.slug } })) {
      throw Conflict("Já existe uma marca com este slug.");
    }
    const id = `b-${body.slug}`;
    if (await prisma.brand.findUnique({ where: { id } })) {
      throw Conflict("Já existe uma marca com este identificador.");
    }
    const brand = await prisma.brand.create({
      data: { id, name: body.name, slug: body.slug, logoUrl: body.logoUrl || defaultLogo(body.name) },
    });
    res.status(201).json(brand);
  }),
);

adminBrandsRouter.put(
  "/:id",
  validate({ body: brandSchema }),
  asyncHandler(async (req, res) => {
    const body = req.body as BrandBody;
    const existing = await prisma.brand.findUnique({ where: { id: req.params.id } });
    if (!existing) throw NotFound("Marca não encontrada");
    const slugOwner = await prisma.brand.findUnique({ where: { slug: body.slug } });
    if (slugOwner && slugOwner.id !== req.params.id) throw Conflict("Slug já usado por outra marca.");
    const brand = await prisma.brand.update({
      where: { id: req.params.id },
      data: { name: body.name, slug: body.slug, logoUrl: body.logoUrl || existing.logoUrl },
    });
    res.json(brand);
  }),
);

adminBrandsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const existing = await prisma.brand.findUnique({ where: { id: req.params.id } });
    if (!existing) throw NotFound("Marca não encontrada");
    const linked = await prisma.product.count({ where: { brandId: req.params.id } });
    if (linked > 0) {
      throw BadRequest(
        `Não é possível excluir: há ${linked} produto(s) vinculado(s) a esta marca. Reatribua ou remova-os antes.`,
      );
    }
    await prisma.brand.delete({ where: { id: req.params.id } });
    res.status(204).end();
  }),
);
