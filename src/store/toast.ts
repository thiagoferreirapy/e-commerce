"use client";

import { create } from "zustand";

export type ToastVariant = "success" | "error" | "info";

export interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
  /** Ação opcional (ex: "Ver carrinho"). */
  action?: { label: string; href: string };
}

interface ToastState {
  toasts: Toast[];
  push: (t: Omit<Toast, "id">) => void;
  dismiss: (id: number) => void;
}

let counter = 0;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (t) => {
    const id = ++counter;
    set((s) => ({ toasts: [...s.toasts, { ...t, id }] }));
    // Auto-dismiss após 4s.
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) }));
    }, 4000);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}));

/** Atalho fora de componentes. */
export const toast = {
  success: (message: string, action?: Toast["action"]) =>
    useToastStore.getState().push({ message, variant: "success", action }),
  error: (message: string) => useToastStore.getState().push({ message, variant: "error" }),
  info: (message: string) => useToastStore.getState().push({ message, variant: "info" }),
};
