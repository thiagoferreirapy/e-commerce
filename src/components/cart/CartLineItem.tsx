"use client";

import Image from "next/image";
import Link from "next/link";
import type { ResolvedCartLine } from "@/lib/cart";
import { useCartStore } from "@/store/cart";
import { formatBRL } from "@/lib/format";
import { QtyStepper } from "@/components/ui/QtyStepper";
import { TrashIcon } from "@/components/ui/icons";

export function CartLineItem({ line }: { line: ResolvedCartLine }) {
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const variantId = line.variant?.id ?? null;

  return (
    <div className="flex gap-4 py-5">
      <Link
        href={`/produto/${line.product.slug}`}
        className="relative size-24 shrink-0 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100"
      >
        <Image src={line.image} alt={line.product.name} fill sizes="96px" className="object-cover" />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              href={`/produto/${line.product.slug}`}
              className="line-clamp-2 text-sm font-semibold text-ink hover:text-flame"
            >
              {line.product.name}
            </Link>
            {line.variantLabel && (
              <p className="mt-0.5 text-xs text-neutral-500">{line.variantLabel}</p>
            )}
            <p className="mt-0.5 font-mono text-2xs text-neutral-400">REF {line.product.ref}</p>
          </div>
          <button
            onClick={() => removeItem(line.product.id, variantId)}
            aria-label="Remover item"
            className="grid size-9 shrink-0 place-items-center rounded-md text-neutral-400 hover:bg-neutral-100 hover:text-danger"
          >
            <TrashIcon className="size-5" />
          </button>
        </div>

        <div className="mt-auto flex items-end justify-between pt-3">
          <QtyStepper
            value={line.quantity}
            onChange={(q) => setQuantity(line.product.id, variantId, q)}
            max={Math.max(1, line.available)}
            size="sm"
          />
          <div className="text-right">
            <p className="text-sm font-bold text-ink">{formatBRL(line.lineTotal)}</p>
            {line.quantity > 1 && (
              <p className="text-xs text-neutral-400">{formatBRL(line.unitPrice)} cada</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
