import type { Address, Order, User } from "@/types";

/** Usuário-demo (preenche a área "Minha Conta" sem backend). */
export const demoAddresses: Address[] = [
  {
    id: "addr-1",
    label: "Casa",
    recipient: "Vinícius Freitas",
    cep: "01310-100",
    street: "Av. Paulista",
    number: "1578",
    complement: "Apto 142",
    district: "Bela Vista",
    city: "São Paulo",
    state: "SP",
    isDefault: true,
  },
  {
    id: "addr-2",
    label: "Trabalho",
    recipient: "Vinícius Freitas",
    cep: "04538-133",
    street: "Av. Brigadeiro Faria Lima",
    number: "3477",
    district: "Itaim Bibi",
    city: "São Paulo",
    state: "SP",
  },
];

export const demoUser: User = {
  id: "u-1",
  name: "Vinícius Freitas",
  email: "vfreitas664@gmail.com",
  cpf: "123.456.789-00",
  phone: "(11) 98888-7777",
  addresses: demoAddresses,
};

/** Pedidos-demo com status variados. */
export const demoOrders: Order[] = [
  {
    id: "o-1",
    number: "TQ-2026-0042",
    createdAt: "2026-05-28T14:30:00.000Z",
    status: "entregue",
    items: [
      {
        productId: "agv-k6s",
        name: "Capacete AGV K6 S Mono Matt Black",
        imageUrl: "https://loremflickr.com/200/200/motorcycle,helmet?lock=4101",
        variantLabel: "Preto Fosco · 58",
        unitPrice: 2639,
        quantity: 1,
      },
    ],
    subtotal: 2639,
    discount: 263.9,
    shipping: 0,
    total: 2375.1,
    payment: "pix",
    shippingLabel: "SEDEX",
    address: demoAddresses[0],
  },
  {
    id: "o-2",
    number: "TQ-2026-0051",
    createdAt: "2026-06-05T10:12:00.000Z",
    status: "enviado",
    items: [
      {
        productId: "pt-pwc-biz",
        name: "Escapamento Pro Tork PowerCore Biz 125",
        imageUrl: "https://loremflickr.com/200/200/motorcycle,exhaust?lock=4102",
        variantLabel: "Preto",
        unitPrice: 289.9,
        quantity: 1,
      },
      {
        productId: "mtl-7100-1l",
        name: "Óleo Motul 7100 4T 10W40 Sintético 1L",
        imageUrl: "https://loremflickr.com/200/200/motor,oil?lock=4103",
        unitPrice: 74.9,
        quantity: 2,
      },
    ],
    subtotal: 439.7,
    discount: 0,
    shipping: 24.9,
    total: 464.6,
    payment: "cartao",
    shippingLabel: "PAC",
    address: demoAddresses[0],
  },
  {
    id: "o-3",
    number: "TQ-2026-0058",
    createdAt: "2026-06-10T17:45:00.000Z",
    status: "pago",
    items: [
      {
        productId: "alp-tfaster",
        name: "Jaqueta Alpinestars T-Faster Air",
        imageUrl: "https://loremflickr.com/200/200/motorcycle,jacket?lock=4104",
        variantLabel: "Preto · M",
        unitPrice: 1199,
        quantity: 1,
      },
    ],
    subtotal: 1199,
    discount: 119.9,
    shipping: 0,
    total: 1079.1,
    payment: "pix",
    shippingLabel: "SEDEX",
    address: demoAddresses[1],
  },
];
