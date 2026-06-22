"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Order } from "@/types";
import { getPaymentStatus } from "@/services/orders";
import { formatBRL, formatDateShort } from "@/lib/format";
import { toast } from "@/store/toast";
import { Button } from "@/components/ui/Button";
import { BarcodeIcon } from "@/components/ui/icons";

/**
 * Tela de pagamento por boleto: linha digitável (copiar) + link para o boleto,
 * com polling do status (reconcilia com a Asaas no servidor). Como boleto pode
 * levar dias para compensar, o usuário pode sair — o pedido fica pendente.
 */
export function BoletoPayment({ order, onPaid }: { order: Order; onPaid: () => void }) {
  const [canceled, setCanceled] = useState(false);
  const boleto = order.boleto;

  useEffect(() => {
    if (!boleto || canceled) return;
    let active = true;
    const id = setInterval(async () => {
      try {
        const { status } = await getPaymentStatus(order.id);
        if (!active) return;
        if (status === "pago") {
          clearInterval(id);
          onPaid();
        } else if (status === "cancelado") {
          clearInterval(id);
          setCanceled(true);
        }
      } catch {
        /* erro de rede — tenta de novo no próximo ciclo */
      }
    }, 5000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [order.id, boleto, canceled, onPaid]);

  async function copy() {
    if (!boleto) return;
    try {
      await navigator.clipboard.writeText(boleto.line);
      toast.success("Linha digitável copiada!");
    } catch {
      toast.error("Não foi possível copiar.");
    }
  }

  return (
    <div className="container-page py-12">
      <div className="mx-auto max-w-md rounded-2xl border border-neutral-200 bg-white p-6 text-center sm:p-8">
        <p className="flex items-center justify-center gap-2 text-sm font-semibold text-ink">
          <BarcodeIcon className="size-5" /> Pagamento via boleto
        </p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ink">
          {formatBRL(order.total)}
        </h1>
        <p className="mt-1 text-xs text-neutral-500">
          Pedido <strong className="text-ink">{order.number}</strong>
        </p>

        {!boleto ? (
          <div className="mt-6 rounded-lg bg-warning-soft p-4 text-sm text-warning">
            Não foi possível gerar o boleto agora. Veja o pedido em Minha Conta para tentar de
            novo.
          </div>
        ) : canceled ? (
          <div className="mt-6 rounded-lg bg-danger-soft p-4 text-sm text-danger">
            O boleto venceu e o pedido foi cancelado. Refaça a compra.
          </div>
        ) : (
          <>
            {boleto.dueDate && (
              <p className="mt-4 text-sm text-neutral-500">
                Vence em{" "}
                <strong className="text-ink">{formatDateShort(boleto.dueDate)}</strong>
              </p>
            )}

            {boleto.line && (
              <div className="mt-5 text-left">
                <label className="mb-1.5 block text-xs font-semibold text-ink">
                  Linha digitável
                </label>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={boleto.line}
                    onFocus={(e) => e.currentTarget.select()}
                    className="h-11 flex-1 truncate rounded-md border border-neutral-300 bg-neutral-50 px-3 text-xs text-neutral-600"
                  />
                  <Button type="button" variant="outline" onClick={copy}>
                    Copiar
                  </Button>
                </div>
              </div>
            )}

            {boleto.url && (
              <a href={boleto.url} target="_blank" rel="noopener noreferrer" className="mt-3 block">
                <Button fullWidth>Visualizar / imprimir boleto</Button>
              </a>
            )}

            <div className="mt-5 flex items-center justify-center gap-2 text-sm font-medium text-neutral-600">
              <span className="size-4 animate-spin rounded-full border-2 border-flame border-t-transparent" />
              Aguardando confirmação do pagamento…
            </div>
            <p className="mt-1 text-xs text-neutral-400">
              A compensação do boleto pode levar até 3 dias úteis. Você pode acompanhar em Minha
              Conta.
            </p>
          </>
        )}

        <div className="mt-6 flex flex-col gap-2">
          <Link href="/conta">
            <Button variant="ghost" fullWidth>
              Ver meus pedidos
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
