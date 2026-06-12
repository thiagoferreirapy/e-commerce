"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getStats, type AdminStats } from "@/services/admin";
import { formatBRL, formatDateShort } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";

const STATUS_TONE: Record<string, "success" | "ink" | "warning" | "danger" | "neutral"> = {
  entregue: "success",
  enviado: "ink",
  pago: "warning",
  cancelado: "danger",
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    getStats().then(setStats).catch(() => setError(true));
  }, []);

  if (error) return <p className="text-sm text-danger">Não foi possível carregar as métricas.</p>;
  if (!stats) return <p className="text-sm text-neutral-400">Carregando métricas…</p>;

  const cards = [
    { label: "Receita (pedidos válidos)", value: formatBRL(stats.revenue) },
    { label: "Pedidos", value: String(stats.orderCount) },
    { label: "Ticket médio", value: formatBRL(stats.avgTicket) },
    { label: "Produtos", value: String(stats.productCount) },
    { label: "Clientes", value: String(stats.userCount) },
    { label: "Cupons ativos", value: String(stats.couponCount) },
  ];

  return (
    <div className="space-y-6">
      {/* Cards de métrica */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-neutral-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">{c.label}</p>
            <p className="mt-1 text-2xl font-extrabold text-ink">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Status de pedidos */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5">
        <h2 className="mb-3 font-bold text-ink">Pedidos por status</h2>
        <div className="flex flex-wrap gap-2">
          {stats.statusCounts.length === 0 && (
            <p className="text-sm text-neutral-400">Nenhum pedido ainda.</p>
          )}
          {stats.statusCounts.map((s) => (
            <Badge key={s.status} tone={STATUS_TONE[s.status] ?? "neutral"}>
              {s.status}: {s.count}
            </Badge>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Mais vendidos */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <h2 className="mb-3 font-bold text-ink">Mais vendidos</h2>
          <ul className="space-y-2">
            {stats.topProducts.map((p, i) => (
              <li key={p.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="text-neutral-400">{i + 1}.</span>
                  <Link href={`/produto/${p.slug}`} className="truncate hover:text-flame">
                    {p.name}
                  </Link>
                </span>
                <span className="shrink-0 font-semibold text-ink">{p.soldCount} un.</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Estoque baixo */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <h2 className="mb-3 font-bold text-ink">Estoque baixo (≤ 5)</h2>
          {stats.lowStock.length === 0 ? (
            <p className="text-sm text-neutral-400">Tudo abastecido. 👍</p>
          ) : (
            <ul className="space-y-2">
              {stats.lowStock.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 text-sm">
                  <Link href={`/produto/${p.slug}`} className="truncate hover:text-flame">
                    {p.name}
                  </Link>
                  <Badge tone={p.totalStock === 0 ? "danger" : "warning"}>{p.totalStock} un.</Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Pedidos recentes */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold text-ink">Pedidos recentes</h2>
          <Link href="/admin/pedidos" className="text-sm font-semibold text-flame hover:underline">
            Ver todos
          </Link>
        </div>
        <div className="divide-y divide-neutral-100">
          {stats.recentOrders.map((o) => (
            <div key={o.id} className="flex items-center justify-between gap-3 py-2 text-sm">
              <span className="font-medium text-ink">{o.number}</span>
              <span className="text-neutral-500">{formatDateShort(o.createdAt)}</span>
              <Badge tone={STATUS_TONE[o.status] ?? "neutral"}>{o.status}</Badge>
              <span className="font-semibold text-ink">{formatBRL(o.total)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
