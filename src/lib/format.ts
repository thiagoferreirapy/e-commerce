/**
 * Formatação pt-BR / regras comerciais brasileiras.
 * Centraliza moeda, parcelamento, desconto Pix, datas e CEP.
 */

const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

/** R$ 1.234,56 */
export function formatBRL(value: number): string {
  return BRL.format(value);
}

/** 25 -> "25% OFF" */
export function formatDiscountBadge(percent: number): string {
  return `${Math.round(percent)}% OFF`;
}

/** Percentual de desconto entre preço cheio e preço final. */
export function discountPercent(listPrice: number, price: number): number {
  if (listPrice <= 0 || price >= listPrice) return 0;
  return Math.round((1 - price / listPrice) * 100);
}

/** Oferta com prazo: expira quando offerEndsAt existe e já passou. */
export function isOfferExpired(offerEndsAt?: string | null): boolean {
  return !!offerEndsAt && new Date(offerEndsAt).getTime() <= Date.now();
}

/**
 * Estado de oferta exibível. Se o prazo passou, reverte ao preço cheio (sem
 * desconto, sem countdown). Sem offerEndsAt = oferta sem prazo (segue valendo).
 * Avaliado no render — atualiza ao recarregar a página/filtro.
 */
export function resolveOffer(p: {
  listPrice: number;
  price: number;
  offerEndsAt?: string | null;
}): { expired: boolean; price: number; listPrice: number; off: number; endsAt?: string } {
  const expired = isOfferExpired(p.offerEndsAt);
  const price = expired ? p.listPrice : p.price;
  return {
    expired,
    price,
    listPrice: p.listPrice,
    off: discountPercent(p.listPrice, price),
    endsAt: expired ? undefined : (p.offerEndsAt ?? undefined),
  };
}

/** Desconto à vista no Pix (config padrão da loja: 10%). */
export const PIX_DISCOUNT = 0.1;

export function pixPrice(price: number, discount = PIX_DISCOUNT): number {
  return round2(price * (1 - discount));
}

/**
 * Parcelamento sem juros. Por padrão até 12x, com parcela mínima de R$ 49,90.
 * Retorna a maior quantidade de parcelas válida e o valor de cada uma.
 */
export function installments(
  price: number,
  maxInstallments = 12,
  minInstallment = 49.9,
): { count: number; value: number } {
  let count = maxInstallments;
  while (count > 1 && price / count < minInstallment) count--;
  return { count, value: round2(price / count) };
}

/** "12x de R$ 99,90 sem juros" */
export function formatInstallments(price: number): string {
  const { count, value } = installments(price);
  if (count <= 1) return `à vista ${formatBRL(price)}`;
  return `${count}x de ${formatBRL(value)} sem juros`;
}

/** 12 de junho de 2026 */
export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(d);
}

/** 12/06/2026 */
export function formatDateShort(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("pt-BR").format(d);
}

/** Normaliza e formata CEP: 01310100 -> 01310-100 */
export function formatCEP(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export function isValidCEP(raw: string): boolean {
  return raw.replace(/\D/g, "").length === 8;
}

/** Máscara de CPF: 12345678900 -> 123.456.789-00 */
export function formatCPF(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
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

/* ----------------------- Cartão de crédito ----------------------- */

/** Máscara do número do cartão: agrupa em blocos de 4 (até 16 dígitos). */
export function formatCardNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

/** Máscara de validade: 1226 -> 12/26 */
export function formatCardExpiry(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 4);
  if (d.length <= 2) return d;
  return `${d.slice(0, 2)}/${d.slice(2)}`;
}

/** Valida o número do cartão pelo algoritmo de Luhn (13–19 dígitos). */
export function isValidCardNumber(raw: string): boolean {
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let even = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = Number(digits[i]);
    if (even) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    even = !even;
  }
  return sum % 10 === 0;
}

/** Valida validade "MM/AA": mês 01–12 e ainda não vencida (compara com o mês atual). */
export function isValidCardExpiry(mmYY: string): boolean {
  const m = /^(\d{2})\/(\d{2})$/.exec(mmYY.trim());
  if (!m) return false;
  const month = Number(m[1]);
  const year = 2000 + Number(m[2]);
  if (month < 1 || month > 12) return false;
  const now = new Date();
  // Vence no fim do mês: válido enquanto o mês/ano for >= o atual.
  const lastDay = new Date(year, month, 0, 23, 59, 59);
  return lastDay.getTime() >= now.getTime();
}

/** Arredonda para 2 casas evitando erros de ponto flutuante. */
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
