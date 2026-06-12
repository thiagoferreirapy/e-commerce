"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { User } from "@/types";
import { navigation } from "@/config/site";
import { useAuthStore } from "@/store/auth";
import { cn } from "@/lib/utils";
import { Drawer } from "@/components/ui/Drawer";
import { ChevronRightIcon, HeartIcon, UserIcon } from "@/components/ui/icons";

export function MobileNav({
  open,
  onClose,
  user,
}: {
  open: boolean;
  onClose: () => void;
  user: User | null;
}) {
  const logout = useAuthStore((s) => s.logout);
  const pathname = usePathname();

  function isActive(g: (typeof navigation)[number]): boolean {
    const path = (href: string) => href.split("?")[0];
    if (pathname === path(g.href)) return true;
    return g.columns?.some((c) => c.links.some((l) => pathname === path(l.href))) ?? false;
  }

  return (
    <Drawer open={open} onClose={onClose} title="Menu" side="left">
      <div className="flex flex-col">
        {/* Conta */}
        <div className="border-b border-neutral-200 bg-neutral-50 p-4">
          {user ? (
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-full bg-ink text-white">
                <UserIcon className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
                <p className="truncate text-xs text-neutral-500">{user.email}</p>
              </div>
            </div>
          ) : (
            <Link
              href="/login"
              onClick={onClose}
              className="flex items-center justify-center gap-2 rounded-md bg-flame px-4 py-2.5 text-sm font-semibold text-white"
            >
              <UserIcon className="size-5" /> Entrar ou cadastrar
            </Link>
          )}
        </div>

        {/* Categorias */}
        <nav className="p-2">
          {navigation.map((g) => {
            const active = isActive(g);
            return (
              <Link
                key={g.label}
                href={g.href}
                onClick={onClose}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center justify-between rounded-md px-3 py-3 text-sm font-semibold hover:bg-neutral-100",
                  active ? "bg-flame-50 text-flame-700" : "text-ink",
                )}
              >
                {g.label}
                <ChevronRightIcon
                  className={cn("size-4", active ? "text-flame" : "text-neutral-300")}
                />
              </Link>
            );
          })}
          <Link
            href="/ofertas"
            onClick={onClose}
            className="flex items-center justify-between rounded-md px-3 py-3 text-sm font-bold text-flame hover:bg-neutral-100"
          >
            Ofertas do dia
            <ChevronRightIcon className="size-4 text-flame/40" />
          </Link>
        </nav>

        <div className="border-t border-neutral-200 p-2">
          <Link
            href="/favoritos"
            onClick={onClose}
            className="flex items-center gap-2 rounded-md px-3 py-3 text-sm text-ink hover:bg-neutral-100"
          >
            <HeartIcon className="size-5" /> Meus favoritos
          </Link>
          {user && (
            <>
              <Link
                href="/conta"
                onClick={onClose}
                className="flex items-center gap-2 rounded-md px-3 py-3 text-sm text-ink hover:bg-neutral-100"
              >
                <UserIcon className="size-5" /> Minha conta
              </Link>
              <button
                onClick={() => {
                  logout();
                  onClose();
                }}
                className="w-full rounded-md px-3 py-3 text-left text-sm text-danger hover:bg-neutral-100"
              >
                Sair
              </button>
            </>
          )}
        </div>
      </div>
    </Drawer>
  );
}
