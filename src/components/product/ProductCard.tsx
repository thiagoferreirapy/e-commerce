"use client";

import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/types";
import { useCartStore } from "@/store/cart";
import { toast } from "@/store/toast";
import { resolveOffer } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Rating } from "@/components/ui/Rating";
import { PriceBlock } from "@/components/ui/PriceBlock";
import { Countdown } from "@/components/ui/Countdown";
import { CartIcon, TruckIcon } from "@/components/ui/icons";
import { WishlistButton } from "./WishlistButton";

const TAG_LABELS: Record<Product["tags"][number], { label: string; tone: "flame" | "ink" | "success" | "warning" }> = {
  destaque: { label: "Destaque", tone: "ink" },
  novidade: { label: "Novidade", tone: "success" },
  "mais-vendido": { label: "Mais vendido", tone: "ink" },
  "oferta-do-dia": { label: "Oferta do dia", tone: "flame" },
  "ultimas-unidades": { label: "Últimas unidades", tone: "warning" },
};

export function ProductCard({ product }: { product: Product }) {
  const brand = product.brand;
  const addItem = useCartStore((s) => s.addItem);
  const hasVariants = product.variantAxes.length > 0;
  const offer = resolveOffer(product);
  const off = offer.off;
  const href = `/produto/${product.slug}`;
  const soldOut = product.totalStock <= 0;

  // Selo principal exibido no canto (prioriza oferta/desconto).
  const primaryTag =
    product.tags.find((t) => t === "oferta-do-dia") ??
    product.tags.find((t) => t === "mais-vendido" || t === "novidade" || t === "destaque");

  function quickAdd(e: React.MouseEvent) {
    e.preventDefault();
    if (soldOut) return;
    if (hasVariants) {
      // Variantes exigem escolha (tamanho/cor) — leva à PDP.
      window.location.href = href;
      return;
    }
    addItem(product.id, null, 1);
    toast.success("Produto adicionado ao carrinho", { label: "Ver carrinho", href: "/carrinho" });
  }

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white transition-all duration-300 hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-md">
      {/* Selos topo-esquerda */}
      <div className="pointer-events-none absolute left-3 top-3 z-10 flex flex-col items-start gap-1.5">
        {off > 0 && <Badge tone="flame">-{off}%</Badge>}
        {primaryTag && primaryTag !== "oferta-do-dia" && (
          <Badge tone={TAG_LABELS[primaryTag].tone}>{TAG_LABELS[primaryTag].label}</Badge>
        )}
      </div>

      {/* Favoritar topo-direita (acima do link que cobre o card) */}
      <div className="absolute right-3 top-3 z-20">
        <WishlistButton
          productId={product.id}
          productName={product.name}
          size="sm"
          highlightBorder={false}
        />
      </div>

      {/* Imagem (sem link próprio — o card todo é clicável via stretched link) */}
      <div className="relative block aspect-square overflow-hidden bg-neutral-100">
        <Image
          src={product.images[0]}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className={cn(
            "object-cover transition-transform duration-500 group-hover:scale-105",
            soldOut && "opacity-50 grayscale",
          )}
        />
        {soldOut && (
          <span className="absolute inset-x-0 bottom-0 bg-ink/80 py-1.5 text-center text-xs font-semibold text-white">
            Esgotado
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        {brand && (
          <span className="text-2xs font-semibold uppercase tracking-wider text-neutral-400">
            {brand.name}
          </span>
        )}
        {/* Stretched link: o ::after cobre o card inteiro, tornando-o clicável.
            Botões com z-20 (favoritar/adicionar) ficam acima e não disparam este link. */}
        <Link
          href={href}
          className="mt-0.5 after:absolute after:inset-0 after:z-0 after:content-['']"
        >
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-ink transition-colors group-hover:text-flame">
            {product.name}
          </h3>
        </Link>

        <div className="mt-1.5 flex items-center gap-2">
          <Rating value={product.rating} />
          <span className="text-2xs text-neutral-400">{product.reviewCount} aval.</span>
        </div>

        {offer.endsAt && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-flame-700">
            <span className="font-semibold">Termina em</span>
            <Countdown endsAt={offer.endsAt} compact />
          </div>
        )}

        <div className="mt-auto pt-3">
          <PriceBlock
            listPrice={offer.listPrice}
            price={offer.price}
            size="sm"
            showInstallments
          />
          {product.freeShipping && (
            <p className="mt-2 inline-flex items-center gap-1 text-2xs font-semibold text-success">
              <TruckIcon className="size-3.5" /> Frete grátis
            </p>
          )}
        </div>

        <button
          onClick={quickAdd}
          disabled={soldOut}
          className={cn(
            "relative z-20 mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md text-sm font-semibold transition-all active:scale-[0.98]",
            soldOut
              ? "cursor-not-allowed bg-neutral-100 text-neutral-400"
              : "bg-ink text-white hover:bg-flame",
          )}
        >
          <CartIcon className="size-4" />
          {soldOut ? "Indisponível" : hasVariants ? "Escolher opções" : "Adicionar"}
        </button>
      </div>
    </article>
  );
}
