import type { Order, PaymentMethod } from "@/types";
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
