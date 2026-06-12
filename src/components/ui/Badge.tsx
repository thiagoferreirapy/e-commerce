import { cn } from "@/lib/utils";

type Tone = "flame" | "ink" | "success" | "danger" | "warning" | "neutral";

const tones: Record<Tone, string> = {
  flame: "bg-flame text-white",
  ink: "bg-ink text-white",
  success: "bg-success-soft text-success",
  danger: "bg-danger text-white",
  warning: "bg-warning-soft text-warning",
  neutral: "bg-neutral-200 text-neutral-700",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-2xs font-bold uppercase tracking-wide",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
