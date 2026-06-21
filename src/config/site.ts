/** Configuração central da marca e navegação. */
export const site = {
  name: "TORQUE",
  tagline: "Equipamentos & acessórios para quem vive de moto",
  description:
    "Capacetes, escapamentos, vestuário, pneus e acessórios das melhores marcas. Frete grátis, parcelamento sem juros e desconto no Pix.",
  url: "https://torque.example.com",
  whatsapp: "5511999990000",
  cnpj: "12.345.678/0001-90",
  address: "Av. das Motocicletas, 1000 — São Paulo/SP",
  email: "contato@torque.com.br",
  phone: "0800 123 4567",
  social: {
    instagram: "https://instagram.com",
    facebook: "https://facebook.com",
    youtube: "https://youtube.com",
    tiktok: "https://tiktok.com",
  },
};

/** Faixa de benefícios do topo. */
export const benefits = [
  { icon: "truck", title: "Frete grátis", text: "Acima de R$ 299 no SEDEX" },
  { icon: "pix", title: "10% no Pix", text: "Desconto à vista" },
  { icon: "card", title: "Até 12x sem juros", text: "No cartão de crédito" },
  { icon: "shield", title: "Compra 100% segura", text: "Pagamento protegido (SSL)" },
] as const;

/** Estrutura do mega menu (categoria -> colunas/links). */
export interface NavGroup {
  label: string;
  href: string;
  columns?: { title: string; links: { label: string; href: string }[] }[];
  brands?: string[];
}

export const navigation: NavGroup[] = [
  {
    label: "Capacetes",
    href: "/categoria/capacetes",
    columns: [
      {
        title: "Por tipo",
        links: [
          { label: "Fechados", href: "/categoria/capacetes-fechados" },
          { label: "Articulados", href: "/categoria/capacetes-articulados" },
          { label: "Ver todos", href: "/categoria/capacetes" },
        ],
      },
      {
        title: "Por marca",
        links: [
          { label: "AGV", href: "/categoria/capacetes?marca=agv" },
          { label: "Airoh", href: "/categoria/capacetes?marca=airoh" },
          { label: "LS2", href: "/categoria/capacetes?marca=ls2" },
          { label: "Norisk", href: "/categoria/capacetes?marca=norisk" },
        ],
      },
    ],
  },
  {
    label: "Escapamentos",
    href: "/categoria/escapamentos",
  },
  {
    label: "Vestuário",
    href: "/categoria/vestuario",
    columns: [
      {
        title: "Categorias",
        links: [
          { label: "Jaquetas", href: "/categoria/jaquetas" },
          { label: "Luvas", href: "/categoria/luvas" },
          { label: "Ver todos", href: "/categoria/vestuario" },
        ],
      },
    ],
  },
  { label: "Pneus", href: "/categoria/pneus" },
  { label: "Baús e Malas", href: "/categoria/baus-e-malas" },
  { label: "Óleos", href: "/categoria/oleos-e-lubrificantes" },
  { label: "Acessórios", href: "/categoria/acessorios" },
];

export const footerLinks = {
  institucional: [
    { label: "Sobre a TORQUE", href: "/sobre" },
    { label: "Lojas físicas", href: "/lojas" },
    { label: "Trabalhe conosco", href: "/trabalhe-conosco" },
  ],
  atendimento: [
    { label: "Central de ajuda", href: "/ajuda" },
    { label: "Trocas e devoluções", href: "/trocas-e-devolucoes" },
    { label: "Prazos de entrega", href: "/prazos-de-entrega" },
    { label: "Rastrear pedido", href: "/rastrear" },
  ],
  institucional2: [
    { label: "Política de privacidade", href: "/politica-de-privacidade" },
    { label: "Termos de uso", href: "/termos-de-uso" },
    { label: "Política de trocas", href: "/politica-de-trocas" },
  ],
};

export const paymentMethods = ["Pix", "Visa", "Master", "Elo", "Amex", "Boleto"] as const;
