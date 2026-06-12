"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/types";
import { listProducts } from "@/services/catalog";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";
import { SearchIcon } from "@/components/ui/icons";

/** Busca com autocomplete consumindo a API (debounce). */
export function SearchBox({ className, autoFocus }: { className?: string; autoFocus?: boolean }) {
  const router = useRouter();
  const [term, setTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  // Busca com debounce de 250ms.
  useEffect(() => {
    const q = term.trim();
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    let active = true;
    const id = setTimeout(() => {
      listProducts({ query: q, pageSize: 6 })
        .then((page) => active && setSuggestions(page.items))
        .catch(() => active && setSuggestions([]));
    }, 250);
    return () => {
      active = false;
      clearTimeout(id);
    };
  }, [term]);

  // Fecha ao clicar fora.
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!term.trim()) return;
    setOpen(false);
    router.push(`/busca?q=${encodeURIComponent(term.trim())}`);
  }

  return (
    <div ref={ref} className={cn("relative w-full", className)}>
      <form onSubmit={submit} role="search">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-neutral-400" />
          <input
            type="search"
            value={term}
            autoFocus={autoFocus}
            onChange={(e) => {
              setTerm(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="Busque por capacete, escapamento, marca..."
            aria-label="Buscar produtos"
            className="h-11 w-full rounded-full border border-neutral-300 bg-white pl-11 pr-4 text-sm text-ink placeholder:text-neutral-400 focus:border-flame focus:outline-none focus:ring-2 focus:ring-flame/25"
          />
        </div>
      </form>

      {open && suggestions.length > 0 && (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-lg animate-fade-in">
          <ul className="max-h-[60vh] divide-y divide-neutral-100 overflow-y-auto">
            {suggestions.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/produto/${p.slug}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 hover:bg-neutral-50"
                >
                  <div className="relative size-12 shrink-0 overflow-hidden rounded-md bg-neutral-100">
                    <Image src={p.images[0]} alt="" fill sizes="48px" className="object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{p.name}</p>
                    <p className="text-xs text-neutral-500">{p.brand?.name}</p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-ink">
                    {formatBRL(p.price)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={submit}
            className="block w-full bg-neutral-50 px-3 py-2.5 text-center text-sm font-semibold text-flame hover:bg-neutral-100"
          >
            Ver todos os resultados para “{term}”
          </button>
        </div>
      )}
    </div>
  );
}
