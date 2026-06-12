/** Regras numéricas/comerciais compartilhadas (espelha src/lib/format do front). */

export const PIX_DISCOUNT = 0.1;

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function pixPrice(price: number, discount = PIX_DISCOUNT): number {
  return round2(price * (1 - discount));
}

export function discountPercent(listPrice: number, price: number): number {
  if (listPrice <= 0 || price >= listPrice) return 0;
  return Math.round((1 - price / listPrice) * 100);
}

export function installments(
  price: number,
  maxInstallments = 12,
  minInstallment = 49.9,
): { count: number; value: number } {
  let count = maxInstallments;
  while (count > 1 && price / count < minInstallment) count--;
  return { count, value: round2(price / count) };
}
