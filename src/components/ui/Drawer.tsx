"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { XIcon } from "./icons";

type Side = "right" | "left";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  side?: Side;
  children: React.ReactNode;
  /** Rodapé fixo (ex: botões de ação). */
  footer?: React.ReactNode;
  className?: string;
}

/** Painel deslizante lateral (carrinho, menu mobile, filtros). */
export function Drawer({
  open,
  onClose,
  title,
  side = "right",
  children,
  footer,
  className,
}: DrawerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useLockBody(open);
  useEscape(open, onClose);

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <div
      suppressHydrationWarning
      className={cn("fixed inset-0 z-[70]", !open && "pointer-events-none")}
      aria-hidden={!open ? "true" : undefined}
    >
      {/* Overlay */}
      <div
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-ink/50 transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0",
        )}
      />
      {/* Painel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "absolute top-0 flex h-full w-[88%] max-w-md flex-col bg-white shadow-lg transition-transform duration-300 ease-smooth",
          side === "right" ? "right-0" : "left-0",
          open
            ? "translate-x-0"
            : side === "right"
              ? "translate-x-full"
              : "-translate-x-full",
          className,
        )}
      >
        {title && (
          <header className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
            <h2 className="text-base font-bold text-ink">{title}</h2>
            <button
              onClick={onClose}
              aria-label="Fechar"
              className="grid size-9 place-items-center rounded-md text-neutral-500 hover:bg-neutral-100"
            >
              <XIcon className="size-5" />
            </button>
          </header>
        )}
        <div className="flex-1 overflow-y-auto">{children}</div>
        {footer && <footer className="border-t border-neutral-200 p-4">{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
}

/** Modal centralizado. */
export function Modal({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  useLockBody(open);
  useEscape(open, onClose);
  if (typeof document === "undefined" || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/50 animate-fade-in" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative w-full max-w-md rounded-xl bg-white p-6 shadow-lg animate-slide-up",
          className,
        )}
      >
        {title && (
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-ink">{title}</h2>
            <button
              onClick={onClose}
              aria-label="Fechar"
              className="grid size-9 place-items-center rounded-md text-neutral-500 hover:bg-neutral-100"
            >
              <XIcon className="size-5" />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body,
  );
}

function useLockBody(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [active]);
}

function useEscape(active: boolean, onClose: () => void) {
  useEffect(() => {
    if (!active) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [active, onClose]);
}
