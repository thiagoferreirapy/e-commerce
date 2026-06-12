"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

/** Error boundary global do App Router (captura erros de render/fetch nas rotas). */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <p className="eyebrow">Algo deu errado</p>
      <h1 className="mt-2 text-2xl font-extrabold text-ink md:text-3xl">
        Não foi possível carregar esta página
      </h1>
      <p className="mt-2 max-w-md text-sm text-neutral-500">
        Pode ser uma instabilidade momentânea na conexão com nossos servidores. Tente novamente em
        instantes.
      </p>
      <div className="mt-6 flex gap-3">
        <Button onClick={reset}>Tentar novamente</Button>
        <Link href="/">
          <Button variant="outline">Voltar à página inicial</Button>
        </Link>
      </div>
    </div>
  );
}
