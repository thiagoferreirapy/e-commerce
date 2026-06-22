import { env } from "../../env";
import { AppError, BadRequest } from "../../lib/errors";

/**
 * Cliente HTTP fino da Asaas (Pix). Autentica via header `access_token`.
 * Doc: https://docs.asaas.com/
 */
interface AsaasOptions {
  method?: "GET" | "POST" | "DELETE";
  body?: unknown;
}

async function asaasFetch<T>(path: string, options: AsaasOptions = {}): Promise<T> {
  if (!env.API_KEY_ASAAS) {
    throw BadRequest("Pagamento por Pix indisponível: chave da Asaas não configurada.");
  }
  const { method = "GET", body } = options;
  const res = await fetch(`${env.ASAAS_BASE_URL}${path}`, {
    method,
    headers: {
      access_token: env.API_KEY_ASAAS,
      "Content-Type": "application/json",
      "User-Agent": "torque-ecommerce",
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = (await res.json().catch(() => null)) as unknown;
  if (!res.ok) {
    const msg =
      (data as { errors?: { description?: string }[] } | null)?.errors?.[0]?.description ??
      "Falha na comunicação com a Asaas.";
    // 4xx da Asaas vira 400 nosso (entrada inválida); 5xx vira 502.
    throw new AppError(res.status >= 500 ? 502 : 400, `Asaas: ${msg}`);
  }
  return data as T;
}

/* ---- Tipos mínimos das respostas ---- */
interface AsaasCustomer {
  id: string;
}
interface AsaasListCustomers {
  data: AsaasCustomer[];
}
export interface AsaasPayment {
  id: string;
  status: string; // PENDING | RECEIVED | CONFIRMED | OVERDUE | REFUNDED | ...
  // Presentes na resposta de cobrança no cartão (número mascarado + bandeira).
  creditCard?: {
    creditCardNumber?: string; // últimos 4 dígitos
    creditCardBrand?: string; // VISA | MASTERCARD | ...
  };
  // Presentes na resposta de cobrança via boleto.
  bankSlipUrl?: string; // página/PDF do boleto
  invoiceUrl?: string; // fatura
  dueDate?: string; // vencimento (YYYY-MM-DD)
}
export interface AsaasPixQrCode {
  encodedImage: string; // PNG base64 (sem o prefixo data:)
  payload: string; // copia-e-cola
  expirationDate: string; // ISO
}

/** Data de hoje em YYYY-MM-DD (vencimento da cobrança). */
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Data daqui a `days` dias em YYYY-MM-DD (vencimento do boleto). */
function inDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Reaproveita o cliente pelo CPF/CNPJ; cria se não existir. */
export async function getOrCreateCustomer(input: {
  name: string;
  cpfCnpj: string;
  email?: string;
  phone?: string;
}): Promise<string> {
  const cpfCnpj = input.cpfCnpj.replace(/\D/g, "");
  const found = await asaasFetch<AsaasListCustomers>(`/customers?cpfCnpj=${cpfCnpj}`);
  if (found.data?.length) return found.data[0].id;
  const created = await asaasFetch<AsaasCustomer>("/customers", {
    method: "POST",
    body: { name: input.name, cpfCnpj, email: input.email, mobilePhone: input.phone },
  });
  return created.id;
}

/** Cria uma cobrança Pix para um cliente. */
export async function createPixCharge(input: {
  customerId: string;
  value: number;
  externalReference: string;
  description: string;
}): Promise<AsaasPayment> {
  return asaasFetch<AsaasPayment>("/payments", {
    method: "POST",
    body: {
      customer: input.customerId,
      billingType: "PIX",
      value: input.value,
      dueDate: today(),
      externalReference: input.externalReference,
      description: input.description,
    },
  });
}

/** QR Code + copia-e-cola de uma cobrança Pix. */
export function getPixQrCode(paymentId: string): Promise<AsaasPixQrCode> {
  return asaasFetch<AsaasPixQrCode>(`/payments/${paymentId}/pixQrCode`);
}

export interface AsaasBoletoIdentification {
  identificationField: string; // linha digitável
  nossoNumero?: string;
  barCode?: string;
}

/** Cria uma cobrança via boleto bancário (assíncrono: confirma quando pago). */
export function createBoletoCharge(input: {
  customerId: string;
  value: number;
  daysToDue: number;
  externalReference: string;
  description: string;
}): Promise<AsaasPayment> {
  return asaasFetch<AsaasPayment>("/payments", {
    method: "POST",
    body: {
      customer: input.customerId,
      billingType: "BOLETO",
      value: input.value,
      dueDate: inDays(input.daysToDue),
      externalReference: input.externalReference,
      description: input.description,
    },
  });
}

/** Linha digitável + código de barras de um boleto. */
export function getBoletoIdentificationField(
  paymentId: string,
): Promise<AsaasBoletoIdentification> {
  return asaasFetch<AsaasBoletoIdentification>(`/payments/${paymentId}/identificationField`);
}

export interface CardInput {
  holderName: string;
  number: string;
  expiryMonth: string;
  expiryYear: string;
  ccv: string;
}
export interface CardHolderInfo {
  name: string;
  email?: string;
  cpfCnpj: string;
  postalCode: string;
  addressNumber: string;
  phone?: string;
}

/**
 * Cria uma cobrança no cartão de crédito (checkout transparente). É síncrona: a
 * Asaas autoriza na hora e retorna `CONFIRMED` (aprovado) ou lança erro (recusada).
 * Parcelado usa `installmentCount` + `totalValue` (sem juros para o cliente).
 */
export function createCardCharge(input: {
  customerId: string;
  value: number;
  installmentCount: number;
  externalReference: string;
  description: string;
  card: CardInput;
  holder: CardHolderInfo;
  remoteIp: string;
}): Promise<AsaasPayment> {
  const installments = Math.max(1, input.installmentCount);
  return asaasFetch<AsaasPayment>("/payments", {
    method: "POST",
    body: {
      customer: input.customerId,
      billingType: "CREDIT_CARD",
      dueDate: today(),
      externalReference: input.externalReference,
      description: input.description,
      // Valor único vs. parcelado (a Asaas não aceita `value` junto de `totalValue`).
      ...(installments > 1
        ? { installmentCount: installments, totalValue: input.value }
        : { value: input.value }),
      creditCard: {
        holderName: input.card.holderName,
        number: input.card.number.replace(/\D/g, ""),
        expiryMonth: input.card.expiryMonth,
        expiryYear: input.card.expiryYear,
        ccv: input.card.ccv,
      },
      creditCardHolderInfo: {
        name: input.holder.name,
        email: input.holder.email,
        cpfCnpj: input.holder.cpfCnpj.replace(/\D/g, ""),
        postalCode: input.holder.postalCode.replace(/\D/g, ""),
        addressNumber: input.holder.addressNumber,
        phone: input.holder.phone,
      },
      remoteIp: input.remoteIp,
    },
  });
}

/** Status atual de uma cobrança (usado no polling/reconciliação). */
export function getPayment(paymentId: string): Promise<AsaasPayment> {
  return asaasFetch<AsaasPayment>(`/payments/${paymentId}`);
}

/** A cobrança foi efetivamente paga? */
export function isPaidStatus(status: string): boolean {
  return status === "RECEIVED" || status === "CONFIRMED" || status === "RECEIVED_IN_CASH";
}

/** A cobrança caducou/foi cancelada/estornada? */
export function isFailedStatus(status: string): boolean {
  return (
    status === "OVERDUE" ||
    status === "REFUNDED" ||
    status === "DELETED" ||
    status === "REFUND_REQUESTED" ||
    status === "CHARGEBACK_REQUESTED"
  );
}
