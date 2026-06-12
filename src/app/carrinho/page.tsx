"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Coupon, Product, ShippingOption } from "@/types";
import { useCartStore } from "@/store/cart";
import { useMounted } from "@/lib/hooks";
import { resolveCartLines, cartTotals } from "@/lib/cart";
import { couponDiscount } from "@/lib/coupon";
import { getProductsByIds } from "@/services/catalog";
import { applyCoupon } from "@/services/coupon";
import { calculateShipping } from "@/services/shipping";
import { formatBRL, formatCEP, pixPrice, round2 } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { CartIcon, ChevronRightIcon } from "@/components/ui/icons";
import { CartLineItem } from "@/components/cart/CartLineItem";
import { CouponField } from "@/components/cart/CouponField";
import { OrderSummary } from "@/components/cart/OrderSummary";

export default function CartPage() {
  const mounted = useMounted();
  const items = useCartStore((s) => s.items);
  const clear = useCartStore((s) => s.clear);
  const storedCoupon = useCartStore((s) => s.couponCode);
  const setStoredCoupon = useCartStore((s) => s.setCoupon);

  // Produtos das linhas, carregados da API por id.
  const [productsMap, setProductsMap] = useState<Map<string, Product>>(new Map());
  const ids = useMemo(() => [...new Set(items.map((i) => i.productId))], [items]);

  useEffect(() => {
    if (!ids.length) {
      setProductsMap(new Map());
      return;
    }
    let active = true;
    getProductsByIds(ids)
      .then((products) => {
        if (active) setProductsMap(new Map(products.map((p) => [p.id, p])));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [ids]);

  const lines = useMemo(() => resolveCartLines(items, productsMap), [items, productsMap]);
  const totals = useMemo(() => cartTotals(lines), [lines]);

  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [cep, setCep] = useState("");
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null);
  const [shippingLoading, setShippingLoading] = useState(false);

  // Restaura cupom persistido validando no servidor.
  useEffect(() => {
    if (storedCoupon && !coupon && totals.subtotal > 0) {
      applyCoupon(storedCoupon, totals.subtotal)
        .then((r) => setCoupon(r.coupon))
        .catch(() => setStoredCoupon(null));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storedCoupon, totals.subtotal]);

  const discount = coupon ? couponDiscount(coupon, totals.subtotal) : 0;
  const shipping = selectedShipping ? selectedShipping.price : null;
  const pixTotal = round2(pixPrice(totals.subtotal - discount) + (shipping ?? 0));

  async function calcShipping(e: React.FormEvent) {
    e.preventDefault();
    setShippingLoading(true);
    try {
      const quote = await calculateShipping(cep, totals.subtotal);
      setShippingOptions(quote.options);
      setSelectedShipping(quote.options[0]);
    } catch {
      setShippingOptions([]);
      setSelectedShipping(null);
    } finally {
      setShippingLoading(false);
    }
  }

  if (!mounted) {
    return <div className="container-page py-16 text-center text-neutral-400">Carregando…</div>;
  }

  if (lines.length === 0) {
    return (
      <div className="container-page py-10">
        <Breadcrumb items={[{ label: "Início", href: "/" }, { label: "Carrinho" }]} />
        <div className="mt-8">
          <EmptyState
            icon={<CartIcon className="size-12" />}
            title="Seu carrinho está vazio"
            description="Que tal dar uma olhada nos nossos lançamentos e ofertas?"
            action={{ label: "Começar a comprar", href: "/" }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-10">
      <Breadcrumb items={[{ label: "Início", href: "/" }, { label: "Carrinho" }]} />
      <h1 className="mb-6 mt-4 text-2xl font-extrabold tracking-tight text-ink md:text-3xl">
        Meu carrinho <span className="text-neutral-400">({totals.itemCount})</span>
      </h1>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Itens */}
        <div>
          <div className="divide-y divide-neutral-100 rounded-xl border border-neutral-200 bg-white px-5">
            {lines.map((line) => (
              <CartLineItem key={line.key} line={line} />
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-1 text-sm font-semibold text-flame hover:gap-2 transition-all"
            >
              <ChevronRightIcon className="size-4 rotate-180" /> Continuar comprando
            </Link>
            <button
              onClick={() => {
                clear();
                setCoupon(null);
              }}
              className="text-sm text-neutral-400 hover:text-danger"
            >
              Esvaziar carrinho
            </button>
          </div>
        </div>

        {/* Resumo */}
        <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start">
          <CouponField
            subtotal={totals.subtotal}
            applied={coupon}
            onApplied={(c) => {
              setCoupon(c);
              setStoredCoupon(c.code);
            }}
            onRemoved={() => {
              setCoupon(null);
              setStoredCoupon(null);
            }}
          />

          {/* Frete */}
          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <p className="mb-2 text-sm font-semibold text-ink">Calcular frete</p>
            <form onSubmit={calcShipping} className="flex gap-2">
              <input
                inputMode="numeric"
                value={cep}
                onChange={(e) => setCep(formatCEP(e.target.value))}
                placeholder="Seu CEP"
                maxLength={9}
                aria-label="CEP"
                className="h-10 flex-1 rounded-md border border-neutral-300 px-3 text-sm focus:border-flame focus:outline-none focus:ring-2 focus:ring-flame/30"
              />
              <Button type="submit" variant="outline" size="sm" loading={shippingLoading}>
                OK
              </Button>
            </form>
            {shippingOptions.length > 0 && (
              <div className="mt-3 space-y-1.5">
                {shippingOptions.map((o) => (
                  <label
                    key={o.id}
                    className={cn(
                      "flex cursor-pointer items-center justify-between rounded-md border px-3 py-2 text-sm",
                      selectedShipping?.id === o.id
                        ? "border-flame bg-flame-50"
                        : "border-neutral-200",
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="shipping"
                        checked={selectedShipping?.id === o.id}
                        onChange={() => setSelectedShipping(o)}
                        className="text-flame focus:ring-flame/30"
                      />
                      {o.label} · {o.etaDays} dias
                    </span>
                    <span className={o.price === 0 ? "font-bold text-success" : "font-semibold"}>
                      {o.price === 0 ? "Grátis" : formatBRL(o.price)}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <OrderSummary
            subtotal={totals.subtotal}
            discount={discount}
            shipping={shipping}
            pixTotal={pixTotal}
            shippingLabel={selectedShipping?.label}
          >
            <Link href="/checkout">
              <Button fullWidth size="lg">
                Finalizar compra
              </Button>
            </Link>
          </OrderSummary>
        </aside>
      </div>
    </div>
  );
}
