"use client";

import { useState } from "react";
import type { CartItem } from "@/types";
import { calculateShipping, type ShippingQuote } from "@/services/shipping";
import { formatBRL, formatCEP } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { TruckIcon } from "@/components/ui/icons";

export function ShippingCalculator({
  subtotal,
  items,
  compact,
}: {
  subtotal: number;
  items?: CartItem[];
  compact?: boolean;
}) {
  const [cep, setCep] = useState("");
  const [quote, setQuote] = useState<ShippingQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function calc(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setQuote(null);
    try {
      const result = await calculateShipping(cep, subtotal, items);
      setQuote(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao calcular o frete.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {!compact && (
        <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
          <TruckIcon className="size-4" /> Calcular frete e prazo
        </p>
      )}
      <form onSubmit={calc} className="flex gap-2">
        <input
          inputMode="numeric"
          value={cep}
          onChange={(e) => setCep(formatCEP(e.target.value))}
          placeholder="Digite seu CEP"
          aria-label="CEP"
          maxLength={9}
          className="h-11 w-40 rounded-md border border-neutral-300 px-3.5 text-sm focus:border-flame focus:outline-none focus:ring-2 focus:ring-flame/30"
        />
        <Button type="submit" variant="outline" loading={loading}>
          Calcular
        </Button>
        <a
          href="https://buscacepinter.correios.com.br"
          target="_blank"
          rel="noopener noreferrer"
          className="self-center text-xs text-neutral-400 underline hover:text-flame"
        >
          Não sei
        </a>
      </form>

      {error && <p className="mt-2 text-xs text-danger">{error}</p>}

      {quote && (
        <ul className="mt-3 divide-y divide-neutral-100 rounded-lg border border-neutral-200">
          {quote.options.map((o) => (
            <li key={o.id} className="flex items-center justify-between px-3.5 py-2.5 text-sm">
              <div>
                <span className="font-semibold text-ink">{o.label}</span>
                <span className="ml-2 text-xs text-neutral-500">
                  até {o.etaDays} dias úteis
                </span>
              </div>
              <span className={o.price === 0 ? "font-bold text-success" : "font-semibold text-ink"}>
                {o.price === 0 ? "Grátis" : formatBRL(o.price)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
