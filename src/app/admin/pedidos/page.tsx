"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import type { OrderStatus } from "@/types";
import { listAdminOrders, updateOrderStatus, type AdminOrder } from "@/services/admin";
import { toast } from "@/store/toast";
import { formatBRL, formatDateShort } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";

const STATUSES: OrderStatus[] = ["pago", "enviado", "entregue", "cancelado"];
const STATUS_TONE: Record<OrderStatus, "success" | "ink" | "warning" | "danger"> = {
  entregue: "success",
  enviado: "ink",
  pago: "warning",
  cancelado: "danger",
};

export default function AdminOrdersPage() {
  const [filter, setFilter] = useState<OrderStatus | "todos">("todos");
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    listAdminOrders({ status: filter === "todos" ? undefined : filter, pageSize: 100 })
      .then((r) => setOrders(r.items))
      .catch(() => toast.error("Erro ao carregar pedidos."))
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => load(), [load]);

  async function changeStatus(id: string, status: OrderStatus) {
    try {
      await updateOrderStatus(id, status);
      setOrders((os) => os.map((o) => (o.id === id ? { ...o, status } : o)));
      toast.success(`Pedido atualizado para "${status}".`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar status.");
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-ink">Pedidos</h2>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {(["todos", ...STATUSES] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={cn(
              "rounded-full border px-3 py-1 text-sm font-medium capitalize transition-colors",
              filter === s
                ? "border-flame bg-flame-50 text-flame-700"
                : "border-neutral-300 text-neutral-500 hover:bg-neutral-50",
            )}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-400">
            <tr>
              <th className="px-4 py-3">Pedido</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-neutral-400">Carregando…</td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-neutral-400">Nenhum pedido.</td>
              </tr>
            ) : (
              orders.map((o) => (
                <Fragment key={o.id}>
                  <tr className="hover:bg-neutral-50">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setExpanded(expanded === o.id ? null : o.id)}
                        className="font-medium text-ink hover:text-flame"
                      >
                        {o.number}
                      </button>
                      <p className="text-xs text-neutral-400">{o.itemCount} item(ns) · {o.payment}</p>
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {o.customer}
                      {o.email && <p className="text-xs text-neutral-400">{o.email}</p>}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">{formatDateShort(o.createdAt)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-ink">{formatBRL(o.total)}</td>
                    <td className="px-4 py-3">
                      <select
                        value={o.status}
                        onChange={(e) => changeStatus(o.id, e.target.value as OrderStatus)}
                        className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm capitalize focus:border-flame focus:outline-none focus:ring-2 focus:ring-flame/30"
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                  {expanded === o.id && (
                    <tr className="bg-neutral-50">
                      <td colSpan={5} className="px-4 py-3">
                        <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
                          <ul className="space-y-1.5 text-sm">
                            {o.items.map((it, i) => (
                              <li key={i} className="flex justify-between gap-3">
                                <span className="text-neutral-700">
                                  {it.quantity}× {it.name}
                                  {it.variantLabel ? ` (${it.variantLabel})` : ""}
                                </span>
                                <span className="font-medium">{formatBRL(it.unitPrice * it.quantity)}</span>
                              </li>
                            ))}
                          </ul>
                          <div className="text-sm text-neutral-600">
                            <Badge tone={STATUS_TONE[o.status]}>{o.status}</Badge>
                            <p className="mt-2">
                              Entrega: <strong>{o.shippingLabel}</strong>
                              <br />
                              {o.address.recipient}
                              <br />
                              {o.address.street}, {o.address.number}
                              <br />
                              {o.address.city}/{o.address.state}
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
