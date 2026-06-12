"use client";

import { cn } from "@/lib/utils";
import { MinusIcon, PlusIcon } from "./icons";

export function QtyStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  size = "md",
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "md";
}) {
  const h = size === "sm" ? "h-9" : "h-11";
  const btn = size === "sm" ? "size-9" : "size-11";

  return (
    <div className={cn("inline-flex items-center rounded-md border border-neutral-300 bg-white", h)}>
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label="Diminuir quantidade"
        className={cn("grid place-items-center text-ink disabled:opacity-30", btn)}
      >
        <MinusIcon className="size-4" />
      </button>
      <span className="w-8 text-center text-sm font-semibold tabular-nums" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="Aumentar quantidade"
        className={cn("grid place-items-center text-ink disabled:opacity-30", btn)}
      >
        <PlusIcon className="size-4" />
      </button>
    </div>
  );
}
