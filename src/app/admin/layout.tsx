"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { useMounted } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/States";
import { UserIcon } from "@/components/ui/icons";

const NAV = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/produtos", label: "Produtos" },
  { href: "/admin/pedidos", label: "Pedidos" },
  { href: "/admin/cupons", label: "Cupons" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const mounted = useMounted();
  const user = useAuthStore((s) => s.user);
  const pathname = usePathname();

  if (!mounted) {
    return <div className="container-page py-16 text-center text-neutral-400">Carregando…</div>;
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="container-page py-16">
        <EmptyState
          icon={<UserIcon className="size-12" />}
          title="Área restrita"
          description="Esta área é exclusiva para administradores. Faça login com uma conta de administrador."
          action={{ label: "Fazer login", href: "/login" }}
        />
      </div>
    );
  }

  return (
    <div className="container-page py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="eyebrow">Painel administrativo</p>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">TORQUE Admin</h1>
        </div>
        <Link href="/" className="text-sm font-semibold text-flame hover:underline">
          ← Voltar à loja
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <nav className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
            {NAV.map((n) => {
              const active = n.exact ? pathname === n.href : pathname.startsWith(n.href);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={cn(
                    "block border-l-2 px-4 py-3 text-sm font-medium transition-colors",
                    active
                      ? "border-flame bg-flame-50 text-flame-700"
                      : "border-transparent text-ink hover:bg-neutral-50",
                  )}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
