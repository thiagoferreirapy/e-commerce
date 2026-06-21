"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { benefits } from "@/config/site";
import type { NavCategory } from "@/services/catalog";
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
  ChevronDownIcon,
  HeartIcon,
  MenuIcon,
  PixIcon,
  ShieldIcon,
  TagIcon,
  TruckIcon,
  UserIcon,
} from "@/components/ui/icons";

/** Quantas categorias-raiz aparecem direto na barra; o resto vai para "Mais". */
const MAX_VISIBLE_CATEGORIES = 5;
const MORE_KEY = "__more__";

const benefitIcons = {
  truck: TruckIcon,
  pix: PixIcon,
  card: CartIcon,
  shield: ShieldIcon,
};

export function Header({ categories }: { categories: NavCategory[] }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const mounted = useMounted();

  const cartCount = useCartStore(selectCount);
  const wishCount = useWishlistStore((s) => s.ids.length);
  const user = useAuthStore((s) => s.user);
  const pathname = usePathname();

  // Categoria ativa = rota atual bate com o link do grupo OU com algum link de
  // suas colunas (subcategorias), ignorando a query string.
  function isActiveGroup(cat: NavCategory): boolean {
    const path = (href: string) => href.split("?")[0];
    if (pathname === path(cat.href)) return true;
    return cat.subcategories.some((s) => pathname === path(s.href));
  }

  // Mostra as primeiras na barra; o excedente vai para o botão "Mais".
  const visibleCategories = categories.slice(0, MAX_VISIBLE_CATEGORIES);
  const overflowCategories = categories.slice(MAX_VISIBLE_CATEGORIES);

  return (
    <header className="sticky top-0 z-50 bg-white pt-[env(safe-area-inset-top)]">
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

      {/* Navegação de categorias (desktop) — dinâmica (categorias do banco) com mega menu */}
      <div className="hidden border-b border-neutral-200 bg-white lg:block">
        <div
          className="container-page flex items-center gap-1"
          onMouseLeave={() => setOpenMenu(null)}
        >
          {visibleCategories.map((group) => {
            const active = isActiveGroup(group);
            const hasSubs = group.subcategories.length > 0;
            return (
              <div
                key={group.slug}
                className="relative"
                onMouseEnter={() => setOpenMenu(group.label)}
              >
                <Link
                  href={group.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-1 border-b-2 px-3.5 py-3 text-sm font-semibold transition-colors",
                    active || (hasSubs && openMenu === group.label)
                      ? "border-flame text-flame"
                      : "border-transparent " +
                      (openMenu === group.label ? "text-flame" : "text-ink hover:text-flame"),
                  )}
                >
                  {group.label}
                </Link>

                {hasSubs && openMenu === group.label && (
                  <div className="absolute left-0 top-full z-50 min-w-[22rem] rounded-b-lg border border-t-0 border-neutral-200 bg-white p-5 shadow-lg animate-fade-in">
                    <p className="eyebrow mb-3">{group.label}</p>
                    <ul className="grid grid-cols-2 gap-x-8 gap-y-2">
                      {group.subcategories.map((sub) => (
                        <li key={sub.href}>
                          <Link
                            href={sub.href}
                            className="text-sm text-neutral-600 hover:text-flame"
                          >
                            {sub.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={group.href}
                      className="mt-4 inline-block text-sm font-semibold text-flame hover:underline"
                    >
                      Ver tudo em {group.label}
                    </Link>
                  </div>
                )}
              </div>
            );
          })}

          {/* Botão "Mais" — categorias que não couberam na barra */}
          {overflowCategories.length > 0 && (
            <div className="relative" onMouseEnter={() => setOpenMenu(MORE_KEY)}>
              <button
                type="button"
                aria-haspopup="true"
                aria-expanded={openMenu === MORE_KEY}
                className={cn(
                  "flex items-center gap-1 border-b-2 px-3.5 py-3 text-sm font-semibold transition-colors",
                  openMenu === MORE_KEY
                    ? "border-flame text-flame"
                    : "border-transparent text-ink hover:text-flame",
                )}
              >
                Mais
                <ChevronDownIcon className="size-4" />
              </button>

              {openMenu === MORE_KEY && (
                <div className="absolute left-0 top-full z-50 max-h-[70vh] min-w-[16rem] overflow-y-auto rounded-b-lg border border-t-0 border-neutral-200 bg-white p-5 shadow-lg animate-fade-in">
                  <p className="eyebrow mb-3">Mais categorias</p>
                  <ul className="grid grid-cols-2 gap-x-8 gap-y-2">
                    {overflowCategories.map((cat) => (
                      <li key={cat.slug}>
                        <Link
                          href={cat.href}
                          aria-current={isActiveGroup(cat) ? "page" : undefined}
                          className={cn(
                            "text-sm hover:text-flame",
                            isActiveGroup(cat) ? "font-semibold text-flame" : "text-neutral-600",
                          )}
                        >
                          {cat.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <Link
            href="/ofertas"
            className="ml-auto flex items-center gap-1.5 px-3.5 py-3 text-sm font-bold text-flame"
          >
            <TagIcon className="size-4" />
            Ofertas
          </Link>
        </div>
      </div>

      <MobileNav
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        user={user && mounted ? user : null}
        categories={categories}
      />
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
