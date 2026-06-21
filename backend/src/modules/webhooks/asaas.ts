import { Router } from "express";
import { env } from "../../env";
import {
  cancelPendingOrder,
  findOrderIdByAsaasPayment,
  markOrderPaid,
} from "../orders/service";

export const asaasWebhookRouter = Router();

interface AsaasWebhookBody {
  event?: string;
  payment?: { id?: string; externalReference?: string | null };
}

const PAID_EVENTS = new Set(["PAYMENT_RECEIVED", "PAYMENT_CONFIRMED", "PAYMENT_RECEIVED_IN_CASH"]);
const FAILED_EVENTS = new Set([
  "PAYMENT_OVERDUE",
  "PAYMENT_DELETED",
  "PAYMENT_REFUNDED",
  "PAYMENT_CHARGEBACK_REQUESTED",
  "PAYMENT_CHARGEBACK_DISPUTE",
]);

/**
 * Recebe os eventos de pagamento da Asaas e atualiza o status do pedido.
 * Idempotente e redundante com o polling. Responde 200 mesmo em erro interno
 * para a Asaas não reenviar indefinidamente (o polling cobre eventuais falhas).
 */
asaasWebhookRouter.post("/", async (req, res) => {
  // Verificação opcional do token (defina o mesmo valor no painel Asaas).
  if (env.ASAAS_WEBHOOK_TOKEN) {
    const token = req.header("asaas-access-token");
    if (token !== env.ASAAS_WEBHOOK_TOKEN) {
      return res.status(401).json({ error: { message: "Token de webhook inválido." } });
    }
  }

  try {
    const body = req.body as AsaasWebhookBody;
    const event = body.event ?? "";
    const payment = body.payment;
    if (payment && (PAID_EVENTS.has(event) || FAILED_EVENTS.has(event))) {
      const orderId =
        payment.externalReference ||
        (payment.id ? await findOrderIdByAsaasPayment(payment.id) : null);
      if (orderId) {
        if (PAID_EVENTS.has(event)) await markOrderPaid(orderId);
        else await cancelPendingOrder(orderId);
      }
    }
  } catch (err) {
    console.error("[asaas-webhook] erro ao processar:", (err as Error).message);
  }

  res.json({ received: true });
});
