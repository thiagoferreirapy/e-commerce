"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types";
import { apiFetch } from "@/lib/api";

interface AuthResponse {
  user: User;
  token: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  hydrated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      hydrated: false,

      login: async (email, password) => {
        const { user, token } = await apiFetch<AuthResponse>("/auth/login", {
          method: "POST",
          body: { email, password },
        });
        set({ user, token });
      },

      register: async (name, email, password) => {
        const { user, token } = await apiFetch<AuthResponse>("/auth/register", {
          method: "POST",
          body: { name, email, password },
        });
        set({ user, token });
      },

      logout: () => set({ user: null, token: null }),
      setUser: (user) => set({ user }),
    }),
    {
      name: "torque-auth",
      // Persistimos token (Bearer) além do usuário. O Bearer é necessário quando
      // front e API ficam em domínios diferentes (ex.: ngrok/produção cross-domain),
      // onde o cookie httpOnly de sessão pode ser bloqueado como cookie de terceiros.
      partialize: (s) => ({ user: s.user, token: s.token }),
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    },
  ),
);
