import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <p className="font-display text-7xl font-extrabold text-flame">404</p>
      <h1 className="mt-4 text-2xl font-bold text-ink">Página não encontrada</h1>
      <p className="mt-2 max-w-sm text-sm text-neutral-500">
        O endereço que você procurou não existe ou foi movido. Que tal voltar para a loja?
      </p>
      <div className="mt-6 flex gap-3">
        <Link href="/">
          <Button>Ir para a home</Button>
        </Link>
        <Link href="/categoria/capacetes">
          <Button variant="outline">Ver capacetes</Button>
        </Link>
      </div>
    </div>
  );
}
