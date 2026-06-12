"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/store/auth";
import { useCartStore } from "@/store/cart";
import { useWishlistStore } from "@/store/wishlist";

/**
 * Ao abrir o app com sessão ativa (usuário persistido + cookie httpOnly),
 * carrega carrinho e favoritos do servidor (fonte da verdade).
 *
 * O merge do estado de visitante acontece explicitamente no momento do login
 * (páginas de login/cadastro chamam mergeOnLogin), evitando merge duplicado a
 * cada recarregamento. Não renderiza nada.
 */
export function SyncProvider() {
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const loadCart = useCartStore((s) => s.loadFromServer);
  const loadWish = useWishlistStore((s) => s.loadFromServer);

  const prev = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    // Apenas na montagem inicial com usuário já logado.
    if (prev.current === undefined && userId) {
      loadCart();
      loadWish();
    }
    prev.current = userId;
  }, [userId, loadCart, loadWish]);

  return null;
}
