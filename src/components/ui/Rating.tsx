import { cn } from "@/lib/utils";

/** Estrelas com preenchimento fracionário. */
export function Rating({
  value,
  count,
  size = "sm",
  className,
}: {
  value: number;
  count?: number;
  size?: "sm" | "md";
  className?: string;
}) {
  const dim = size === "md" ? "size-5" : "size-4";
  return (
    <div className={cn("inline-flex items-center gap-1.5", className)}>
      <div
        className="inline-flex"
        role="img"
        aria-label={`Avaliação ${value.toFixed(1)} de 5`}
      >
        {Array.from({ length: 5 }).map((_, i) => {
          const pct = Math.max(0, Math.min(1, value - i)) * 100;
          return (
            <span key={i} className={cn("relative", dim)}>
              <Star className={cn(dim, "absolute inset-0 text-neutral-300")} />
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${pct}%` }}
              >
                <Star className={cn(dim, "text-flame")} filled />
              </span>
            </span>
          );
        })}
      </div>
      {count !== undefined && (
        <span className="text-xs text-neutral-500">({count})</span>
      )}
    </div>
  );
}

function Star({ className, filled }: { className?: string; filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        d="M12 3.2l2.7 5.5 6 .9-4.3 4.2 1 6-5.4-2.8L6.6 19.9l1-6L3.3 9.6l6-.9z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={filled ? 0 : 1.5}
        strokeLinejoin="round"
      />
    </svg>
  );
}
