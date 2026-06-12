"use client";

import { useEffect, useState } from "react";
import { formatBRL } from "@/lib/format";

/** Slider de faixa de preço com dois thumbs (min/max). */
export function PriceRange({
  bounds,
  value,
  onChange,
}: {
  bounds: { min: number; max: number };
  value: { min: number; max: number };
  onChange: (v: { min: number; max: number }) => void;
}) {
  const [local, setLocal] = useState(value);

  useEffect(() => setLocal(value), [value.min, value.max]); // sincroniza com reset externo

  const span = Math.max(1, bounds.max - bounds.min);
  const leftPct = ((local.min - bounds.min) / span) * 100;
  const rightPct = ((bounds.max - local.max) / span) * 100;

  function commit(next: { min: number; max: number }) {
    setLocal(next);
    onChange(next);
  }

  return (
    <div>
      <div className="relative h-9">
        {/* Trilho */}
        <div className="absolute top-1/2 h-1 w-full -translate-y-1/2 rounded-full bg-neutral-200" />
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-flame"
          style={{ left: `${leftPct}%`, right: `${rightPct}%` }}
        />
        <input
          type="range"
          min={bounds.min}
          max={bounds.max}
          value={local.min}
          aria-label="Preço mínimo"
          onChange={(e) =>
            commit({ ...local, min: Math.min(Number(e.target.value), local.max - 1) })
          }
          className="range-thumb pointer-events-none absolute top-0 h-9 w-full appearance-none bg-transparent"
        />
        <input
          type="range"
          min={bounds.min}
          max={bounds.max}
          value={local.max}
          aria-label="Preço máximo"
          onChange={(e) =>
            commit({ ...local, max: Math.max(Number(e.target.value), local.min + 1) })
          }
          className="range-thumb pointer-events-none absolute top-0 h-9 w-full appearance-none bg-transparent"
        />
      </div>
      <div className="mt-1 flex items-center justify-between text-xs text-neutral-600">
        <span>{formatBRL(local.min)}</span>
        <span>{formatBRL(local.max)}</span>
      </div>

      <style jsx>{`
        .range-thumb::-webkit-slider-thumb {
          pointer-events: auto;
          appearance: none;
          height: 18px;
          width: 18px;
          border-radius: 9999px;
          background: #fff;
          border: 3px solid #ff5a1f;
          cursor: pointer;
          box-shadow: 0 1px 3px rgb(14 15 18 / 0.2);
        }
        .range-thumb::-moz-range-thumb {
          pointer-events: auto;
          height: 18px;
          width: 18px;
          border-radius: 9999px;
          background: #fff;
          border: 3px solid #ff5a1f;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
