"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Overlay de carregamento durante transições de página. Mostra um véu
 * semitransparente com spinner ao clicar em links internos e some quando a
 * nova rota termina de carregar — evita cliques repetidos em navegações lentas.
 */
function NavigationLoaderInner() {
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // A rota mudou → a navegação terminou, esconde o overlay.
  useEffect(() => {
    setLoading(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      // Ignora cliques com modificadores (abrir em nova aba etc.).
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      const url = new URL(anchor.href, window.location.href);
      // Apenas navegação interna para uma rota diferente.
      if (url.origin !== window.location.origin) return;
      if (url.pathname === pathname && url.search === window.location.search) return;

      setLoading(true);
    }

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [pathname]);

  if (!loading) return null;

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-white/40 backdrop-blur-[1px] animate-fade-in"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="size-10 animate-spin rounded-full border-[3px] border-flame border-t-transparent" />
    </div>
  );
}

export function NavigationLoader() {
  return (
    <Suspense fallback={null}>
      <NavigationLoaderInner />
    </Suspense>
  );
}
