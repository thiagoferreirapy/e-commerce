"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Order } from "@/types";
import { getPaymentStatus } from "@/services/orders";
import { formatBRL } from "@/lib/format";
import { toast } from "@/store/toast";
import { Button } from "@/components/ui/Button";
import { Countdown } from "@/components/ui/Countdown";
import { PixIcon } from "@/components/ui/icons";

/**
 * Tela de pagamento Pix: QR + copia-e-cola + contagem, com polling do status
 * (que reconcilia com a Asaas no servidor). Chama onPaid quando confirmado.
 */
export function PixPayment({ order, onPaid }: { order: Order; onPaid: () => void }) {
  const [expired, setExpired] = useState(false);
  const pix = order.pix;

  useEffect(() => {
    if (!pix || expired) return;
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
          setExpired(true);
        }
      } catch {
        /* erro de rede — tenta de novo no próximo ciclo */
      }
    }, 4000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [order.id, pix, expired, onPaid]);

  async function copy() {
    if (!pix) return;
    try {
      await navigator.clipboard.writeText(pix.payload);
      toast.success("Código Pix copiado!");
    } catch {
      toast.error("Não foi possível copiar.");
    }
  }

  return (
    <div className="container-page py-12">
      <div className="mx-auto max-w-md rounded-2xl border border-neutral-200 bg-white p-6 text-center sm:p-8">
        <p className="flex items-center justify-center gap-2 text-sm font-semibold text-success">
          <PixIcon className="size-5" /> Pagamento via Pix
        </p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ink">
          {formatBRL(order.total)}
        </h1>
        <p className="mt-1 text-xs text-neutral-500">
          Pedido <strong className="text-ink">{order.number}</strong>
        </p>

        {!pix ? (
          <div className="mt-6 rounded-lg bg-warning-soft p-4 text-sm text-warning">
            Não foi possível gerar o Pix agora. Veja o pedido em Minha Conta para tentar de novo.
          </div>
        ) : expired ? (
          <div className="mt-6 rounded-lg bg-danger-soft p-4 text-sm text-danger">
            O tempo para pagamento expirou e o pedido foi cancelado. Refaça a compra.
          </div>
        ) : (
          <>
            {pix.encodedImage && (
              // QR em base64 vindo da Asaas (não é imagem remota — sem next/image).
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`data:image/png;base64,${pix.encodedImage}`}
                alt="QR Code Pix"
                className="mx-auto mt-5 size-56 rounded-lg border border-neutral-200"
              />
            )}

            <div className="mt-5 text-left">
              <label className="mb-1.5 block text-xs font-semibold text-ink">
                Pix copia e cola
              </label>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={pix.payload}
                  onFocus={(e) => e.currentTarget.select()}
                  className="h-11 flex-1 truncate rounded-md border border-neutral-300 bg-neutral-50 px-3 text-xs text-neutral-600"
                />
                <Button type="button" variant="outline" onClick={copy}>
                  Copiar
                </Button>
              </div>
            </div>

            {pix.expiresAt && (
              <p className="mt-4 flex items-center justify-center gap-2 text-sm text-neutral-500">
                Expira em <Countdown endsAt={pix.expiresAt} compact className="text-flame" />
              </p>
            )}

            <div className="mt-5 flex items-center justify-center gap-2 text-sm font-medium text-neutral-600">
              <span className="size-4 animate-spin rounded-full border-2 border-flame border-t-transparent" />
              Aguardando confirmação do pagamento…
            </div>
            <p className="mt-1 text-xs text-neutral-400">
              Assim que o Pix cair, esta tela atualiza automaticamente.
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
