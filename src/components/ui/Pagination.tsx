"use client";

import { cn } from "@/lib/utils";
import { ChevronLeftIcon, ChevronRightIcon } from "./icons";

/** Gera a sequência de páginas com elipses. */
function pageList(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "…")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) pages.push("…");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push("…");
  pages.push(total);
  return pages;
}

export function Pagination({
  page,
  pageCount,
  onChange,
}: {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
}) {
  if (pageCount <= 1) return null;
  const pages = pageList(page, pageCount);

  return (
    <nav className="flex items-center justify-center gap-1.5" aria-label="Paginação">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        aria-label="Página anterior"
        className="grid size-10 place-items-center rounded-md border border-neutral-300 text-ink disabled:opacity-40 enabled:hover:border-ink"
      >
        <ChevronLeftIcon className="size-4" />
      </button>
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} className="px-2 text-neutral-400">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            aria-current={p === page ? "page" : undefined}
            className={cn(
              "grid size-10 place-items-center rounded-md border text-sm font-medium transition-colors",
              p === page
                ? "border-flame bg-flame text-white"
                : "border-neutral-300 text-ink hover:border-ink",
            )}
          >
            {p}
          </button>
        ),
      )}
      <button
        onClick={() => onChange(page + 1)}
        disabled={page === pageCount}
        aria-label="Próxima página"
        className="grid size-10 place-items-center rounded-md border border-neutral-300 text-ink disabled:opacity-40 enabled:hover:border-ink"
      >
        <ChevronRightIcon className="size-4" />
      </button>
    </nav>
  );
}
