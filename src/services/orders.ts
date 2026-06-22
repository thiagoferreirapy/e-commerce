import type { Order, OrderPix, OrderStatus, PaymentMethod } from "@/types";
import { apiFetch } from "@/lib/api";

export interface CreateOrderInput {
  items?: { productId: string; variantId: string | null; quantity: number }[];
  address: {
    recipient: string;
    cep: string;
    street: string;
    number: string;
    complement?: string;
    district: string;
    city: string;
    state: string;
    label?: string;
  };
  payment: PaymentMethod;
  installments?: number;
  shippingId: string;
  couponCode?: string | null;
  /** CPF/CNPJ do pagador — obrigatório no Pix e no cartão (Asaas). */
  cpf?: string;
  /** Dados do cartão — obrigatórios quando payment === "cartao". */
  card?: {
    number: string;
    holderName: string;
    expiryMonth: string;
    expiryYear: string;
    ccv: string;
  };
}

/** Cria o pedido (totais recalculados no servidor). Aceita visitante ou logado. */
export async function placeOrder(
  input: CreateOrderInput,
): Promise<{ orderNumber: string; order: Order }> {
  return apiFetch("/orders", { method: "POST", body: input });
}

/** Pedidos do usuário autenticado (Minha Conta). */
export async function getMyOrders(): Promise<Order[]> {
  return apiFetch<Order[]>("/orders");
}

export async function getOrder(id: string): Promise<Order> {
  return apiFetch<Order>(`/orders/${id}`);
}

/** Status do pagamento (público pelo id). Reconcilia com a Asaas no servidor. */
export async function getPaymentStatus(orderId: string): Promise<{ status: OrderStatus }> {
  return apiFetch<{ status: OrderStatus }>(`/orders/${orderId}/payment-status`);
}

/** QR/copia-e-cola do Pix de um pedido. */
export async function getOrderPix(
  orderId: string,
): Promise<OrderPix & { status: OrderStatus }> {
  return apiFetch(`/orders/${orderId}/pix`);
}
