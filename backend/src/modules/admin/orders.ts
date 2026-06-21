import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { asyncHandler, NotFound } from "../../lib/errors";
import { validate, getQuery } from "../../middleware/validate";

export const adminOrdersRouter = Router();

// Status que o admin pode definir manualmente (fulfillment).
const STATUSES = ["pago", "enviado", "entregue", "cancelado"] as const;
// Status filtráveis (inclui o de pagamento pendente, definido pelo fluxo Pix).
const FILTER_STATUSES = ["aguardando_pagamento", ...STATUSES] as const;

const listQuery = z.object({
  status: z.enum(FILTER_STATUSES).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

adminOrdersRouter.get(
  "/",
  validate({ query: listQuery }),
  asyncHandler(async (req, res) => {
    const { status, page, pageSize } = getQuery<z.infer<typeof listQuery>>(req);
    const where = status ? { status } : {};
    const [rows, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: { items: true, user: { select: { name: true, email: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.order.count({ where }),
    ]);
    res.json({
      items: rows.map((o) => ({
        id: o.id,
        number: o.number,
        createdAt: o.createdAt.toISOString(),
        status: o.status,
        customer: o.user?.name ?? JSON.parse(o.addressSnapshot).recipient ?? "Visitante",
        email: o.user?.email ?? null,
        itemCount: o.items.reduce((a, i) => a + i.quantity, 0),
        payment: o.payment,
        total: o.total,
        items: o.items.map((i) => ({
          name: i.name,
          variantLabel: i.variantLabel,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          imageUrl: i.imageUrl,
        })),
        address: JSON.parse(o.addressSnapshot),
        shippingLabel: o.shippingLabel,
      })),
      total,
      page,
      pageSize,
      pageCount: Math.max(1, Math.ceil(total / pageSize)),
    });
  }),
);

adminOrdersRouter.patch(
  "/:id/status",
  validate({ body: z.object({ status: z.enum(STATUSES) }) }),
  asyncHandler(async (req, res) => {
    const existing = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!existing) throw NotFound("Pedido não encontrado");
    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { status: req.body.status },
    });
    res.json({ id: order.id, status: order.status });
  }),
);
