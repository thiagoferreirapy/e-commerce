import type { OrderStatus } from "@/types";

export type StatusTone = "success" | "ink" | "warning" | "danger" | "neutral";

/** Rótulo amigável de cada status de pedido. */
export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  aguardando_pagamento: "Aguardando pagamento",
  pago: "Pago",
  enviado: "Enviado",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

/** Tom (cor) do badge por status. */
export const ORDER_STATUS_TONE: Record<OrderStatus, StatusTone> = {
  aguardando_pagamento: "neutral",
  pago: "warning",
  enviado: "ink",
  entregue: "success",
  cancelado: "danger",
};
