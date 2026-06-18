"use client";

import { useState } from "react";
import type { CartItem, Coupon } from "@/types";
import { applyCoupon } from "@/services/coupon";
import { Button } from "@/components/ui/Button";
import { CheckIcon, TagIcon, XIcon } from "@/components/ui/icons";

export function CouponField({
  items,
  applied,
  onApplied,
  onRemoved,
}: {
  items: CartItem[];
  applied: Coupon | null;
  onApplied: (coupon: Coupon) => void;
  onRemoved: () => void;
}) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { coupon } = await applyCoupon(code, items);
      onApplied(coupon);
      setCode("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cupom inválido.");
    } finally {
      setLoading(false);
    }
  }

  if (applied) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-success/40 bg-success-soft px-3.5 py-3 text-sm">
        <span className="flex items-center gap-2 font-semibold text-success">
          <CheckIcon className="size-4" /> Cupom {applied.code} aplicado
        </span>
        <button
          onClick={onRemoved}
          aria-label="Remover cupom"
          className="text-neutral-400 hover:text-danger"
        >
          <XIcon className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit}>
      <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-ink">
        <TagIcon className="size-4" /> Cupom de desconto
      </label>
      <div className="flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Ex: TORQUE10"
          aria-label="Código do cupom"
          className="h-11 flex-1 rounded-md border border-neutral-300 px-3.5 text-sm uppercase focus:border-flame focus:outline-none focus:ring-2 focus:ring-flame/30"
        />
        <Button type="submit" variant="outline" loading={loading} disabled={!code}>
          Aplicar
        </Button>
      </div>
      {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
    </form>
  );
}
