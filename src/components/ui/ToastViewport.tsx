"use client";

import Link from "next/link";
import { useToastStore } from "@/store/toast";
import { cn } from "@/lib/utils";
import { CheckIcon, XIcon } from "./icons";

const toneClasses = {
  success: "border-success/30 bg-white",
  error: "border-danger/40 bg-white",
  info: "border-neutral-200 bg-white",
};

const dotClasses = {
  success: "bg-success text-white",
  error: "bg-danger text-white",
  info: "bg-ink text-white",
};

export function ToastViewport() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[90] flex flex-col items-center gap-2 p-4 sm:items-end">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={cn(
            "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border p-3.5 shadow-md animate-slide-up",
            toneClasses[t.variant],
          )}
        >
          <span className={cn("mt-0.5 grid size-6 shrink-0 place-items-center rounded-full", dotClasses[t.variant])}>
            {t.variant === "error" ? <XIcon className="size-4" /> : <CheckIcon className="size-4" />}
          </span>
          <div className="flex-1 text-sm">
            <p className="font-medium text-ink">{t.message}</p>
            {t.action && (
              <Link
                href={t.action.href}
                onClick={() => dismiss(t.id)}
                className="mt-1 inline-block font-semibold text-flame hover:underline"
              >
                {t.action.label} →
              </Link>
            )}
          </div>
          <button
            onClick={() => dismiss(t.id)}
            aria-label="Fechar notificação"
            className="text-neutral-400 hover:text-ink"
          >
            <XIcon className="size-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
