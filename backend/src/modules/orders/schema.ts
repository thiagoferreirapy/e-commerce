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

export const createOrderSchema = z.object({
  items: z.array(itemSchema).optional(),
  address: addressSchema,
  payment: paymentMethod,
  installments: z.coerce.number().int().min(1).max(12).optional().default(1),
  shippingId: z.string().min(1),
  couponCode: z.string().nullable().optional(),
  // CPF/CNPJ do pagador — exigido pela Asaas no Pix (validado no service).
  cpf: z.string().optional(),
});
