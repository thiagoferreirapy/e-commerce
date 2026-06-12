import Link from "next/link";
import { Logo } from "@/components/layout/Logo";
import { ShieldIcon } from "@/components/ui/icons";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-7 shadow-sm">
          <h1 className="text-xl font-bold text-ink">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
        {footer && <div className="mt-5 text-center text-sm text-neutral-500">{footer}</div>}
        <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-neutral-400">
          <ShieldIcon className="size-4" /> Ambiente protegido — seus dados estão seguros.
        </p>
        <p className="mt-3 text-center text-xs text-neutral-400">
          <Link href="/" className="hover:text-flame">
            ← Voltar para a loja
          </Link>
        </p>
      </div>
    </div>
  );
}
