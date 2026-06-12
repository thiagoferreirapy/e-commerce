import type { Coupon } from "@/types";

/** Cupons válidos (mock). Código é case-insensitive na aplicação. */
export const coupons: Coupon[] = [
  { code: "TORQUE10", type: "percent", value: 10, description: "10% de desconto em todo o site" },
  { code: "FRETEZERO", type: "fixed", value: 30, minSubtotal: 200, description: "R$ 30 OFF acima de R$ 200" },
  { code: "MOTO50", type: "fixed", value: 50, minSubtotal: 500, description: "R$ 50 OFF acima de R$ 500" },
  { code: "BEMVINDO", type: "percent", value: 15, minSubtotal: 300, description: "15% para novos clientes (acima de R$ 300)" },
];

export const couponsByCode = new Map(coupons.map((c) => [c.code.toUpperCase(), c]));
