import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../lib/errors";

export const adminStatsRouter = Router();

adminStatsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const [revenueAgg, statusGroups, recent, top, lowStock, productCount, userCount, couponCount] =
      await Promise.all([
        prisma.order.aggregate({
          where: { status: { not: "cancelado" } },
          _sum: { total: true },
          _count: true,
          _avg: { total: true },
        }),
        prisma.order.groupBy({ by: ["status"], _count: true }),
        prisma.order.findMany({
          orderBy: { createdAt: "desc" },
          take: 6,
          select: { id: true, number: true, total: true, status: true, createdAt: true },
        }),
        prisma.product.findMany({
          orderBy: { soldCount: "desc" },
          take: 5,
          select: { id: true, name: true, slug: true, soldCount: true, price: true },
        }),
        prisma.product.findMany({
          where: { totalStock: { lte: 5 } },
          orderBy: { totalStock: "asc" },
          take: 8,
          select: { id: true, name: true, slug: true, totalStock: true },
        }),
        prisma.product.count(),
        prisma.user.count(),
        prisma.coupon.count(),
      ]);

    res.json({
      revenue: revenueAgg._sum.total ?? 0,
      orderCount: revenueAgg._count,
      avgTicket: revenueAgg._avg.total ?? 0,
      statusCounts: statusGroups.map((g) => ({ status: g.status, count: g._count })),
      recentOrders: recent.map((o) => ({ ...o, createdAt: o.createdAt.toISOString() })),
      topProducts: top,
      lowStock,
      productCount,
      userCount,
      couponCount,
    });
  }),
);
