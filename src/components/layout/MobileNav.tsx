"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { User } from "@/types";
import type { NavCategory } from "@/services/catalog";
import { useAuthStore } from "@/store/auth";
import { cn } from "@/lib/utils";
import { Drawer } from "@/components/ui/Drawer";
import { ChevronRightIcon, HeartIcon, UserIcon } from "@/components/ui/icons";

export function MobileNav({
  open,
  onClose,
  user,
  categories,
}: {
  open: boolean;
  onClose: () => void;
  user: User | null;
  categories: NavCategory[];
}) {
  const logout = useAuthStore((s) => s.logout);
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<string | null>(null);

  function isActive(cat: NavCategory): boolean {
    const path = (href: string) => href.split("?")[0];
    if (pathname === path(cat.href)) return true;
    return cat.subcategories.some((s) => pathname === path(s.href));
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

        {/* Categorias (dinâmicas) */}
        <nav className="p-2">
          {categories.map((cat) => {
            const active = isActive(cat);
            const hasSubs = cat.subcategories.length > 0;
            const isOpen = expanded === cat.slug;
            return (
              <div key={cat.slug}>
                <div
                  className={cn(
                    "flex items-center rounded-md text-sm font-semibold hover:bg-neutral-100",
                    active ? "bg-flame-50 text-flame-700" : "text-ink",
                  )}
                >
                  <Link
                    href={cat.href}
                    onClick={onClose}
                    aria-current={active ? "page" : undefined}
                    className="flex-1 px-3 py-3"
                  >
                    {cat.label}
                  </Link>
                  {hasSubs ? (
                    <button
                      type="button"
                      onClick={() => setExpanded(isOpen ? null : cat.slug)}
                      aria-label={isOpen ? "Recolher" : "Expandir"}
                      aria-expanded={isOpen}
                      className="grid size-11 place-items-center text-neutral-400"
                    >
                      <ChevronRightIcon
                        className={cn("size-4 transition-transform", isOpen && "rotate-90")}
                      />
                    </button>
                  ) : (
                    <ChevronRightIcon
                      className={cn("mr-3 size-4", active ? "text-flame" : "text-neutral-300")}
                    />
                  )}
                </div>

                {hasSubs && isOpen && (
                  <div className="mb-1 ml-3 border-l border-neutral-200 pl-3">
                    {cat.subcategories.map((sub) => (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        onClick={onClose}
                        className="block rounded-md px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-100 hover:text-flame"
                      >
                        {sub.label}
                      </Link>
                    ))}
                    <Link
                      href={cat.href}
                      onClick={onClose}
                      className="block rounded-md px-3 py-2 text-sm font-semibold text-flame hover:bg-neutral-100"
                    >
                      Ver tudo
                    </Link>
                  </div>
                )}
              </div>
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
