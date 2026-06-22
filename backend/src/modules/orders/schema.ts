import { z } from "zod";

export const paymentMethod = z.enum(["pix", "cartao", "boleto"]);
export type PaymentMethod = z.infer<typeof paymentMethod>;

const itemSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().nullable().default(null),
  quantity: z.number().int().positive(),
});

const addressSchema = z.object({
  recipient: z.string().min(1),
  cep: z.string().min(8),
  street: z.string().min(1),
  number: z.string().min(1),
  complement: z.string().optional(),
  district: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(2),
  label: z.string().optional(),
});

const cardSchema = z.object({
  number: z.string().min(13).max(19),
  holderName: z.string().min(1),
  expiryMonth: z.string().regex(/^\d{2}$/),
  expiryYear: z.string().regex(/^\d{4}$/),
  ccv: z.string().regex(/^\d{3,4}$/),
});

export const createOrderSchema = z.object({
  items: z.array(itemSchema).optional(),
  address: addressSchema,
  payment: paymentMethod,
  installments: z.coerce.number().int().min(1).max(12).optional().default(1),
  shippingId: z.string().min(1),
  couponCode: z.string().nullable().optional(),
  // CPF/CNPJ do pagador — exigido pela Asaas no Pix e no cartão (validado no service).
  cpf: z.string().optional(),
  // Dados do cartão — exigidos quando payment === "cartao" (validado no service).
  card: cardSchema.optional(),
});
