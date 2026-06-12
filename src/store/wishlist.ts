"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "./auth";

interface WishlistState {
  ids: string[];
  hydrated: boolean;
  toggle: (productId: string) => void;
  has: (productId: string) => boolean;
  clear: () => void;
  mergeOnLogin: () => Promise<void>;
  loadFromServer: () => Promise<void>;
}

function authed(): boolean {
  return !!useAuthStore.getState().user;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      ids: [],
      hydrated: false,

      toggle: (productId) => {
        const has = get().ids.includes(productId);
        const ids = has
          ? get().ids.filter((id) => id !== productId)
          : [...get().ids, productId];
        set({ ids });
        if (authed()) {
          const req = has
            ? apiFetch(`/wishlist/${productId}`, { method: "DELETE" })
            : apiFetch(`/wishlist/${productId}`, { method: "POST" });
          req.catch(() => {});
        }
      },

      has: (productId) => get().ids.includes(productId),
      clear: () => set({ ids: [] }),

      mergeOnLogin: async () => {
        const local = get().ids;
        try {
          const { ids } = await apiFetch<{ ids: string[] }>("/wishlist/merge", {
            method: "POST",
            body: { ids: local },
          });
          set({ ids });
        } catch {
          /* mantém local */
        }
      },

      loadFromServer: async () => {
        try {
          const { ids } = await apiFetch<{ ids: string[] }>("/wishlist");
          set({ ids });
        } catch {
          /* ignora */
        }
      },
    }),
    {
      name: "torque-wishlist",
      partialize: (s) => ({ ids: s.ids }),
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    },
  ),
);
