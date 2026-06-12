"use client";

import { useState } from "react";
import Link from "next/link";
import type { Order, OrderStatus } from "@/types";
import { useAuthStore } from "@/store/auth";
import { useMounted } from "@/lib/hooks";
import { getMyOrders } from "@/services/orders";
import { formatBRL, formatDateShort } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CheckIcon } from "@/components/ui/icons";

const STEPS: { key: OrderStatus; label: string }[] = [
  { key: "pago", label: "Pagamento aprovado" },
  { key: "enviado", label: "Pedido enviado" },
  { key: "entregue", label: "Pedido entregue" },
];

export function TrackOrder() {
  const mounted = useMounted();
  const user = useAuthStore((s) => s.user);
  const [code, setCode] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function search(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setOrder(null);
    setSearched(true);
    if (!code.trim()) return;
    setLoading(true);
    try {
      const orders = await getMyOrders();
      const found = orders.find((o) => o.number.toLowerCase() === code.trim().toLowerCase());
      if (found) setOrder(found);
      else setError("Não encontramos esse pedido na sua conta. Confira o número e tente novamente.");
    } catch {
      setError("Não foi possível consultar agora. Tente novamente em instantes.");
    } finally {
      setLoading(false);
    }
  }

  if (!mounted) return null;

  // Sem login não há como vincular o pedido com segurança.
  if (!user) {
    return (
      <div className="max-w-xl rounded-xl border border-neutral-200 bg-white p-6">
        <p className="text-sm text-neutral-600">
          Para rastrear com segurança, entre na sua conta — assim mostramos o status atualizado dos
          seus pedidos.
        </p>
        <div className="mt-4 flex gap-3">
          <Link href="/login">
            <Button>Entrar na conta</Button>
          </Link>
          <Link href="/conta">
            <Button variant="outline">Meus pedidos</Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentIndex = order ? STEPS.findIndex((s) => s.key === order.status) : -1;
  const canceled = order?.status === "cancelado";

  return (
    <div className="max-w-xl space-y-6">
      <form onSubmit={search} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Input
            label="Número do pedido"
            placeholder="Ex.: TQ-2026-0058"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            error={searched && error ? error : undefined}
          />
        </div>
        <Button type="submit" size="lg" loading={loading}>
          Rastrear
        </Button>
      </form>

      {order && (
        <div className="rounded-xl border border-neutral-200 bg-white p-6 animate-fade-in">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-bold text-ink">Pedido {order.number}</p>
              <p className="text-xs text-neutral-500">
                {formatDateShort(order.createdAt)} · {order.items.length} item(ns) ·{" "}
                {formatBRL(order.total)}
              </p>
            </div>
            <Badge tone={canceled ? "danger" : "success"}>{order.status}</Badge>
          </div>

          {canceled ? (
            <p className="mt-5 rounded-lg bg-danger-soft px-4 py-3 text-sm text-danger">
              Este pedido foi cancelado. Em caso de dúvida, fale com o atendimento.
            </p>
          ) : (
            <ol className="mt-6 space-y-5">
              {STEPS.map((step, i) => {
                const done = i <= currentIndex;
                const current = i === currentIndex;
                return (
                  <li key={step.key} className="flex items-start gap-3">
                    <span
                      className={cn(
                        "grid size-7 shrink-0 place-items-center rounded-full border-2 text-white",
                        done ? "border-flame bg-flame" : "border-neutral-300 bg-white",
                      )}
                    >
                      {done && <CheckIcon className="size-4" />}
                    </span>
                    <div>
                      <p className={cn("text-sm font-semibold", done ? "text-ink" : "text-neutral-400")}>
                        {step.label}
                      </p>
                      {current && (
                        <p className="text-xs text-flame-700">Etapa atual</p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}

          <p className="mt-6 text-xs text-neutral-400">
            Entrega via {order.shippingLabel} para {order.address.city}/{order.address.state}.
          </p>
        </div>
      )}

      <p className="text-sm text-neutral-500">
        Você também pode ver todos os seus pedidos em{" "}
        <Link href="/conta" className="font-medium text-flame underline">
          Minha conta
        </Link>
        .
      </p>
    </div>
  );
}
