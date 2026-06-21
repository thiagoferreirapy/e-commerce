"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Product, VariantAxis } from "@/types";
import { useCartStore } from "@/store/cart";
import { toast } from "@/store/toast";
import { recordView } from "@/lib/recentlyViewed";
import { site } from "@/config/site";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Rating } from "@/components/ui/Rating";
import { PriceBlock } from "@/components/ui/PriceBlock";
import { resolveOffer } from "@/lib/format";
import { QtyStepper } from "@/components/ui/QtyStepper";
import { Countdown } from "@/components/ui/Countdown";
import { Button } from "@/components/ui/Button";
import { CartIcon, CheckIcon, ShieldIcon, TruckIcon, WhatsappIcon } from "@/components/ui/icons";
import { Gallery } from "./Gallery";
import { WishlistButton } from "./WishlistButton";
import { ShippingCalculator } from "./ShippingCalculator";

const AXIS_LABEL: Record<VariantAxis, string> = { color: "Cor", size: "Tamanho" };

export function ProductDetail({ product }: { product: Product }) {
  const router = useRouter();
  const brand = product.brand;
  const addItem = useCartStore((s) => s.addItem);

  const hasVariants = product.variantAxes.length > 0;
  const offer = resolveOffer(product);

  // Seleção inicial: primeira opção de cada eixo.
  const [selected, setSelected] = useState<Partial<Record<VariantAxis, string>>>(() => {
    const init: Partial<Record<VariantAxis, string>> = {};
    for (const axis of product.variantAxes) init[axis.axis] = axis.options[0]?.value;
    return init;
  });
  const [qty, setQty] = useState(1);

  // Registra visualização (carrossel "vistos recentemente").
  useEffect(() => recordView(product.id), [product.id]);

  // Variante que casa com a combinação selecionada.
  const variant = useMemo(() => {
    if (!hasVariants) return null;
    return (
      product.variants.find((v) =>
        product.variantAxes.every((a) => v.options[a.axis] === selected[a.axis]),
      ) ?? null
    );
  }, [hasVariants, product, selected]);

  const stock = hasVariants ? (variant?.stock ?? 0) : product.totalStock;
  const inStock = stock > 0;
  const lowStock = inStock && stock <= 5;

  const selectedColor = selected.color;
  // Imagem específica da cor entra como principal.
  const colorImage = product.variants.find(
    (v) => v.options.color === selectedColor && v.imageUrl,
  )?.imageUrl;
  const images = colorImage ? [colorImage, ...product.images] : product.images;

  function selectOption(axis: VariantAxis, value: string) {
    setSelected((s) => ({ ...s, [axis]: value }));
  }

  function add() {
    if (!inStock) return;
    addItem(product.id, variant?.id ?? null, qty);
    toast.success("Produto adicionado ao carrinho", {
      label: "Ver carrinho",
      href: "/carrinho",
    });
  }

  function buyNow() {
    if (!inStock) return;
    addItem(product.id, variant?.id ?? null, qty);
    router.push("/checkout");
  }

  const whatsappUrl = `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(
    `Olá! Tenho interesse no produto: ${product.name} (REF ${product.ref}).`,
  )}`;

  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
      {/* Galeria — remonta ao trocar a cor para focar a imagem certa */}
      <div>
        <Gallery key={selectedColor ?? "default"} images={images} alt={product.name} />
      </div>

      {/* Informações */}
      <div>
        <div className="flex items-start justify-between gap-4">
          <div>
            {brand && (
              <span className="text-xs font-semibold uppercase tracking-wider text-flame-600">
                {brand.name}
              </span>
            )}
            <h1 className="mt-1 text-2xl font-extrabold leading-tight text-ink md:text-3xl">
              {product.name}
            </h1>
          </div>
          <WishlistButton productId={product.id} productName={product.name} />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <button
            type="button"
            onClick={() =>
              document
                .getElementById("avaliacoes")
                ?.scrollIntoView({ behavior: "smooth", block: "start" })
            }
            className="inline-flex items-center rounded transition-opacity hover:opacity-70 focus:outline-none focus-visible:ring-2 focus-visible:ring-flame/40"
            title="Ver avaliações"
            aria-label="Ir para as avaliações"
          >
            <Rating value={product.rating} count={product.reviewCount} size="md" />
          </button>
          <span className="text-neutral-400">|</span>
          <span className="text-neutral-500">
            REF: <span className="font-mono text-ink">{product.ref}</span>
          </span>
        </div>

        {/* Selos */}
        <div className="mt-4 flex flex-wrap gap-2">
          {product.tags.includes("mais-vendido") && <Badge tone="ink">Mais vendido</Badge>}
          {product.tags.includes("novidade") && <Badge tone="success">Novidade</Badge>}
          {lowStock && <Badge tone="warning">Últimas {stock} unidades</Badge>}
        </div>

        {offer.endsAt && inStock && (
          <div className="mt-4 flex items-center gap-2.5 text-sm">
            <span className="inline-flex items-center gap-1.5 font-medium text-flame-700">
              <span className="size-1.5 rounded-full bg-flame" />
              Oferta termina em
            </span>
            <Countdown endsAt={offer.endsAt} />
          </div>
        )}

        {/* Preço */}
        <div className="mt-5">
          <PriceBlock listPrice={offer.listPrice} price={offer.price} size="lg" />
        </div>

        {/* Variantes */}
        {hasVariants && (
          <div className="mt-6 space-y-5">
            {product.variantAxes.map((axis) => (
              <div key={axis.axis}>
                <p className="mb-2 text-sm font-semibold text-ink">
                  {AXIS_LABEL[axis.axis]}:{" "}
                  <span className="font-normal text-neutral-500">
                    {axis.options.find((o) => o.value === selected[axis.axis])?.label}
                  </span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {axis.options.map((opt) => {
                    const isActive = selected[axis.axis] === opt.value;
                    if (axis.axis === "color") {
                      return (
                        <button
                          key={opt.value}
                          onClick={() => selectOption("color", opt.value)}
                          title={opt.label}
                          aria-label={opt.label}
                          aria-pressed={isActive}
                          className={cn(
                            "relative size-9 rounded-full border-2 transition-transform",
                            isActive ? "border-flame" : "border-neutral-200 hover:border-neutral-400",
                          )}
                        >
                          <span
                            className="absolute inset-1 rounded-full border border-black/10"
                            style={{ backgroundColor: opt.hex }}
                          />
                        </button>
                      );
                    }
                    return (
                      <button
                        key={opt.value}
                        onClick={() => selectOption(axis.axis, opt.value)}
                        aria-pressed={isActive}
                        className={cn(
                          "min-w-12 rounded-md border px-3 py-2 text-sm font-semibold transition-colors",
                          isActive
                            ? "border-flame bg-flame text-white"
                            : "border-neutral-300 text-ink hover:border-ink",
                        )}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Disponibilidade */}
        <div className="mt-6 flex items-center gap-2 text-sm">
          {inStock ? (
            <span className="flex items-center gap-1.5 font-medium text-success">
              <CheckIcon className="size-4" /> Em estoque · envio imediato
            </span>
          ) : (
            <span className="font-medium text-danger">Produto indisponível</span>
          )}
        </div>

        {/* Quantidade + ações */}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <QtyStepper value={qty} onChange={setQty} max={Math.max(1, stock)} />
          <Button onClick={add} variant="outline" size="lg" disabled={!inStock} className="flex-1">
            <CartIcon className="size-5" /> Adicionar
          </Button>
        </div>
        <Button onClick={buyNow} size="lg" fullWidth disabled={!inStock} className="mt-3">
          Comprar agora
        </Button>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-md border border-success/40 text-sm font-semibold text-success transition-colors hover:bg-success/10"
        >
          <WhatsappIcon className="size-5" /> Tirar dúvida no WhatsApp
        </a>

        {/* Vendido por (marketplace) */}
        <div className="mt-5 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm">
          <p className="text-neutral-600">
            Vendido e entregue por{" "}
            <strong className="text-ink">{product.seller.name}</strong>
            {product.seller.official && (
              <span className="ml-1.5 inline-flex items-center gap-1 text-success">
                <ShieldIcon className="size-3.5" /> Loja oficial
              </span>
            )}
          </p>
          <p className="mt-0.5 text-xs text-neutral-500">
            Reputação do vendedor: {product.seller.rating.toFixed(1)} / 5
          </p>
        </div>

        {/* Frete */}
        <div className="mt-5 border-t border-neutral-200 pt-5">
          <ShippingCalculator
            subtotal={product.price * qty}
            items={[{ productId: product.id, variantId: variant?.id ?? null, quantity: qty }]}
          />
          {product.freeShipping && (
            <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-success">
              <TruckIcon className="size-4" /> Este produto tem frete grátis no SEDEX
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
