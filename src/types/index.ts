/**
 * Tipos de domínio do e-commerce TORQUE.
 * Compartilhados entre a camada de dados, serviços e a UI.
 */

export type ID = string;

export interface Brand {
  id: ID;
  name: string;
  slug: string;
  logoUrl: string;
}

export interface Category {
  id: ID;
  name: string;
  slug: string;
  /** Categoria pai (para subcategorias). */
  parentSlug?: string;
  imageUrl: string;
  /** Emoji/ícone NÃO é usado na UI — usamos imagem. Mantido só para seed. */
  description?: string;
  /** Destaque no header (aparece primeiro) e ordem de exibição. */
  featured?: boolean;
  position?: number;
}

export type VariantAxis = "color" | "size";

export interface VariantOption {
  axis: VariantAxis;
  /** Valor legível: "Preto", "GG", "58". */
  label: string;
  /** Valor canônico para comparação/URL. */
  value: string;
  /** Para cor: hex para o swatch. */
  hex?: string;
}

export interface ProductVariant {
  id: ID;
  /** Combinação de opções, ex: { color: "preto", size: "58" }. */
  options: Partial<Record<VariantAxis, string>>;
  sku: string;
  stock: number;
  /** Sobrescreve a imagem principal quando a cor muda. */
  imageUrl?: string;
}

export interface Review {
  id: ID;
  author: string;
  rating: number; // 1..5
  title: string;
  comment: string;
  date: string; // ISO
  verified: boolean;
}

export interface Seller {
  id: ID;
  name: string;
  rating: number;
  /** Vendido por terceiro (marketplace) vs. própria loja. */
  official: boolean;
}

export interface Product {
  id: ID;
  name: string;
  slug: string;
  brandId: ID;
  /** Marca embutida pela API (evita lookup separado no cliente). */
  brand?: Brand;
  categorySlug: string;
  subcategorySlug?: string;
  /** Preço cheio (de). */
  listPrice: number;
  /** Preço atual (por) — base para Pix e parcelamento. */
  price: number;
  ref: string; // SKU/REF base
  shortDescription: string;
  description: string;
  specs: { label: string; value: string }[];
  images: string[];
  rating: number; // média
  reviewCount: number;
  reviews: Review[];
  /** Eixos disponíveis + opções. */
  variantAxes: { axis: VariantAxis; options: VariantOption[] }[];
  variants: ProductVariant[];
  totalStock: number;
  freeShipping: boolean;
  tags: ProductTag[];
  /** Fim de uma oferta relâmpago (ISO) — alimenta o countdown. */
  offerEndsAt?: string;
  seller: Seller;
  createdAt: string; // ISO — para "Novidades"
  soldCount: number; // para "Mais Vendidos"
}

export type ProductTag =
  | "destaque"
  | "novidade"
  | "mais-vendido"
  | "oferta-do-dia"
  | "ultimas-unidades";

/** Item dentro do carrinho. */
export interface CartItem {
  productId: ID;
  /** Variante selecionada (id) — null se produto sem variantes. */
  variantId: ID | null;
  quantity: number;
}

export type CouponType = "percent" | "fixed";

/** Escopo do cupom: site todo, categoria, marca ou produto específico. */
export type CouponScope = "all" | "category" | "brand" | "product";

export interface Coupon {
  code: string;
  type: CouponType;
  /** percent: 0..100 | fixed: valor em R$. */
  value: number;
  minSubtotal?: number;
  description: string;
  scope: CouponScope;
  /** slug da categoria/marca ou id do produto; ausente quando scope=all. */
  scopeValue?: string | null;
  /** Limite total de resgates; ausente/null = ilimitado. */
  maxUses?: number | null;
  usedCount?: number;
  /** Janela de validade (ISO); ausente = sem restrição. */
  startsAt?: string | null;
  expiresAt?: string | null;
}

export interface ShippingOption {
  id: string;
  label: string; // PAC, SEDEX...
  price: number;
  /** Prazo em dias úteis. */
  etaDays: number;
}

export type OrderStatus = "aguardando_pagamento" | "pago" | "enviado" | "entregue" | "cancelado";

/** Dados do Pix (Asaas) de um pedido. */
export interface OrderPix {
  payload: string; // copia-e-cola
  encodedImage: string; // QR em base64 (PNG, sem prefixo data:)
  expiresAt: string | null;
}

/** Dados do boleto (Asaas) de um pedido. */
export interface OrderBoleto {
  line: string; // linha digitável
  url: string; // página/PDF do boleto
  dueDate: string | null; // vencimento
}

export type PaymentMethod = "pix" | "cartao" | "boleto";

export interface Address {
  id: ID;
  label: string; // "Casa", "Trabalho"
  recipient: string;
  cep: string;
  street: string;
  number: string;
  complement?: string;
  district: string;
  city: string;
  state: string;
  isDefault?: boolean;
}

export interface OrderItem {
  productId: ID;
  name: string;
  imageUrl: string;
  variantLabel?: string;
  unitPrice: number;
  quantity: number;
  /** slug do produto (para avaliar pela conta) e se já foi avaliado pelo usuário. */
  slug?: string;
  reviewed?: boolean;
}

export interface Order {
  id: ID;
  number: string; // ex: "TQ-2026-0001"
  createdAt: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  payment: PaymentMethod;
  installments?: number;
  address: Address;
  shippingLabel: string;
  /** Presente em pedidos Pix (Asaas). */
  pix?: OrderPix;
  /** Presente em pedidos no cartão (exibição). */
  cardLast4?: string;
  cardBrand?: string;
  /** Presente em pedidos via boleto (Asaas). */
  boleto?: OrderBoleto;
}

export interface User {
  id: ID;
  name: string;
  email: string;
  role?: string; // "user" | "admin"
  cpf?: string;
  phone?: string;
  addresses: Address[];
}
