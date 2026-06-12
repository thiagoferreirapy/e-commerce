"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigation, benefits } from "@/config/site";
import { useCartStore, selectCount } from "@/store/cart";
import { useWishlistStore } from "@/store/wishlist";
import { useAuthStore } from "@/store/auth";
import { useMounted } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";
import { SearchBox } from "./SearchBox";
import { MobileNav } from "./MobileNav";
import {
  CartIcon,
  HeartIcon,
  MenuIcon,
  PixIcon,
  ShieldIcon,
  TagIcon,
  TruckIcon,
  UserIcon,
} from "@/components/ui/icons";

const benefitIcons = {
  truck: TruckIcon,
  pix: PixIcon,
  card: CartIcon,
  shield: ShieldIcon,
};

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const mounted = useMounted();

  const cartCount = useCartStore(selectCount);
  const wishCount = useWishlistStore((s) => s.ids.length);
  const user = useAuthStore((s) => s.user);
  const pathname = usePathname();

  // Categoria ativa = rota atual bate com o link do grupo OU com algum link de
  // suas colunas (subcategorias), ignorando a query string.
  function isActiveGroup(group: (typeof navigation)[number]): boolean {
    const path = (href: string) => href.split("?")[0];
    if (pathname === path(group.href)) return true;
    return (
      group.columns?.some((col) => col.links.some((l) => pathname === path(l.href))) ?? false
    );
  }

  return (
    <header className="sticky top-0 z-50 bg-white">
      {/* Faixa de benefícios */}
      <div className="hidden bg-ink text-white lg:block">
        <div className="container-page flex h-9 items-center justify-center gap-8">
          {benefits.map((b) => {
            const Icon = benefitIcons[b.icon];
            return (
              <span key={b.title} className="flex items-center gap-2 text-xs">
                <Icon className="size-4 text-flame-400" />
                <strong className="font-semibold">{b.title}</strong>
                <span className="text-neutral-300">{b.text}</span>
              </span>
            );
          })}
        </div>
      </div>

      {/* Barra principal */}
      <div className="border-b border-neutral-200 shadow-xs">
        <div className="container-page flex h-16 items-center gap-3 lg:gap-6">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menu"
            className="grid size-10 place-items-center rounded-md text-ink hover:bg-neutral-100 lg:hidden"
          >
            <MenuIcon />
          </button>

          <Logo />

          <SearchBox className="hidden flex-1 md:block" />

          <nav className="ml-auto flex items-center gap-1" aria-label="Conta e carrinho">
            <Link
              href={user ? "/conta" : "/login"}
              className="hidden items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-neutral-100 sm:flex"
            >
              <UserIcon className="size-5 text-ink" />
              <span className="leading-tight">
                <span className="block text-2xs text-neutral-500">
                  {mounted && user ? "Olá," : "Entrar /"}
                </span>
                <span className="block font-semibold text-ink">
                  {mounted && user ? user.name.split(" ")[0] : "Cadastrar"}
                </span>
              </span>
            </Link>

            <IconLink href="/favoritos" label="Favoritos" count={mounted ? wishCount : 0}>
              <HeartIcon className="size-6" />
            </IconLink>
            <IconLink href="/carrinho" label="Carrinho" count={mounted ? cartCount : 0} accent>
              <CartIcon className="size-6" />
            </IconLink>
          </nav>
        </div>

        {/* Busca mobile */}
        <div className="container-page pb-3 md:hidden">
          <SearchBox />
        </div>
      </div>

      {/* Navegação de categorias (desktop) com mega menu */}
      <div className="hidden border-b border-neutral-200 bg-white lg:block">
        <div
          className="container-page flex items-center gap-1"
          onMouseLeave={() => setOpenMenu(null)}
        >
          {navigation.map((group) => {
            const active = isActiveGroup(group);
            return (
            <div
              key={group.label}
              className="relative"
              onMouseEnter={() => setOpenMenu(group.label)}
            >
              <Link
                href={group.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-1 border-b-2 px-3.5 py-3 text-sm font-semibold transition-colors",
                  active
                    ? "border-flame text-flame"
                    : "border-transparent " +
                        (openMenu === group.label ? "text-flame" : "text-ink hover:text-flame"),
                )}
              >
                {group.label}
              </Link>

              {group.columns && openMenu === group.label && (
                <div className="absolute left-0 top-full z-50 min-w-[26rem] rounded-b-lg border border-t-0 border-neutral-200 bg-white p-6 shadow-lg animate-fade-in">
                  <div className="grid grid-cols-2 gap-8">
                    {group.columns.map((col) => (
                      <div key={col.title}>
                        <p className="eyebrow mb-3">{col.title}</p>
                        <ul className="space-y-2">
                          {col.links.map((l) => (
                            <li key={l.href}>
                              <Link
                                href={l.href}
                                className="text-sm text-neutral-600 hover:text-flame"
                              >
                                {l.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            );
          })}
          <Link
            href="/ofertas"
            className="ml-auto flex items-center gap-1.5 px-3.5 py-3 text-sm font-bold text-flame"
          >
            <TagIcon className="size-4" />
            Ofertas
          </Link>
        </div>
      </div>

      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} user={user && mounted ? user : null} />
    </header>
  );
}

function IconLink({
  href,
  label,
  count,
  accent,
  children,
}: {
  href: string;
  label: string;
  count: number;
  accent?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={`${label}${count ? ` (${count})` : ""}`}
      className="relative grid size-11 place-items-center rounded-md text-ink hover:bg-neutral-100"
    >
      {children}
      {count > 0 && (
        <span
          className={cn(
            "absolute right-1 top-1 grid min-w-[18px] place-items-center rounded-full px-1 text-2xs font-bold text-white",
            accent ? "bg-flame" : "bg-ink",
          )}
        >
          {count}
        </span>
      )}
    </Link>
  );
}
