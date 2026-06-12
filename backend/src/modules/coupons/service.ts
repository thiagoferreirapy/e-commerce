import { prisma } from "../../lib/prisma";
import { BadRequest } from "../../lib/errors";
import { round2 } from "../../lib/format";

export interface CouponDTO {
  code: string;
  type: "percent" | "fixed";
  value: number;
  minSubtotal?: number;
  description: string;
}

export interface CouponResult {
  coupon: CouponDTO;
  discount: number;
}

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

/** Calcula o desconto de um cupom válido. */
export function discountFor(coupon: CouponDTO, subtotal: number): number {
  if (coupon.minSubtotal && subtotal < coupon.minSubtotal) return 0;
  const value =
    coupon.type === "percent" ? subtotal * (coupon.value / 100) : Math.min(coupon.value, subtotal);
  return round2(value);
}

export async function applyCoupon(code: string, subtotal: number): Promise<CouponResult> {
  const row = await prisma.coupon.findUnique({ where: { code: code.trim().toUpperCase() } });
  if (!row) throw BadRequest("Cupom inválido ou expirado.");
  const coupon: CouponDTO = {
    code: row.code,
    type: row.type as "percent" | "fixed",
    value: row.value,
    minSubtotal: row.minSubtotal ?? undefined,
    description: row.description,
  };
  if (coupon.minSubtotal && subtotal < coupon.minSubtotal) {
    throw BadRequest(`Este cupom exige um subtotal mínimo de ${fmt(coupon.minSubtotal)}.`);
  }
  return { coupon, discount: discountFor(coupon, subtotal) };
}
