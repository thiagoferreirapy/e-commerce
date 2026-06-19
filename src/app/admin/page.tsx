"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getStats, type AdminStats } from "@/services/admin";
import { formatBRL, formatDateShort } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import { AreaTrend, Donut, HBars, FLAME, INK } from "@/components/admin/AdminCharts";

const STATUS_TONE: Record<string, "success" | "ink" | "warning" | "danger" | "neutral"> = {
  entregue: "success",
  enviado: "ink",
  pago: "warning",
  cancelado: "danger",
};
const STATUS_COLOR: Record<string, string> = {
  entregue: "#1F9D55",
  enviado: INK,
  pago: "#D9920B",
  cancelado: "#D92D20",
};
const PAYMENT_COLOR: Record<string, string> = { pix: "#1F9D55", cartao: INK, boleto: "#D9920B" };
const PAYMENT_LABEL: Record<string, string> = { pix: "Pix", cartao: "Cartão", boleto: "Boleto" };
const PERIODS = [7, 30, 90];

/** Moeda compacta para KPIs (evita estourar o card com valores grandes). */
function kpiBRL(v: number): string {
  if (v >= 1_000_000)
    return `R$ ${(v / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} mi`;
  if (v >= 100_000)
    return `R$ ${(v / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 0 })} mil`;
  return formatBRL(v);
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [days, setDays] = useState(30);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    getStats(days)
      .then((s) => active && setStats(s))
      .catch(() => active && setError(true));
    return () => {
      active = false;
    };
  }, [days]);

  if (error) return <p className="text-sm text-danger">Não foi possível carregar as métricas.</p>;
  if (!stats) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl border border-neutral-200 bg-neutral-100" />
        ))}
      </div>
    );
  }

  const totalOrders = stats.statusCounts.reduce((a, s) => a + s.count, 0);
  const aEnviar = stats.statusCounts.find((s) => s.status === "pago")?.count ?? 0;
  const cancelados = stats.statusCounts.find((s) => s.status === "cancelado")?.count ?? 0;
  const cancelRate = totalOrders ? `${((cancelados / totalOrders) * 100).toFixed(1)}%` : "0%";
  const periodRevenue = stats.revenueByDay.reduce((a, d) => a + d.revenue, 0);

  const kpis: { label: string; value: string; title?: string; hint?: string; accent?: boolean }[] = [
    { label: "Receita", value: kpiBRL(stats.revenue), title: formatBRL(stats.revenue), accent: true },
    { label: "Pedidos", value: String(stats.orderCount) },
    { label: "Ticket médio", value: kpiBRL(stats.avgTicket), title: formatBRL(stats.avgTicket) },
    { label: "Itens vendidos", value: stats.itemsSold.toLocaleString("pt-BR") },
    { label: "A enviar", value: String(aEnviar) },
    { label: "Cancelamento", value: cancelRate },
    { label: "Desconto", value: kpiBRL(stats.totalDiscount), title: formatBRL(stats.totalDiscount) },
    { label: "Frete arrecadado", value: kpiBRL(stats.totalShipping), title: formatBRL(stats.totalShipping) },
    { label: "Valor em estoque", value: kpiBRL(stats.stockValue), title: formatBRL(stats.stockValue) },
    { label: "Unidades", value: stats.stockUnits.toLocaleString("pt-BR") },
    { label: "Produtos", value: String(stats.productCount) },
    { label: "Esgotados", value: String(stats.outOfStock) },
    { label: "Clientes", value: String(stats.userCount), hint: `+${stats.newCustomers} em ${days}d` },
    {
      label: "Avaliações",
      value: String(stats.reviewCount),
      hint: stats.reviewCount ? `★ ${stats.avgRating.toFixed(1)}` : undefined,
    },
    { label: "Newsletter", value: String(stats.newsletterCount) },
  ];

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {kpis.map((c) => (
          <div
            key={c.label}
            className={
              "min-w-0 rounded-xl border bg-white p-4 transition-shadow hover:shadow-sm " +
              (c.accent ? "border-flame/30 ring-1 ring-flame/10" : "border-neutral-200")
            }
          >
            <p className="truncate text-2xs font-semibold uppercase tracking-wide text-neutral-400">
              {c.label}
            </p>
            <p
              title={c.title}
              className={
                "mt-1 truncate text-lg font-extrabold tracking-tight tabular-nums " +
                (c.accent ? "text-flame" : "text-ink")
              }
            >
              {c.value}
            </p>
            {c.hint && <p className="mt-0.5 text-2xs font-semibold text-success">{c.hint}</p>}
          </div>
        ))}
      </div>

      {/* Seletor de período */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">
          Tendências
        </h2>
        <div className="inline-flex rounded-lg border border-neutral-200 bg-white p-0.5">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setDays(p)}
              aria-pressed={days === p}
              className={
                "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors " +
                (days === p ? "bg-flame text-white" : "text-neutral-500 hover:text-ink")
              }
            >
              {p}d
            </button>
          ))}
        </div>
      </div>

      {/* Tendências por dia */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Receita" subtitle={`Total no período: ${formatBRL(periodRevenue)}`}>
          <AreaTrend data={stats.revenueByDay} xKey="date" yKey="revenue" color={FLAME} valueFormatter={formatBRL} valueLabel="Receita" />
        </Card>
        <Card title="Pedidos por dia">
          <AreaTrend data={stats.revenueByDay} xKey="date" yKey="orders" color={INK} valueFormatter={(v) => `${v} pedido(s)`} valueLabel="Pedidos" />
        </Card>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Card title="Novos clientes">
          <AreaTrend data={stats.newUsersByDay} xKey="date" yKey="count" color="#1F9D55" valueFormatter={(v) => `${v} cliente(s)`} valueLabel="Novos" />
        </Card>
        <Card title="Top clientes (por receita)">
          {stats.topCustomers.length ? (
            <ul className="-mx-2 divide-y divide-neutral-100">
              {stats.topCustomers.map((c, i) => (
                <li key={c.name + i} className="flex items-center justify-between gap-3 px-2 py-2.5 text-sm">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="text-neutral-400">{i + 1}.</span>
                    <span className="truncate font-medium text-ink">{c.name}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="text-xs text-neutral-400">{c.orders} ped.</span>
                    <span className="font-semibold text-ink">{formatBRL(c.revenue)}</span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>Sem clientes com pedidos.</Empty>
          )}
        </Card>
      </div>

      {/* Status / Pagamento / Entrega */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Pedidos por status">
          {stats.statusCounts.length ? (
            <Donut data={stats.statusCounts} valueKey="count" nameKey="status" colors={stats.statusCounts.map((s) => STATUS_COLOR[s.status] ?? "#A8A096")} valueFormatter={(v) => `${v} pedido(s)`} />
          ) : (
            <Empty>Nenhum pedido ainda.</Empty>
          )}
        </Card>
        <Card title="Receita por pagamento">
          {stats.paymentBreakdown.length ? (
            <Donut data={stats.paymentBreakdown.map((p) => ({ ...p, label: PAYMENT_LABEL[p.payment] ?? p.payment }))} valueKey="revenue" nameKey="label" colors={stats.paymentBreakdown.map((p) => PAYMENT_COLOR[p.payment] ?? "#A8A096")} valueFormatter={formatBRL} />
          ) : (
            <Empty>Nenhum pagamento ainda.</Empty>
          )}
        </Card>
        <Card title="Pedidos por método de entrega">
          {stats.shippingUsage.length ? (
            <Donut data={stats.shippingUsage} valueKey="count" nameKey="label" valueFormatter={(v) => `${v} pedido(s)`} />
          ) : (
            <Empty>Nenhum envio ainda.</Empty>
          )}
        </Card>
      </div>

      {/* Mais vendidos / Receita por categoria */}
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Card title="Mais vendidos (unidades)">
          {stats.topProducts.length ? (
            <HBars data={stats.topProducts} categoryKey="name" valueKey="soldCount" valueLabel="Vendidos" />
          ) : (
            <Empty>Sem vendas registradas.</Empty>
          )}
        </Card>
        <Card title="Receita por categoria">
          {stats.revenueByCategory.length ? (
            <HBars data={stats.revenueByCategory} categoryKey="name" valueKey="revenue" color={INK} valueFormatter={formatBRL} valueLabel="Receita" />
          ) : (
            <Empty>Sem vendas por categoria.</Empty>
          )}
        </Card>
      </div>

      {/* Receita por marca / Pedidos por estado */}
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Card title="Receita por marca">
          {stats.revenueByBrand.length ? (
            <HBars data={stats.revenueByBrand} categoryKey="name" valueKey="revenue" color={INK} valueFormatter={formatBRL} valueLabel="Receita" />
          ) : (
            <Empty>Sem vendas por marca.</Empty>
          )}
        </Card>
        <Card title="Pedidos por estado (UF)">
          {stats.ordersByState.length ? (
            <HBars data={stats.ordersByState} categoryKey="uf" valueKey="count" valueLabel="Pedidos" />
          ) : (
            <Empty>Sem pedidos com endereço.</Empty>
          )}
        </Card>
      </div>

      {/* Avaliações / Cupons / Wishlist */}
      <div className="grid items-start gap-6 lg:grid-cols-3">
        <Card title="Distribuição de avaliações" subtitle={stats.reviewCount ? `Média ★ ${stats.avgRating.toFixed(1)}` : undefined}>
          {stats.reviewCount ? (
            <HBars data={stats.ratingDistribution.map((r) => ({ ...r, label: `${r.rating}★` }))} categoryKey="label" valueKey="count" color="#D9920B" valueLabel="Avaliações" />
          ) : (
            <Empty>Nenhuma avaliação ainda.</Empty>
          )}
        </Card>
        <Card title="Cupons mais usados">
          {stats.topCoupons.length ? (
            <HBars data={stats.topCoupons} categoryKey="code" valueKey="usedCount" color={INK} valueLabel="Usos" />
          ) : (
            <Empty>Nenhum cupom resgatado.</Empty>
          )}
        </Card>
        <Card title="Mais favoritados">
          {stats.topWishlisted.length ? (
            <HBars data={stats.topWishlisted} categoryKey="name" valueKey="count" valueLabel="Favoritos" />
          ) : (
            <Empty>Nenhum favorito ainda.</Empty>
          )}
        </Card>
      </div>

      {/* Estoque baixo / Pedidos recentes */}
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Card title="Estoque baixo (≤ 5)" subtitle="Clique para repor no cadastro do produto">
          {stats.lowStock.length === 0 ? (
            <Empty>Tudo abastecido. 👍</Empty>
          ) : (
            <ul className="-mx-2 divide-y divide-neutral-100">
              {stats.lowStock.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/admin/produtos/${p.id}`}
                    className="flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 text-sm transition-colors hover:bg-neutral-50"
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span className={"size-2 shrink-0 rounded-full " + (p.totalStock === 0 ? "bg-danger" : "bg-warning")} />
                      <span className="truncate font-medium text-ink">{p.name}</span>
                    </span>
                    <span className="shrink-0">
                      <Badge tone={p.totalStock === 0 ? "danger" : "warning"}>
                        {p.totalStock === 0 ? "Esgotado" : `${p.totalStock} un.`}
                      </Badge>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card
          title="Pedidos recentes"
          action={
            <Link href="/admin/pedidos" className="text-sm font-semibold text-flame hover:underline">
              Ver todos
            </Link>
          }
        >
          {stats.recentOrders.length === 0 ? (
            <Empty>Nenhum pedido ainda.</Empty>
          ) : (
            <ul className="-mx-2 divide-y divide-neutral-100">
              {stats.recentOrders.map((o) => (
                <li key={o.id}>
                  <Link
                    href="/admin/pedidos"
                    className="flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-neutral-50"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-mono text-sm font-semibold text-ink">
                        {o.number}
                      </span>
                      <span className="text-xs text-neutral-400">{formatDateShort(o.createdAt)}</span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1">
                      <span className="whitespace-nowrap text-sm font-bold text-ink">
                        {formatBRL(o.total)}
                      </span>
                      <Badge tone={STATUS_TONE[o.status] ?? "neutral"}>{o.status}</Badge>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function Card({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0 overflow-hidden rounded-xl border border-neutral-200 bg-white p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-bold text-ink">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-neutral-400">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-8 text-center text-sm text-neutral-400">{children}</p>;
}
