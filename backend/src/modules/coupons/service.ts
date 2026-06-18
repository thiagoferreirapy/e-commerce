import type { Coupon } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { BadRequest } from "../../lib/errors";
import { round2 } from "../../lib/format";

export type CouponScope = "all" | "category" | "brand" | "product";

export interface CouponDTO {
  code: string;
  type: "percent" | "fixed";
  value: number;
  minSubtotal?: number;
  description: string;
  scope: CouponScope;
  scopeValue?: string | null;
  maxUses?: number | null;
  usedCount: number;
  startsAt?: string | null;
  expiresAt?: string | null;
}

/** Linha do carrinho com os dados necessários para casar o escopo do cupom. */
export interface CouponCartLine {
  productId: string;
  categorySlug: string;
  subcategorySlug?: string | null;
  brandId: string;
  lineTotal: number;
}

export interface CouponResult {
  coupon: CouponDTO;
  discount: number;
}

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export function toCouponDTO(row: Coupon): CouponDTO {
  return {
    code: row.code,
    type: row.type as "percent" | "fixed",
    value: row.value,
    minSubtotal: row.minSubtotal ?? undefined,
    description: row.description,
    scope: row.scope as CouponScope,
    scopeValue: row.scopeValue ?? null,
    maxUses: row.maxUses ?? null,
    usedCount: row.usedCount,
    startsAt: row.startsAt ? row.startsAt.toISOString() : null,
    expiresAt: row.expiresAt ? row.expiresAt.toISOString() : null,
  };
}

/** Uma linha é elegível ao cupom conforme o escopo (slug de categoria/marca ou id do produto). */
export function lineMatchesCoupon(coupon: CouponDTO, line: CouponCartLine): boolean {
  switch (coupon.scope) {
    case "category":
      return line.categorySlug === coupon.scopeValue || line.subcategorySlug === coupon.scopeValue;
    case "brand":
      return line.brandId === coupon.scopeValue;
    case "product":
      return line.productId === coupon.scopeValue;
    default:
      return true; // all
  }
}

/** Soma dos itens elegíveis (base do desconto). Para scope=all, é o subtotal inteiro. */
export function eligibleSubtotal(coupon: CouponDTO, lines: CouponCartLine[]): number {
  return round2(
    lines.filter((l) => lineMatchesCoupon(coupon, l)).reduce((acc, l) => acc + l.lineTotal, 0),
  );
}

/** Calcula o desconto: incide somente sobre os itens elegíveis. */
export function discountFor(
  coupon: CouponDTO,
  fullSubtotal: number,
  lines: CouponCartLine[],
): number {
  if (coupon.minSubtotal && fullSubtotal < coupon.minSubtotal) return 0;
  const base = eligibleSubtotal(coupon, lines);
  if (base <= 0) return 0;
  const value = coupon.type === "percent" ? base * (coupon.value / 100) : Math.min(coupon.value, base);
  return round2(value);
}

/**
 * Valida um cupom contra o carrinho e devolve o desconto.
 * Lança BadRequest com mensagem amigável quando inaplicável.
 */
export async function applyCoupon(
  code: string,
  fullSubtotal: number,
  lines: CouponCartLine[],
): Promise<CouponResult> {
  const row = await prisma.coupon.findUnique({ where: { code: code.trim().toUpperCase() } });
  if (!row) throw BadRequest("Cupom inválido ou expirado.");
  const coupon = toCouponDTO(row);

  const now = new Date();
  if (coupon.startsAt && new Date(coupon.startsAt) > now) {
    throw BadRequest("Este cupom ainda não está válido.");
  }
  if (coupon.expiresAt && new Date(coupon.expiresAt) < now) {
    throw BadRequest("Este cupom está expirado.");
  }
  if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) {
    throw BadRequest("Este cupom atingiu o limite de usos.");
  }
  if (coupon.minSubtotal && fullSubtotal < coupon.minSubtotal) {
    throw BadRequest(`Este cupom exige um subtotal mínimo de ${fmt(coupon.minSubtotal)}.`);
  }

  const discount = discountFor(coupon, fullSubtotal, lines);
  if (discount <= 0 && coupon.scope !== "all") {
    throw BadRequest("Este cupom não se aplica aos itens do seu carrinho.");
  }

  return { coupon, discount };
}
