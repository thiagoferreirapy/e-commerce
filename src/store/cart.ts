"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/types";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "./auth";

interface CartState {
  items: CartItem[];
  couponCode: string | null;
  hydrated: boolean;

  addItem: (productId: string, variantId: string | null, quantity?: number) => void;
  removeItem: (productId: string, variantId: string | null) => void;
  setQuantity: (productId: string, variantId: string | null, quantity: number) => void;
  clear: () => void;
  setCoupon: (code: string | null) => void;

  /** Define itens vindos do servidor sem reenviar (hidratação). */
  replaceItems: (items: CartItem[]) => void;
  /** Mescla o carrinho local no servidor após login e recarrega. */
  mergeOnLogin: () => Promise<void>;
  /** Carrega o carrinho do servidor (usuário já logado). */
  loadFromServer: () => Promise<void>;
}

function sameLine(a: CartItem, productId: string, variantId: string | null) {
  return a.productId === productId && a.variantId === variantId;
}

function authed(): boolean {
  // Sessão definida pela presença do usuário (token vive no cookie httpOnly).
  return !!useAuthStore.getState().user;
}

/** Sincroniza o carrinho completo com o servidor (fire-and-forget). */
function pushReplace(items: CartItem[]) {
  if (!authed()) return;
  apiFetch("/cart", { method: "PUT", body: { items } }).catch(() => {});
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      couponCode: null,
      hydrated: false,

      addItem: (productId, variantId, quantity = 1) => {
        const existing = get().items.find((i) => sameLine(i, productId, variantId));
        const items = existing
          ? get().items.map((i) =>
              sameLine(i, productId, variantId)
                ? { ...i, quantity: i.quantity + quantity }
                : i,
            )
          : [...get().items, { productId, variantId, quantity }];
        set({ items });
        pushReplace(items);
      },

      removeItem: (productId, variantId) => {
        const items = get().items.filter((i) => !sameLine(i, productId, variantId));
        set({ items });
        pushReplace(items);
      },

      setQuantity: (productId, variantId, quantity) => {
        const items = get()
          .items.map((i) => (sameLine(i, productId, variantId) ? { ...i, quantity } : i))
          .filter((i) => i.quantity > 0);
        set({ items });
        pushReplace(items);
      },

      clear: () => {
        set({ items: [], couponCode: null });
        pushReplace([]);
      },

      setCoupon: (code) => set({ couponCode: code }),

      replaceItems: (items) => set({ items }),

      mergeOnLogin: async () => {
        const local = get().items;
        try {
          const { items } = await apiFetch<{ items: CartItem[] }>("/cart/merge", {
            method: "POST",
            body: { items: local },
          });
          set({ items });
        } catch {
          /* mantém o carrinho local em caso de falha */
        }
      },

      loadFromServer: async () => {
        try {
          const { items } = await apiFetch<{ items: CartItem[] }>("/cart");
          set({ items });
        } catch {
          /* ignora */
        }
      },
    }),
    {
      name: "torque-cart",
      partialize: (s) => ({ items: s.items, couponCode: s.couponCode }),
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    },
  ),
);

export function selectCount(state: CartState): number {
  return state.items.reduce((acc, i) => acc + i.quantity, 0);
}
