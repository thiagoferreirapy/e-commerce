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

/** Valida CPF pelo dígito verificador (rejeita sequências e checksum inválido). */
export function isValidCPF(raw: string): boolean {
  const cpf = raw.replace(/\D/g, "");
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  const digit = (slice: number) => {
    let sum = 0;
    for (let i = 0; i < slice; i++) sum += Number(cpf[i]) * (slice + 1 - i);
    const r = 11 - (sum % 11);
    return r >= 10 ? 0 : r;
  };
  return digit(9) === Number(cpf[9]) && digit(10) === Number(cpf[10]);
}
