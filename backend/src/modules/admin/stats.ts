import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../lib/errors";
import { round2 } from "../../lib/format";

export const adminStatsRouter = Router();

const ALLOWED_DAYS = [7, 30, 90];

function emptyDayMap<T>(days: number, init: () => T): Map<string, T> {
  const map = new Map<string, T>();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    map.set(d.toISOString().slice(0, 10), init());
  }
  return map;
}

adminStatsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const days = ALLOWED_DAYS.includes(Number(req.query.days)) ? Number(req.query.days) : 30;
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    since.setDate(since.getDate() - (days - 1));

    const [
      revenueAgg,
      statusGroups,
      recent,
      products,
      brands,
      reviewsByRating,
      reviewAgg,
      users,
      coupons,
      wishlistGroups,
      newsletterCount,
      categories,
      validOrders,
      orderItems,
    ] = await Promise.all([
      prisma.order.aggregate({
        where: { status: { not: "cancelado" } },
        _sum: { total: true, discount: true, shipping: true },
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
        select: {
          id: true,
          name: true,
          slug: true,
          categorySlug: true,
          brandId: true,
          price: true,
          totalStock: true,
          soldCount: true,
        },
      }),
      prisma.brand.findMany({ select: { id: true, name: true } }),
      prisma.review.groupBy({ by: ["rating"], _count: true }),
      prisma.review.aggregate({ _avg: { rating: true }, _count: true }),
      prisma.user.findMany({ select: { createdAt: true } }),
      prisma.coupon.findMany({ select: { code: true, usedCount: true } }),
      prisma.wishlistItem.groupBy({
        by: ["productId"],
        _count: true,
        orderBy: { _count: { productId: "desc" } },
        take: 6,
      }),
      prisma.newsletterSubscriber.count(),
      prisma.category.findMany({ select: { slug: true, name: true } }),
      prisma.order.findMany({
        where: { status: { not: "cancelado" } },
        select: {
          total: true,
          payment: true,
          shipping: true,
          createdAt: true,
          shippingLabel: true,
          userId: true,
          addressSnapshot: true,
        },
      }),
      prisma.orderItem.findMany({
        where: { order: { status: { not: "cancelado" } } },
        select: { productId: true, unitPrice: true, quantity: true },
      }),
    ]);

    const productById = new Map(products.map((p) => [p.id, p]));
    const categoryName = new Map(categories.map((c) => [c.slug, c.name]));
    const brandName = new Map(brands.map((b) => [b.id, b.name]));

    // ---- KPIs ----
    const stockUnits = products.reduce((acc, p) => acc + p.totalStock, 0);
    const stockValue = round2(products.reduce((acc, p) => acc + p.totalStock * p.price, 0));
    const itemsSold = products.reduce((acc, p) => acc + p.soldCount, 0);
    const outOfStock = products.filter((p) => p.totalStock <= 0).length;
    const newCustomers = users.filter((u) => u.createdAt >= since).length;

    // ---- Séries por dia (período selecionado) ----
    const revDay = emptyDayMap(days, () => ({ revenue: 0, orders: 0 }));
    const usersDay = emptyDayMap(days, () => 0);
    const payMap = new Map<string, { count: number; revenue: number }>();
    const shipMap = new Map<string, number>();
    const stateMap = new Map<string, number>();
    const custMap = new Map<string, { revenue: number; orders: number }>();

    for (const o of validOrders) {
      const key = o.createdAt.toISOString().slice(0, 10);
      const b = revDay.get(key);
      if (b) {
        b.revenue += o.total;
        b.orders += 1;
      }
      const pay = payMap.get(o.payment) ?? { count: 0, revenue: 0 };
      pay.count += 1;
      pay.revenue += o.total;
      payMap.set(o.payment, pay);
      shipMap.set(o.shippingLabel, (shipMap.get(o.shippingLabel) ?? 0) + 1);
      // Estado (UF) a partir do snapshot do endereço.
      try {
        const uf = (JSON.parse(o.addressSnapshot)?.state as string | undefined)?.toUpperCase();
        if (uf) stateMap.set(uf, (stateMap.get(uf) ?? 0) + 1);
      } catch {
        /* snapshot inválido — ignora */
      }
      // Cliente (pedidos com usuário).
      if (o.userId) {
        const c = custMap.get(o.userId) ?? { revenue: 0, orders: 0 };
        c.revenue += o.total;
        c.orders += 1;
        custMap.set(o.userId, c);
      }
    }
    for (const u of users) {
      const key = u.createdAt.toISOString().slice(0, 10);
      if (usersDay.has(key)) usersDay.set(key, (usersDay.get(key) ?? 0) + 1);
    }

    // ---- Receita por categoria e por marca (itens de pedidos válidos) ----
    const catRevenue = new Map<string, number>();
    const brandRevenue = new Map<string, number>();
    for (const it of orderItems) {
      const p = productById.get(it.productId);
      if (!p) continue;
      const value = it.unitPrice * it.quantity;
      catRevenue.set(p.categorySlug, (catRevenue.get(p.categorySlug) ?? 0) + value);
      brandRevenue.set(p.brandId, (brandRevenue.get(p.brandId) ?? 0) + value);
    }

    // ---- Top clientes (precisa dos nomes) ----
    const topCustEntries = [...custMap.entries()]
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 5);
    const custUsers = topCustEntries.length
      ? await prisma.user.findMany({
          where: { id: { in: topCustEntries.map(([id]) => id) } },
          select: { id: true, name: true },
        })
      : [];
    const custNameById = new Map(custUsers.map((u) => [u.id, u.name]));

    const ratingMap = new Map<number, number>();
    for (const r of reviewsByRating) ratingMap.set(r.rating, r._count);

    res.json({
      periodDays: days,
      // KPIs
      revenue: revenueAgg._sum.total ?? 0,
      orderCount: revenueAgg._count,
      avgTicket: revenueAgg._avg.total ?? 0,
      itemsSold,
      productCount: products.length,
      outOfStock,
      userCount: users.length,
      newCustomers,
      couponCount: coupons.length,
      reviewCount: reviewAgg._count,
      avgRating: round2(reviewAgg._avg.rating ?? 0),
      newsletterCount,
      stockUnits,
      stockValue,
      totalDiscount: round2(revenueAgg._sum.discount ?? 0),
      totalShipping: round2(revenueAgg._sum.shipping ?? 0),

      // Séries / distribuições
      revenueByDay: [...revDay.entries()].map(([date, v]) => ({
        date,
        revenue: round2(v.revenue),
        orders: v.orders,
      })),
      newUsersByDay: [...usersDay.entries()].map(([date, count]) => ({ date, count })),
      statusCounts: statusGroups.map((g) => ({ status: g.status, count: g._count })),
      paymentBreakdown: [...payMap.entries()].map(([payment, v]) => ({
        payment,
        count: v.count,
        revenue: round2(v.revenue),
      })),
      shippingUsage: [...shipMap.entries()]
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count),
      ordersByState: [...stateMap.entries()]
        .map(([uf, count]) => ({ uf, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      revenueByCategory: [...catRevenue.entries()]
        .map(([slug, revenue]) => ({ slug, name: categoryName.get(slug) ?? slug, revenue: round2(revenue) }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 8),
      revenueByBrand: [...brandRevenue.entries()]
        .map(([id, revenue]) => ({ name: brandName.get(id) ?? id, revenue: round2(revenue) }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 8),
      ratingDistribution: [5, 4, 3, 2, 1].map((rating) => ({ rating, count: ratingMap.get(rating) ?? 0 })),
      topCoupons: coupons
        .filter((c) => c.usedCount > 0)
        .sort((a, b) => b.usedCount - a.usedCount)
        .slice(0, 6)
        .map((c) => ({ code: c.code, usedCount: c.usedCount })),
      topWishlisted: wishlistGroups
        .map((w) => ({ id: w.productId, name: productById.get(w.productId)?.name ?? "Produto", count: w._count }))
        .filter((w) => w.count > 0),
      topCustomers: topCustEntries.map(([id, v]) => ({
        name: custNameById.get(id) ?? "Cliente",
        revenue: round2(v.revenue),
        orders: v.orders,
      })),

      // Listas
      topProducts: [...products]
        .sort((a, b) => b.soldCount - a.soldCount)
        .slice(0, 5)
        .map((p) => ({ id: p.id, name: p.name, slug: p.slug, soldCount: p.soldCount, price: p.price })),
      lowStock: [...products]
        .filter((p) => p.totalStock <= 5)
        .sort((a, b) => a.totalStock - b.totalStock)
        .slice(0, 8)
        .map((p) => ({ id: p.id, name: p.name, slug: p.slug, totalStock: p.totalStock })),
      recentOrders: recent.map((o) => ({ ...o, createdAt: o.createdAt.toISOString() })),
    });
  }),
);
