"use client";

import Link from "next/link";
import type { Review } from "@/types";
import { formatDate } from "@/lib/format";
import { Rating } from "@/components/ui/Rating";
import { CheckIcon } from "@/components/ui/icons";

/**
 * Avaliações — somente leitura. Apenas clientes que compraram o produto podem
 * avaliar, e isso é feito em Minha conta → Pedidos.
 */
export function ReviewsTab({ reviews, rating }: { reviews: Review[]; rating: number }) {
  const dist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => Math.round(r.rating) === star).length,
  }));
  const max = Math.max(1, ...dist.map((d) => d.count));

  return (
    <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
      {/* Resumo */}
      <div>
        <div className="rounded-xl border border-neutral-200 p-5 text-center">
          <p className="text-4xl font-semibold text-ink">{rating.toFixed(1)}</p>
          <Rating value={rating} size="md" className="mt-1 justify-center" />
          <p className="mt-1 text-sm text-neutral-500">{reviews.length} avaliações</p>
        </div>
        <div className="mt-4 space-y-1.5">
          {dist.map((d) => (
            <div key={d.star} className="flex items-center gap-2 text-xs text-neutral-500">
              <span className="w-3">{d.star}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-200">
                <div
                  className="h-full rounded-full bg-flame"
                  style={{ width: `${(d.count / max) * 100}%` }}
                />
              </div>
              <span className="w-6 text-right">{d.count}</span>
            </div>
          ))}
        </div>
        <p className="mt-4 rounded-lg bg-neutral-50 px-3 py-2.5 text-xs leading-relaxed text-neutral-500">
          Apenas clientes que compraram este produto podem avaliá-lo. Avalie em{" "}
          <Link href="/conta" className="font-medium text-flame underline">
            Minha conta → Pedidos
          </Link>
          .
        </p>
      </div>

      {/* Lista */}
      <div>
        {reviews.length === 0 ? (
          <p className="rounded-xl border border-dashed border-neutral-300 px-4 py-10 text-center text-sm text-neutral-500">
            Este produto ainda não tem avaliações. Seja o primeiro a avaliar após a compra.
          </p>
        ) : (
          <ul className="space-y-5">
            {reviews.map((r) => (
              <li key={r.id} className="border-b border-neutral-100 pb-5 last:border-0">
                <div className="flex items-center justify-between">
                  <Rating value={r.rating} />
                  <span className="text-xs text-neutral-400">{formatDate(r.date)}</span>
                </div>
                <p className="mt-1.5 font-semibold text-ink">{r.title}</p>
                <p className="mt-1 text-sm text-neutral-600">{r.comment}</p>
                <p className="mt-2 flex items-center gap-1.5 text-xs text-neutral-500">
                  {r.author}
                  {r.verified && (
                    <span className="inline-flex items-center gap-0.5 text-success">
                      <CheckIcon className="size-3.5" /> Compra verificada
                    </span>
                  )}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
