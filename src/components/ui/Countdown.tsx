"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

function diff(target: number) {
  const now = Date.now();
  const total = Math.max(0, target - now);
  return {
    total,
    h: Math.floor(total / 3_600_000),
    m: Math.floor((total % 3_600_000) / 60_000),
    s: Math.floor((total % 60_000) / 1000),
  };
}

/** Countdown "oferta termina em" — atualiza a cada segundo no cliente. */
export function Countdown({
  endsAt,
  className,
  compact,
}: {
  endsAt: string;
  className?: string;
  compact?: boolean;
}) {
  const target = new Date(endsAt).getTime();
  const [t, setT] = useState<ReturnType<typeof diff> | null>(null);

  useEffect(() => {
    setT(diff(target));
    const id = setInterval(() => setT(diff(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  if (!t) return null;
  if (t.total <= 0) return null;
  const pad = (n: number) => String(n).padStart(2, "0");

  if (compact) {
    return (
      <span className={cn("font-mono text-xs font-semibold tabular-nums", className)}>
        {pad(t.h)}:{pad(t.m)}:{pad(t.s)}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-baseline gap-2 font-mono tabular-nums text-ink",
        className,
      )}
    >
      {[
        { v: t.h, l: "h" },
        { v: t.m, l: "min" },
        { v: t.s, l: "s" },
      ].map((unit, i) => (
        <span key={i} className="inline-flex items-baseline gap-0.5">
          <span className="text-[15px] font-semibold leading-none tracking-tight">
            {pad(unit.v)}
          </span>
          <span className="text-[10px] font-medium text-neutral-400">{unit.l}</span>
        </span>
      ))}
    </span>
  );
}
