"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Coupon, PaymentMethod, Product, ShippingOption } from "@/types";
import { useCartStore } from "@/store/cart";
import { useAuthStore } from "@/store/auth";
import { toast } from "@/store/toast";
import { useMounted } from "@/lib/hooks";
import { resolveCartLines, cartTotals } from "@/lib/cart";
import { couponDiscount } from "@/lib/coupon";
import { getProductsByIds } from "@/services/catalog";
import { applyCoupon } from "@/services/coupon";
import { calculateShipping } from "@/services/shipping";
import { lookupCEP } from "@/services/cep";
import { placeOrder } from "@/services/orders";
import {
  formatBRL,
  formatCEP,
  formatInstallments,
  installments,
  pixPrice,
  round2,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/States";
import { Stepper } from "@/components/checkout/Stepper";
import { OrderSummary } from "@/components/cart/OrderSummary";
import { CartIcon, CheckIcon, PixIcon } from "@/components/ui/icons";

const STEPS = ["Identificação", "Endereço", "Frete", "Pagamento", "Revisão"];

export default function CheckoutPage() {
  const mounted = useMounted();
  const items = useCartStore((s) => s.items);
  const couponCode = useCartStore((s) => s.couponCode);
  const clear = useCartStore((s) => s.clear);
  const user = useAuthStore((s) => s.user);

  const [productsMap, setProductsMap] = useState<Map<string, Product>>(new Map());
  const ids = useMemo(() => [...new Set(items.map((i) => i.productId))], [items]);
  useEffect(() => {
    if (!ids.length) return;
    let active = true;
    getProductsByIds(ids)
      .then((products) => active && setProductsMap(new Map(products.map((p) => [p.id, p]))))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [ids]);

  const lines = useMemo(() => resolveCartLines(items, productsMap), [items, productsMap]);
  const totals = useMemo(() => cartTotals(lines), [lines]);

  const [step, setStep] = useState(1);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);

  // Identificação
  const [ident, setIdent] = useState({ name: "", email: "" });
  // Endereço
  const [addr, setAddr] = useState({
    cep: "",
    street: "",
    number: "",
    complement: "",
    district: "",
    city: "",
    state: "",
  });
  const [cepLoading, setCepLoading] = useState(false);
  // Frete
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [shipping, setShipping] = useState<ShippingOption | null>(null);
  const [shippingLoading, setShippingLoading] = useState(false);
  // Pagamento
  const [payment, setPayment] = useState<PaymentMethod>("pix");
  const [installmentCount, setInstallmentCount] = useState(1);

  const [coupon, setCoupon] = useState<Coupon | null>(null);
  useEffect(() => {
    if (couponCode && totals.subtotal > 0) {
      applyCoupon(couponCode, totals.subtotal)
        .then((r) => setCoupon(r.coupon))
        .catch(() => setCoupon(null));
    } else {
      setCoupon(null);
    }
  }, [couponCode, totals.subtotal]);

  const discount = coupon ? couponDiscount(coupon, totals.subtotal) : 0;
  const shipCost = shipping?.price ?? 0;
  const baseTotal = round2(totals.subtotal - discount + shipCost);
  const pixTotal = round2(pixPrice(totals.subtotal - discount) + shipCost);

  // Prefill quando logado.
  useEffect(() => {
    if (user) {
      setIdent({ name: user.name, email: user.email });
      const def = user.addresses.find((a) => a.isDefault) ?? user.addresses[0];
      if (def) {
        setAddr({
          cep: def.cep,
          street: def.street,
          number: def.number,
          complement: def.complement ?? "",
          district: def.district,
          city: def.city,
          state: def.state,
        });
      }
    }
  }, [user]);

  async function fillCep(value: string) {
    setAddr((a) => ({ ...a, cep: formatCEP(value) }));
    if (value.replace(/\D/g, "").length === 8) {
      setCepLoading(true);
      try {
        const r = await lookupCEP(value);
        setAddr((a) => ({
          ...a,
          street: r.street,
          district: r.district,
          city: r.city,
          state: r.state,
        }));
      } catch {
        /* ignore */
      } finally {
        setCepLoading(false);
      }
    }
  }

  async function loadShipping() {
    setShippingLoading(true);
    try {
      const quote = await calculateShipping(addr.cep, totals.subtotal);
      setShippingOptions(quote.options);
      setShipping(quote.options[0]);
    } catch {
      setShippingOptions([]);
    } finally {
      setShippingLoading(false);
    }
  }

  async function confirm() {
    if (!shipping) return;
    setPlacing(true);
    try {
      const { orderNumber } = await placeOrder({
        items: items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId,
          quantity: i.quantity,
        })),
        address: {
          recipient: ident.name || "Cliente",
          cep: addr.cep,
          street: addr.street,
          number: addr.number,
          complement: addr.complement || undefined,
          district: addr.district,
          city: addr.city,
          state: addr.state,
        },
        payment,
        installments: payment === "cartao" ? installmentCount : undefined,
        shippingId: shipping.id,
        couponCode: couponCode ?? undefined,
      });
      setOrderNumber(orderNumber);
      clear();
      setStep(6);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível finalizar o pedido.");
    } finally {
      setPlacing(false);
    }
  }

  if (!mounted) {
    return <div className="container-page py-16 text-center text-neutral-400">Carregando…</div>;
  }

  // Confirmação
  if (step === 6 && orderNumber) {
    return (
      <div className="container-page py-16">
        <div className="mx-auto max-w-lg rounded-2xl border border-neutral-200 bg-white p-8 text-center">
          <span className="mx-auto grid size-16 place-items-center rounded-full bg-success text-white">
            <CheckIcon className="size-8" />
          </span>
          <h1 className="mt-5 text-2xl font-extrabold text-ink">Pedido confirmado!</h1>
          <p className="mt-2 text-sm text-neutral-500">
            Recebemos seu pedido <strong className="text-ink">{orderNumber}</strong>. Enviamos os
            detalhes para <strong className="text-ink">{ident.email || "seu e-mail"}</strong>.
          </p>
          {payment === "pix" && (
            <div className="mt-5 rounded-lg bg-neutral-50 p-4 text-sm text-neutral-600">
              <p className="flex items-center justify-center gap-2 font-semibold text-success">
                <PixIcon className="size-4" /> Pague {formatBRL(pixTotal)} via Pix
              </p>
              <p className="mt-1 text-xs">O código Pix foi enviado por e-mail. Pague em até 30 min.</p>
            </div>
          )}
          <div className="mt-6 flex flex-col gap-2">
            <Link href="/conta">
              <Button fullWidth>Ver meus pedidos</Button>
            </Link>
            <Link href="/">
              <Button variant="ghost" fullWidth>
                Voltar à loja
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="container-page py-10">
        <EmptyState
          icon={<CartIcon className="size-12" />}
          title="Seu carrinho está vazio"
          description="Adicione produtos antes de finalizar a compra."
          action={{ label: "Ver produtos", href: "/" }}
        />
      </div>
    );
  }

  return (
    <div className="container-page py-10">
      <h1 className="mb-6 text-2xl font-extrabold tracking-tight text-ink md:text-3xl">
        Finalizar compra
      </h1>
      <div className="mb-8">
        <Stepper steps={STEPS} current={Math.min(step, 5)} />
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          {/* Passo 1 — Identificação */}
          {step === 1 && (
            <Section title="Identificação">
              {user ? (
                <p className="mb-4 rounded-lg bg-success-soft px-4 py-3 text-sm text-success">
                  Você está logado como <strong>{user.email}</strong>.
                </p>
              ) : (
                <p className="mb-4 text-sm text-neutral-500">
                  Já tem conta?{" "}
                  <Link href="/login" className="font-semibold text-flame hover:underline">
                    Entrar
                  </Link>{" "}
                  ou continue como visitante.
                </p>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Nome completo"
                  value={ident.name}
                  onChange={(e) => setIdent({ ...ident, name: e.target.value })}
                  placeholder="Seu nome"
                />
                <Input
                  label="E-mail"
                  type="email"
                  value={ident.email}
                  onChange={(e) => setIdent({ ...ident, email: e.target.value })}
                  placeholder="seu@email.com"
                />
              </div>
              <StepNav
                onNext={() => setStep(2)}
                nextDisabled={!ident.name || !ident.email}
              />
            </Section>
          )}

          {/* Passo 2 — Endereço */}
          {step === 2 && (
            <Section title="Endereço de entrega">
              <div className="grid gap-4 sm:grid-cols-3">
                <Input
                  label="CEP"
                  value={addr.cep}
                  onChange={(e) => fillCep(e.target.value)}
                  maxLength={9}
                  hint={cepLoading ? "Buscando endereço…" : "Preenchimento automático"}
                />
                <Input
                  label="Cidade"
                  value={addr.city}
                  onChange={(e) => setAddr({ ...addr, city: e.target.value })}
                  className="sm:col-span-2"
                />
                <Input
                  label="Rua"
                  className="sm:col-span-2"
                  value={addr.street}
                  onChange={(e) => setAddr({ ...addr, street: e.target.value })}
                />
                <Input
                  label="Número"
                  value={addr.number}
                  onChange={(e) => setAddr({ ...addr, number: e.target.value })}
                />
                <Input
                  label="Bairro"
                  value={addr.district}
                  onChange={(e) => setAddr({ ...addr, district: e.target.value })}
                />
                <Input
                  label="Complemento"
                  value={addr.complement}
                  onChange={(e) => setAddr({ ...addr, complement: e.target.value })}
                />
                <Input
                  label="Estado"
                  value={addr.state}
                  onChange={(e) => setAddr({ ...addr, state: e.target.value })}
                />
              </div>
              <StepNav
                onBack={() => setStep(1)}
                onNext={() => {
                  setStep(3);
                  loadShipping();
                }}
                nextDisabled={!addr.cep || !addr.number || !addr.street}
              />
            </Section>
          )}

          {/* Passo 3 — Frete */}
          {step === 3 && (
            <Section title="Forma de envio">
              {shippingLoading ? (
                <p className="text-sm text-neutral-500">Calculando opções de frete…</p>
              ) : shippingOptions.length === 0 ? (
                <p className="text-sm text-danger">
                  Não foi possível calcular o frete.{" "}
                  <button onClick={loadShipping} className="font-semibold underline">
                    Tentar novamente
                  </button>
                </p>
              ) : (
                <div className="space-y-2">
                  {shippingOptions.map((o) => (
                    <label
                      key={o.id}
                      className={cn(
                        "flex cursor-pointer items-center justify-between rounded-lg border px-4 py-3 text-sm",
                        shipping?.id === o.id ? "border-flame bg-flame-50" : "border-neutral-200",
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="ship"
                          checked={shipping?.id === o.id}
                          onChange={() => setShipping(o)}
                          className="text-flame focus:ring-flame/30"
                        />
                        <span>
                          <span className="font-semibold text-ink">{o.label}</span>
                          <span className="block text-xs text-neutral-500">
                            Entrega em até {o.etaDays} dias úteis
                          </span>
                        </span>
                      </span>
                      <span className={o.price === 0 ? "font-bold text-success" : "font-semibold text-ink"}>
                        {o.price === 0 ? "Grátis" : formatBRL(o.price)}
                      </span>
                    </label>
                  ))}
                </div>
              )}
              <StepNav onBack={() => setStep(2)} onNext={() => setStep(4)} nextDisabled={!shipping} />
            </Section>
          )}

          {/* Passo 4 — Pagamento */}
          {step === 4 && (
            <Section title="Pagamento">
              <div className="space-y-3">
                <PaymentOption
                  active={payment === "pix"}
                  onClick={() => setPayment("pix")}
                  title="Pix"
                  badge="10% OFF"
                  desc={`Pague ${formatBRL(pixTotal)} à vista`}
                />
                <PaymentOption
                  active={payment === "cartao"}
                  onClick={() => setPayment("cartao")}
                  title="Cartão de crédito"
                  desc={formatInstallments(baseTotal)}
                >
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <Input label="Número do cartão" placeholder="0000 0000 0000 0000" />
                    <Input label="Nome no cartão" placeholder="Como impresso" />
                    <Input label="Validade" placeholder="MM/AA" />
                    <Input label="CVV" placeholder="123" />
                    <div className="sm:col-span-2">
                      <label className="mb-1.5 block text-sm font-medium text-ink-700">
                        Parcelas
                      </label>
                      <select
                        value={installmentCount}
                        onChange={(e) => setInstallmentCount(Number(e.target.value))}
                        className="h-11 w-full rounded-md border border-neutral-300 px-3 text-sm focus:border-flame focus:outline-none focus:ring-2 focus:ring-flame/30"
                      >
                        {Array.from({ length: installments(baseTotal).count }, (_, i) => i + 1).map(
                          (n) => (
                            <option key={n} value={n}>
                              {n}x de {formatBRL(round2(baseTotal / n))} sem juros
                            </option>
                          ),
                        )}
                      </select>
                    </div>
                  </div>
                </PaymentOption>
                <PaymentOption
                  active={payment === "boleto"}
                  onClick={() => setPayment("boleto")}
                  title="Boleto bancário"
                  desc={`${formatBRL(baseTotal)} à vista · vence em 2 dias`}
                />
              </div>
              <StepNav onBack={() => setStep(3)} onNext={() => setStep(5)} />
            </Section>
          )}

          {/* Passo 5 — Revisão */}
          {step === 5 && (
            <Section title="Revise seu pedido">
              <div className="space-y-4 text-sm">
                <ReviewBlock title="Contato" onEdit={() => setStep(1)}>
                  {ident.name} · {ident.email}
                </ReviewBlock>
                <ReviewBlock title="Entrega" onEdit={() => setStep(2)}>
                  {addr.street}, {addr.number} {addr.complement && `- ${addr.complement}`} ·{" "}
                  {addr.district}, {addr.city}/{addr.state} · CEP {addr.cep}
                  <br />
                  <span className="text-neutral-500">
                    {shipping?.label} — até {shipping?.etaDays} dias úteis
                  </span>
                </ReviewBlock>
                <ReviewBlock title="Pagamento" onEdit={() => setStep(4)}>
                  {payment === "pix" && `Pix — ${formatBRL(pixTotal)}`}
                  {payment === "cartao" &&
                    `Cartão — ${installmentCount}x de ${formatBRL(round2(baseTotal / installmentCount))}`}
                  {payment === "boleto" && `Boleto — ${formatBRL(baseTotal)}`}
                </ReviewBlock>

                <div className="divide-y divide-neutral-100 rounded-lg border border-neutral-200">
                  {lines.map((l) => (
                    <div key={l.key} className="flex items-center gap-3 p-3">
                      <div className="relative size-12 shrink-0 overflow-hidden rounded-md bg-neutral-100">
                        <Image src={l.image} alt="" fill sizes="48px" className="object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink">{l.product.name}</p>
                        <p className="text-xs text-neutral-500">
                          {l.variantLabel && `${l.variantLabel} · `}Qtd: {l.quantity}
                        </p>
                      </div>
                      <span className="text-sm font-semibold">{formatBRL(l.lineTotal)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <Button variant="outline" onClick={() => setStep(4)}>
                  Voltar
                </Button>
                <Button fullWidth size="lg" loading={placing} onClick={confirm}>
                  Confirmar pedido
                </Button>
              </div>
            </Section>
          )}
        </div>

        {/* Resumo lateral */}
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <OrderSummary
            subtotal={totals.subtotal}
            discount={discount}
            shipping={step >= 3 && shipping ? shipping.price : null}
            pixTotal={pixTotal}
            shippingLabel={shipping?.label}
          />
        </aside>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="animate-fade-in">
      <h2 className="mb-5 text-lg font-bold text-ink">{title}</h2>
      {children}
    </div>
  );
}

function StepNav({
  onBack,
  onNext,
  nextDisabled,
}: {
  onBack?: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
}) {
  return (
    <div className="mt-6 flex gap-3">
      {onBack && (
        <Button variant="outline" onClick={onBack}>
          Voltar
        </Button>
      )}
      <Button fullWidth onClick={onNext} disabled={nextDisabled}>
        Continuar
      </Button>
    </div>
  );
}

function PaymentOption({
  active,
  onClick,
  title,
  desc,
  badge,
  children,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  desc: string;
  badge?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border transition-colors",
        active ? "border-flame bg-flame-50/40" : "border-neutral-200",
      )}
    >
      <button onClick={onClick} className="flex w-full items-center gap-3 px-4 py-3 text-left">
        <span
          className={cn(
            "grid size-5 place-items-center rounded-full border-2",
            active ? "border-flame" : "border-neutral-300",
          )}
        >
          {active && <span className="size-2.5 rounded-full bg-flame" />}
        </span>
        <span className="flex-1">
          <span className="flex items-center gap-2 font-semibold text-ink">
            {title}
            {badge && (
              <span className="rounded-sm bg-success px-1.5 py-0.5 text-2xs font-bold text-white">
                {badge}
              </span>
            )}
          </span>
          <span className="block text-xs text-neutral-500">{desc}</span>
        </span>
      </button>
      {active && children && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

function ReviewBlock({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-neutral-200 p-4">
      <div className="mb-1 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">{title}</p>
        <button onClick={onEdit} className="text-xs font-semibold text-flame hover:underline">
          Editar
        </button>
      </div>
      <div className="text-ink">{children}</div>
    </div>
  );
}
