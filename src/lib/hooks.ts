"use client";

import { useEffect, useState } from "react";

/** true após a montagem no cliente — usado para evitar mismatch de hidratação
 * em valores vindos do localStorage (contador do carrinho, favoritos). */
export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
