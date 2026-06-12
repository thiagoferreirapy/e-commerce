import type {
  Product,
  ProductTag,
  ProductVariant,
  Review,
  Seller,
  VariantAxis,
  VariantOption,
} from "@/types";
import { round2 } from "@/lib/format";

/* ===========================================================================
   Seed de produtos TORQUE
   ~40 produtos de moto (capacetes, escapamentos, vestuário, pneus, baús,
   óleos, acessórios). Construído por um helper para manter consistência
   (variantes, estoque, reviews, imagens) sem repetir boilerplate.
   =========================================================================== */

const NOW = "2026-06-12T09:00:00.000Z";

/** Datas relativas fixas (build determinístico — sem Date.now). */
function daysAgo(days: number): string {
  const base = new Date(NOW).getTime();
  return new Date(base - days * 86400000).toISOString();
}
function daysFromNow(days: number): string {
  const base = new Date(NOW).getTime();
  return new Date(base + days * 86400000).toISOString();
}

/** Palavra-chave de imagem por categoria (LoremFlickr busca por tag). */
const CATEGORY_KEYWORD: Record<string, string> = {
  capacetes: "motorcycle,helmet",
  escapamentos: "motorcycle,exhaust",
  vestuario: "motorcycle,jacket",
  pneus: "motorcycle,tire",
  "baus-e-malas": "motorcycle,case",
  "oleos-e-lubrificantes": "motor,oil",
  acessorios: "motorcycle,gear",
};

/** Hash estável (string -> número) para o lock determinístico do LoremFlickr. */
function lockOf(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h % 100000;
}

/** Imagem temática de moto, determinística (mesmo seed → mesma imagem). */
function img(keyword: string, seed: string): string {
  return `https://loremflickr.com/900/900/${encodeURIComponent(keyword)}?lock=${lockOf(seed)}`;
}

const OFFICIAL: Seller = { id: "s-torque", name: "TORQUE Oficial", rating: 4.9, official: true };
const PARTNER: Seller = { id: "s-velomax", name: "VeloMax Acessórios", rating: 4.6, official: false };

const COLOR_HEX: Record<string, string> = {
  preto: "#16181D",
  "preto-fosco": "#2A2622",
  branco: "#F3F1ED",
  cinza: "#7C746A",
  vermelho: "#D92D20",
  azul: "#2563EB",
  prata: "#C9CDD2",
  cromado: "#D9DCE0",
  grafite: "#403B35",
  verde: "#1F9D55",
};

const REVIEW_BANK: Omit<Review, "id" | "date">[] = [
  { author: "Rafael M.", rating: 5, title: "Surpreendeu", comment: "Acabamento impecável, chegou antes do prazo. Recomendo demais.", verified: true },
  { author: "Juliana P.", rating: 4, title: "Muito bom", comment: "Ótimo custo-benefício, só achei a numeração um pouco justa.", verified: true },
  { author: "Carlos E.", rating: 5, title: "Top de linha", comment: "Exatamente como descrito. Uso todo dia e não troco.", verified: true },
  { author: "Bruno S.", rating: 4, title: "Vale a pena", comment: "Qualidade boa pelo preço. Entrega rápida.", verified: false },
  { author: "Patrícia L.", rating: 5, title: "Perfeito", comment: "Produto original, lacrado, com nota fiscal. Loja confiável.", verified: true },
];

function buildReviews(seed: number, count: number): Review[] {
  const list: Review[] = [];
  for (let i = 0; i < count; i++) {
    const base = REVIEW_BANK[(seed + i) % REVIEW_BANK.length];
    list.push({ ...base, id: `rv-${seed}-${i}`, date: daysAgo(3 + i * 7) });
  }
  return list;
}

function avgRating(reviews: Review[]): number {
  if (!reviews.length) return 0;
  const sum = reviews.reduce((a, r) => a + r.rating, 0);
  return round2(sum / reviews.length);
}

type AxisInput = { axis: VariantAxis; values: string[] };

/** Expande eixos -> variantAxes + variants com SKU e estoque por combinação. */
function buildVariants(
  ref: string,
  baseImageSeed: string,
  axes: AxisInput[],
  keyword: string,
): {
  variantAxes: Product["variantAxes"];
  variants: ProductVariant[];
  totalStock: number;
} {
  const variantAxes: Product["variantAxes"] = axes.map((a) => ({
    axis: a.axis,
    options: a.values.map<VariantOption>((v) => ({
      axis: a.axis,
      value: v,
      label: a.axis === "color" ? labelize(v) : v.toUpperCase(),
      hex: a.axis === "color" ? COLOR_HEX[v] ?? "#7C746A" : undefined,
    })),
  }));

  // Produto cartesiano das combinações.
  let combos: Partial<Record<VariantAxis, string>>[] = [{}];
  for (const a of axes) {
    const next: Partial<Record<VariantAxis, string>>[] = [];
    for (const c of combos) for (const v of a.values) next.push({ ...c, [a.axis]: v });
    combos = next;
  }

  let totalStock = 0;
  const variants = combos.map((options, i) => {
    // Estoque pseudo-determinístico (varia, alguns esgotados).
    const stock = (i * 7 + ref.length * 3) % 13;
    totalStock += stock;
    const colorVal = options.color;
    return {
      id: `${ref}-v${i}`,
      options,
      sku: `${ref}-${Object.values(options).join("-").toUpperCase() || "UN"}`,
      stock,
      imageUrl: colorVal ? img(keyword, `${baseImageSeed}-${colorVal}`) : undefined,
    } satisfies ProductVariant;
  });

  return { variantAxes, variants, totalStock };
}

function labelize(v: string): string {
  return v.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

interface SeedInput {
  name: string;
  slug: string;
  brandId: string;
  categorySlug: string;
  subcategorySlug?: string;
  listPrice: number;
  price: number;
  ref: string;
  shortDescription: string;
  description: string;
  specs: { label: string; value: string }[];
  imageSeed: string;
  imageCount?: number;
  axes?: AxisInput[];
  freeShipping?: boolean;
  tags?: ProductTag[];
  offerInDays?: number; // se setado, vira oferta-do-dia com countdown
  seller?: Seller;
  reviewCount?: number;
  soldCount: number;
  createdDaysAgo: number;
}

let seedCounter = 0;

function makeProduct(input: SeedInput): Product {
  seedCounter++;
  const keyword = CATEGORY_KEYWORD[input.categorySlug] ?? "motorcycle";
  const reviews = buildReviews(seedCounter, input.reviewCount ?? 3);
  const { variantAxes, variants, totalStock } = input.axes
    ? buildVariants(input.ref, input.imageSeed, input.axes, keyword)
    : { variantAxes: [], variants: [], totalStock: (seedCounter * 5) % 40 || 12 };

  const images = Array.from({ length: input.imageCount ?? 4 }, (_, i) =>
    img(keyword, `${input.imageSeed}-${i + 1}`),
  );

  const tags = [...(input.tags ?? [])];
  if (totalStock > 0 && totalStock <= 5 && !tags.includes("ultimas-unidades")) {
    tags.push("ultimas-unidades");
  }

  return {
    id: input.ref.toLowerCase(),
    name: input.name,
    slug: input.slug,
    brandId: input.brandId,
    categorySlug: input.categorySlug,
    subcategorySlug: input.subcategorySlug,
    listPrice: input.listPrice,
    price: input.price,
    ref: input.ref,
    shortDescription: input.shortDescription,
    description: input.description,
    specs: input.specs,
    images,
    rating: avgRating(reviews),
    reviewCount: reviews.length,
    reviews,
    variantAxes,
    variants,
    totalStock,
    freeShipping: input.freeShipping ?? input.price >= 299,
    tags,
    offerEndsAt: input.offerInDays ? daysFromNow(input.offerInDays) : undefined,
    seller: input.seller ?? OFFICIAL,
    createdAt: daysAgo(input.createdDaysAgo),
    soldCount: input.soldCount,
  };
}

const SIZE_NUM = ["56", "58", "60", "62"];
const SIZE_LETTER = ["p", "m", "g", "gg"];

export const products: Product[] = [
  // ----------------------------- CAPACETES ---------------------------------
  makeProduct({
    name: "Capacete AGV K6 S Mono Matt Black",
    slug: "capacete-agv-k6-s-mono-matt-black",
    brandId: "b-agv",
    categorySlug: "capacetes",
    subcategorySlug: "capacetes-fechados",
    listPrice: 3299, price: 2639, ref: "AGV-K6S",
    shortDescription: "Casco em fibra de carbono e aramida, ultraleve, aerodinâmica de pista.",
    description:
      "O AGV K6 S combina o DNA de pista da AGV com conforto para o dia a dia. Casco em fibra de carbono, vidro e aramida, viseira panorâmica com preparação para Pinlock e forração removível e lavável. Um dos capacetes mais leves da categoria.",
    specs: [
      { label: "Casco", value: "Carbono + Aramida + Fibra" },
      { label: "Peso", value: "1.270 g (±50g)" },
      { label: "Certificação", value: "ECE 22.06 / Inmetro" },
      { label: "Viseira", value: "Preparada para Pinlock 120" },
      { label: "Forração", value: "Removível e lavável" },
    ],
    imageSeed: "agv-k6s", axes: [
      { axis: "color", values: ["preto-fosco", "branco", "cinza"] },
      { axis: "size", values: SIZE_NUM },
    ],
    tags: ["destaque", "mais-vendido"], reviewCount: 5, soldCount: 412, createdDaysAgo: 120,
  }),
  makeProduct({
    name: "Capacete Airoh Matryx Color Cinza",
    slug: "capacete-airoh-matryx-color-cinza",
    brandId: "b-airoh", categorySlug: "capacetes", subcategorySlug: "capacetes-fechados",
    listPrice: 1899, price: 1424, ref: "AIR-MTRX",
    shortDescription: "Esportivo de entrada premium, casco HRT e ótima ventilação.",
    description:
      "O Airoh Matryx entrega visual agressivo e segurança de sobra. Casco em HRT (High Resistant Thermoplastic), sistema de ventilação dianteira e traseira, viseira com tratamento anti-risco e engate rápido. Conforto para uso urbano e viagens.",
    specs: [
      { label: "Casco", value: "HRT termoplástico" },
      { label: "Peso", value: "1.450 g (±50g)" },
      { label: "Certificação", value: "ECE 22.06 / Inmetro" },
      { label: "Ventilação", value: "Dianteira + traseira reguláveis" },
    ],
    imageSeed: "airoh-matryx", axes: [
      { axis: "color", values: ["cinza", "preto", "vermelho"] },
      { axis: "size", values: SIZE_NUM },
    ],
    tags: ["oferta-do-dia"], offerInDays: 2, reviewCount: 4, soldCount: 287, createdDaysAgo: 60,
  }),
  makeProduct({
    name: "Capacete LS2 Valiant II Articulado",
    slug: "capacete-ls2-valiant-ii-articulado",
    brandId: "b-ls2", categorySlug: "capacetes", subcategorySlug: "capacetes-articulados",
    listPrice: 1699, price: 1359, ref: "LS2-VAL2",
    shortDescription: "Queixeira 180° que vira no topo — ideal para viagens longas.",
    description:
      "O LS2 Valiant II tem mecanismo exclusivo que recolhe a queixeira 180° para o topo, transformando-se num capacete aberto sem volume extra. Óculos de sol interno retrátil e forração higiênica. Versatilidade total para o motociclista urbano.",
    specs: [
      { label: "Tipo", value: "Articulado (flip-back 180°)" },
      { label: "Casco", value: "KPA termoplástico" },
      { label: "Óculos interno", value: "Sim, retrátil" },
      { label: "Certificação", value: "ECE 22.06 / Inmetro" },
    ],
    imageSeed: "ls2-valiant", axes: [
      { axis: "color", values: ["preto", "branco", "grafite"] },
      { axis: "size", values: SIZE_NUM },
    ],
    tags: ["mais-vendido"], reviewCount: 5, soldCount: 351, createdDaysAgo: 200,
  }),
  makeProduct({
    name: "Capacete Norisk Force Darkside",
    slug: "capacete-norisk-force-darkside",
    brandId: "b-norisk", categorySlug: "capacetes", subcategorySlug: "capacetes-fechados",
    listPrice: 749, price: 524, ref: "NOR-FORCE",
    shortDescription: "Custo-benefício imbatível com viseira dupla e óculos interno.",
    description:
      "O Norisk Force é o queridinho de quem busca segurança sem gastar muito. Viseira cristal anti-risco, óculos solar interno, forração removível e travas de segurança. Visual fechado e moderno.",
    specs: [
      { label: "Casco", value: "ABS de alta resistência" },
      { label: "Óculos interno", value: "Sim" },
      { label: "Certificação", value: "Inmetro" },
    ],
    imageSeed: "norisk-force", axes: [
      { axis: "color", values: ["preto", "preto-fosco", "vermelho", "azul"] },
      { axis: "size", values: SIZE_NUM },
    ],
    tags: ["mais-vendido", "oferta-do-dia"], offerInDays: 1, reviewCount: 5, soldCount: 980, createdDaysAgo: 300,
  }),
  makeProduct({
    name: "Capacete X11 Trust Pro SV",
    slug: "capacete-x11-trust-pro-sv",
    brandId: "b-x11", categorySlug: "capacetes", subcategorySlug: "capacetes-fechados",
    listPrice: 899, price: 719, ref: "X11-TRUST",
    shortDescription: "Aerodinâmico, leve e com sistema antiembaçante de série.",
    description:
      "O X11 Trust Pro SV foi desenhado em túnel de vento para reduzir ruído e turbulência. Acompanha viseira com pino antiembaçante e óculos solar interno. Conforto premium por um preço justo.",
    specs: [
      { label: "Casco", value: "Policarbonato" },
      { label: "Antiembaçante", value: "Pino interno incluso" },
      { label: "Certificação", value: "ECE 22.06 / Inmetro" },
    ],
    imageSeed: "x11-trust", axes: [
      { axis: "color", values: ["preto", "branco", "cinza"] },
      { axis: "size", values: SIZE_NUM },
    ],
    tags: ["novidade"], reviewCount: 3, soldCount: 142, createdDaysAgo: 12,
  }),
  makeProduct({
    name: "Capacete Airoh Commander 2 Adventure",
    slug: "capacete-airoh-commander-2-adventure",
    brandId: "b-airoh", categorySlug: "capacetes", subcategorySlug: "capacetes-fechados",
    listPrice: 2799, price: 2519, ref: "AIR-CMD2",
    shortDescription: "Big trail: pala, viseira e preparação para óculos cross.",
    description:
      "Para quem encara estrada e terra, o Airoh Commander 2 é modular para adventure: use com pala+viseira, só viseira, ou pala+óculos cross. Casco em fibra, ampla ventilação e ótimo isolamento acústico.",
    specs: [
      { label: "Tipo", value: "Adventure / Big Trail" },
      { label: "Casco", value: "Fibra composta" },
      { label: "Configurações", value: "4 modos de uso" },
      { label: "Certificação", value: "ECE 22.06" },
    ],
    imageSeed: "airoh-cmd2", axes: [
      { axis: "color", values: ["preto-fosco", "verde", "cinza"] },
      { axis: "size", values: SIZE_NUM },
    ],
    tags: ["novidade", "destaque"], reviewCount: 4, soldCount: 76, createdDaysAgo: 8,
  }),

  // --------------------------- ESCAPAMENTOS --------------------------------
  makeProduct({
    name: "Escapamento Pro Tork PowerCore Biz 125",
    slug: "escapamento-pro-tork-powercore-biz-125",
    brandId: "b-protork", categorySlug: "escapamentos",
    listPrice: 389.9, price: 289.9, ref: "PT-PWC-BIZ",
    shortDescription: "Ronco esportivo, aço carbono com pintura eletrostática preta.",
    description:
      "O escapamento Pro Tork PowerCore para Biz 125 (2006–2010) entrega ronco esportivo e ganho de resposta sem comprometer a durabilidade. Corpo em aço carbono com pintura eletrostática e protetor térmico. Acompanha kit de fixação.",
    specs: [
      { label: "Modelo", value: "Biz 125 (2006–2010)" },
      { label: "Material", value: "Aço carbono" },
      { label: "Acabamento", value: "Pintura eletrostática" },
      { label: "Homologação", value: "Contran/Inmetro" },
    ],
    imageSeed: "protork-biz", axes: [{ axis: "color", values: ["preto", "cromado"] }],
    tags: ["mais-vendido", "oferta-do-dia"], offerInDays: 3, reviewCount: 5, soldCount: 640, createdDaysAgo: 90,
  }),
  makeProduct({
    name: "Ponteira Esportiva Pro Tork PowerCore CB 300",
    slug: "ponteira-pro-tork-powercore-cb-300",
    brandId: "b-protork", categorySlug: "escapamentos",
    listPrice: 459.9, price: 367.9, ref: "PT-PWC-CB300",
    shortDescription: "Ponteira slip-on em alumínio escovado com ponteira de inox.",
    description:
      "Ponteira slip-on PowerCore para CB 300. Corpo em alumínio escovado, costura de solda TIG e ponteira em inox polido. Reduz peso e libera o ronco característico do motor monocilíndrico.",
    specs: [
      { label: "Modelo", value: "Honda CB 300R" },
      { label: "Tipo", value: "Slip-on" },
      { label: "Material", value: "Alumínio + inox" },
    ],
    imageSeed: "protork-cb300", axes: [{ axis: "color", values: ["prata", "preto"] }],
    tags: ["novidade"], reviewCount: 4, soldCount: 121, createdDaysAgo: 15,
  }),
  makeProduct({
    name: "Escapamento Pro Tork Full Fazer 250",
    slug: "escapamento-pro-tork-full-fazer-250",
    brandId: "b-protork", categorySlug: "escapamentos",
    listPrice: 899, price: 719, ref: "PT-FULL-FZ250",
    shortDescription: "Sistema completo (full) com coletor inox e curva otimizada.",
    description:
      "Sistema full para Fazer 250: coletor em inox 304, curva com geometria otimizada e abafador esportivo. Ganho real de torque em baixa e médias rotações com sonoridade encorpada.",
    specs: [
      { label: "Modelo", value: "Yamaha Fazer 250" },
      { label: "Tipo", value: "Sistema completo (full)" },
      { label: "Coletor", value: "Inox 304" },
    ],
    imageSeed: "protork-fz250", tags: ["destaque"], reviewCount: 3, soldCount: 88, createdDaysAgo: 40,
  }),

  // ----------------------------- VESTUÁRIO ---------------------------------
  makeProduct({
    name: "Jaqueta Alpinestars T-Faster Air",
    slug: "jaqueta-alpinestars-t-faster-air",
    brandId: "b-alpinestars", categorySlug: "vestuario", subcategorySlug: "jaquetas",
    listPrice: 1499, price: 1199, ref: "ALP-TFASTER",
    shortDescription: "Tecido perfurado para o calor, com proteções CE nos ombros e cotovelos.",
    description:
      "A Alpinestars T-Faster Air foi feita para pilotar no calor: construção em poliéster perfurado de alta resistência, proteções CE removíveis em ombros e cotovelos e bolso preparado para protetor de costas. Ajustes nos braços e cintura.",
    specs: [
      { label: "Material", value: "Poliéster perfurado" },
      { label: "Proteções", value: "CE ombros e cotovelos" },
      { label: "Ventilação", value: "Alta (mesh)" },
    ],
    imageSeed: "alp-tfaster", axes: [
      { axis: "color", values: ["preto", "vermelho", "cinza"] },
      { axis: "size", values: SIZE_LETTER },
    ],
    tags: ["mais-vendido"], reviewCount: 4, soldCount: 230, createdDaysAgo: 70,
  }),
  makeProduct({
    name: "Jaqueta Texx Armor Impermeável",
    slug: "jaqueta-texx-armor-impermeavel",
    brandId: "b-texx", categorySlug: "vestuario", subcategorySlug: "jaquetas",
    listPrice: 699, price: 489, ref: "TXX-ARMOR",
    shortDescription: "Forro térmico removível + membrana impermeável para todo clima.",
    description:
      "A Texx Armor é a jaqueta 3 em 1: capa externa resistente, forro térmico removível e membrana impermeável. Proteções nos ombros, cotovelos e costas. Faixas refletivas para visibilidade noturna.",
    specs: [
      { label: "Camadas", value: "3 em 1 (térmica + impermeável)" },
      { label: "Proteções", value: "Ombros, cotovelos e costas" },
      { label: "Refletivos", value: "Sim" },
    ],
    imageSeed: "txx-armor", axes: [
      { axis: "color", values: ["preto", "cinza"] },
      { axis: "size", values: SIZE_LETTER },
    ],
    tags: ["oferta-do-dia"], offerInDays: 2, reviewCount: 5, soldCount: 311, createdDaysAgo: 50,
  }),
  makeProduct({
    name: "Luva Alpinestars SP-8 V3",
    slug: "luva-alpinestars-sp-8-v3",
    brandId: "b-alpinestars", categorySlug: "vestuario", subcategorySlug: "luvas",
    listPrice: 549, price: 439, ref: "ALP-SP8",
    shortDescription: "Couro e tecido com proteção nos nós dos dedos e dedo touch.",
    description:
      "A luva SP-8 V3 mistura couro e tecido técnico com proteção rígida nos nós dos dedos, reforço na palma e compatibilidade touchscreen. Punho duplo com fechamento em velcro.",
    specs: [
      { label: "Material", value: "Couro + tecido técnico" },
      { label: "Proteção", value: "Nós dos dedos (rígida)" },
      { label: "Touchscreen", value: "Sim" },
    ],
    imageSeed: "alp-sp8", axes: [
      { axis: "color", values: ["preto", "branco", "vermelho"] },
      { axis: "size", values: SIZE_LETTER },
    ],
    reviewCount: 3, soldCount: 198, createdDaysAgo: 25,
  }),
  makeProduct({
    name: "Luva Texx Raptor Verão",
    slug: "luva-texx-raptor-verao",
    brandId: "b-texx", categorySlug: "vestuario", subcategorySlug: "luvas",
    listPrice: 179, price: 129, ref: "TXX-RAPTOR",
    shortDescription: "Leve e ventilada, ideal para uso urbano no calor.",
    description:
      "A Texx Raptor é leve, flexível e bem ventilada — perfeita para o dia a dia na cidade. Proteção nos nós dos dedos, reforço na palma e dedos touchscreen.",
    specs: [
      { label: "Uso", value: "Urbano / verão" },
      { label: "Touchscreen", value: "Sim" },
    ],
    imageSeed: "txx-raptor", axes: [
      { axis: "color", values: ["preto", "cinza"] },
      { axis: "size", values: SIZE_LETTER },
    ],
    tags: ["mais-vendido"], reviewCount: 4, soldCount: 540, createdDaysAgo: 130,
  }),

  // ------------------------------- PNEUS -----------------------------------
  makeProduct({
    name: "Pneu Michelin Pilot Street 2 (Traseiro)",
    slug: "pneu-michelin-pilot-street-2-traseiro",
    brandId: "b-michelin", categorySlug: "pneus",
    listPrice: 389, price: 329, ref: "MCH-PS2-T",
    shortDescription: "Composto com sílica: aderência no seco e no molhado.",
    description:
      "O Michelin Pilot Street 2 usa composto com sílica que melhora a aderência em piso molhado sem perder durabilidade. Desenho de banda com canais largos para escoamento de água. Indicado para motos de média cilindrada.",
    specs: [
      { label: "Medida", value: "Selecione abaixo" },
      { label: "Construção", value: "Diagonal reforçada" },
      { label: "Uso", value: "Street / urbano" },
    ],
    imageSeed: "mch-ps2", axes: [{ axis: "size", values: ["90/90-18", "100/90-18", "130/70-17"] }],
    tags: ["mais-vendido"], reviewCount: 5, soldCount: 720, createdDaysAgo: 110,
  }),
  makeProduct({
    name: "Pneu Pirelli Diablo Rosso III (Dianteiro)",
    slug: "pneu-pirelli-diablo-rosso-iii-dianteiro",
    brandId: "b-pirelli", categorySlug: "pneus",
    listPrice: 899, price: 764, ref: "PIR-ROSSO3-D",
    shortDescription: "DNA superbike: aquecimento rápido e estabilidade em curva.",
    description:
      "Derivado da competição, o Diablo Rosso III oferece aquecimento rápido, perfil esportivo e excelente estabilidade nas curvas. Composto bicamada para durabilidade no centro e aderência nos ombros.",
    specs: [
      { label: "Medida", value: "Selecione abaixo" },
      { label: "Construção", value: "Radial" },
      { label: "Uso", value: "Sport / esportivo" },
    ],
    imageSeed: "pir-rosso3", axes: [{ axis: "size", values: ["110/70-17", "120/70-17"] }],
    tags: ["destaque", "novidade"], reviewCount: 4, soldCount: 154, createdDaysAgo: 10,
  }),
  makeProduct({
    name: "Pneu Pirelli MT60 RS Trail",
    slug: "pneu-pirelli-mt60-rs-trail",
    brandId: "b-pirelli", categorySlug: "pneus",
    listPrice: 749, price: 599, ref: "PIR-MT60",
    shortDescription: "On/off road com visual cravado e ótimo no asfalto.",
    description:
      "O MT60 RS une o visual off-road com performance de rua. Desenho derivado do enduro, perfeito para big trails que rodam mais no asfalto mas encaram terra eventualmente.",
    specs: [
      { label: "Medida", value: "Selecione abaixo" },
      { label: "Uso", value: "On/Off (80/20)" },
    ],
    imageSeed: "pir-mt60", axes: [{ axis: "size", values: ["120/70-17", "180/55-17"] }],
    reviewCount: 3, soldCount: 96, createdDaysAgo: 35,
  }),

  // ---------------------------- BAÚS E MALAS -------------------------------
  makeProduct({
    name: "Baú Givi V47 Monokey 47 Litros",
    slug: "bau-givi-v47-monokey-47-litros",
    brandId: "b-givi", categorySlug: "baus-e-malas",
    listPrice: 1299, price: 1039, ref: "GVI-V47",
    shortDescription: "Cabe dois capacetes integrais. Abre e fecha com uma mão.",
    description:
      "O baú Givi V47 com sistema Monokey comporta dois capacetes integrais. Tampa com abertura facilitada, fechadura com chave e refletores integrados. Acompanha base de fixação universal Monokey.",
    specs: [
      { label: "Capacidade", value: "47 litros" },
      { label: "Sistema", value: "Monokey (engate rápido)" },
      { label: "Comporta", value: "2 capacetes integrais" },
    ],
    imageSeed: "givi-v47", axes: [{ axis: "color", values: ["preto", "prata"] }],
    tags: ["mais-vendido"], reviewCount: 4, soldCount: 175, createdDaysAgo: 80,
  }),
  makeProduct({
    name: "Bolsa Lateral Givi EA101B Alforge 15L",
    slug: "bolsa-lateral-givi-ea101b-alforge-15l",
    brandId: "b-givi", categorySlug: "baus-e-malas",
    listPrice: 549, price: 439, ref: "GVI-EA101",
    shortDescription: "Par de alforges flexíveis e expansíveis, capa de chuva inclusa.",
    description:
      "Par de bolsas laterais (alforges) Givi EA101B, expansíveis de 15 a 20 litros cada. Material resistente à água, capa de chuva inclusa e sistema de fixação universal por correias.",
    specs: [
      { label: "Capacidade", value: "15–20 L (cada)" },
      { label: "Conteúdo", value: "Par + capa de chuva" },
      { label: "Fixação", value: "Universal (correias)" },
    ],
    imageSeed: "givi-ea101", tags: ["novidade"], reviewCount: 3, soldCount: 64, createdDaysAgo: 9,
  }),

  // ----------------------- ÓLEOS E LUBRIFICANTES ---------------------------
  makeProduct({
    name: "Óleo Motul 7100 4T 10W40 Sintético 1L",
    slug: "oleo-motul-7100-4t-10w40-sintetico-1l",
    brandId: "b-motul", categorySlug: "oleos-e-lubrificantes",
    listPrice: 89.9, price: 74.9, ref: "MTL-7100-1L",
    shortDescription: "100% sintético Ester, tecnologia Technosynthese para 4 tempos.",
    description:
      "O Motul 7100 10W40 é 100% sintético com tecnologia Ester, garantindo proteção máxima em altas rotações e temperaturas. Indicado para motores 4 tempos com embreagem banhada a óleo.",
    specs: [
      { label: "Viscosidade", value: "10W40" },
      { label: "Base", value: "100% sintético (Ester)" },
      { label: "Volume", value: "1 litro" },
      { label: "Norma", value: "JASO MA2 / API SN" },
    ],
    imageSeed: "motul-7100", tags: ["mais-vendido"], freeShipping: false, reviewCount: 5, soldCount: 1320, createdDaysAgo: 150,
  }),
  makeProduct({
    name: "Óleo Motul 5100 4T 10W30 Semissintético 1L",
    slug: "oleo-motul-5100-4t-10w30-semissintetico-1l",
    brandId: "b-motul", categorySlug: "oleos-e-lubrificantes",
    listPrice: 64.9, price: 52.9, ref: "MTL-5100-1L",
    shortDescription: "Tecnologia Technosynthese com fibras Ester para uso diário.",
    description:
      "O Motul 5100 é semissintético com tecnologia Technosynthese, oferecendo ótima proteção para o uso diário com excelente custo-benefício. Reduz ruídos da transmissão e protege a embreagem.",
    specs: [
      { label: "Viscosidade", value: "10W30" },
      { label: "Base", value: "Semissintético" },
      { label: "Volume", value: "1 litro" },
    ],
    imageSeed: "motul-5100", freeShipping: false, tags: ["oferta-do-dia"], offerInDays: 1, reviewCount: 4, soldCount: 870, createdDaysAgo: 100,
  }),

  // ----------------------------- ACESSÓRIOS --------------------------------
  makeProduct({
    name: "Manopla Pro Tork Race Slim (Par)",
    slug: "manopla-pro-tork-race-slim-par",
    brandId: "b-protork", categorySlug: "acessorios",
    listPrice: 59.9, price: 39.9, ref: "PT-MANO-RACE",
    shortDescription: "Borracha macia antiderrapante com bom grip mesmo com chuva.",
    description:
      "Par de manoplas Pro Tork Race Slim em borracha macia com desenho antiderrapante. Diâmetro universal de 22 mm, ótimo grip mesmo em condições de chuva.",
    specs: [
      { label: "Conteúdo", value: "Par (esquerda + direita)" },
      { label: "Diâmetro", value: "22 mm (universal)" },
    ],
    imageSeed: "pt-manopla", axes: [{ axis: "color", values: ["preto", "vermelho", "azul"] }],
    freeShipping: false, tags: ["mais-vendido"], reviewCount: 3, soldCount: 1540, createdDaysAgo: 220,
  }),
  makeProduct({
    name: "Alarme Pro Tork Moto com Controle",
    slug: "alarme-pro-tork-moto-com-controle",
    brandId: "b-protork", categorySlug: "acessorios",
    listPrice: 199, price: 149, ref: "PT-ALARME",
    shortDescription: "Sensor de presença, sirene potente e bloqueio anti-furto.",
    description:
      "Alarme Pro Tork para motos com sensor de presença, sirene de alta potência, função pânico e bloqueio do sistema elétrico. Acompanha 2 controles e chicote para instalação.",
    specs: [
      { label: "Controles", value: "2 inclusos" },
      { label: "Funções", value: "Presença, pânico, bloqueio" },
      { label: "Instalação", value: "Chicote incluso" },
    ],
    imageSeed: "pt-alarme", tags: ["novidade"], reviewCount: 4, soldCount: 210, createdDaysAgo: 6,
  }),
  makeProduct({
    name: "Capa de Chuva Texx Motoqueiro 2 Peças",
    slug: "capa-de-chuva-texx-motoqueiro-2-pecas",
    brandId: "b-texx", categorySlug: "acessorios",
    listPrice: 159, price: 119, ref: "TXX-CHUVA",
    shortDescription: "Conjunto jaqueta + calça impermeável com solado emborrachado.",
    description:
      "Conjunto de capa de chuva Texx em 2 peças (jaqueta + calça) com material impermeável, costuras seladas, faixas refletivas e ajustes nos punhos e tornozelos. Acompanha bolsa para transporte.",
    specs: [
      { label: "Peças", value: "Jaqueta + calça" },
      { label: "Refletivos", value: "Sim" },
    ],
    imageSeed: "txx-chuva", axes: [
      { axis: "color", values: ["preto", "azul"] },
      { axis: "size", values: SIZE_LETTER },
    ],
    freeShipping: false, tags: ["mais-vendido"], reviewCount: 5, soldCount: 430, createdDaysAgo: 95,
  }),
  makeProduct({
    name: "Suporte de Celular X11 Guidão à Prova d'água",
    slug: "suporte-celular-x11-guidao-prova-dagua",
    brandId: "b-x11", categorySlug: "acessorios",
    listPrice: 129, price: 89, ref: "X11-SUP-CEL",
    shortDescription: "Case selado com trava de segurança e amortecimento anti-vibração.",
    description:
      "Suporte de celular X11 para guidão com case selado à prova d'água, trava de segurança dupla e sistema anti-vibração que protege a câmera do smartphone. Compatível com aparelhos de até 6,7\".",
    specs: [
      { label: "Compatibilidade", value: "Até 6,7 polegadas" },
      { label: "Proteção", value: "À prova d'água + anti-vibração" },
    ],
    imageSeed: "x11-suporte", freeShipping: false, tags: ["novidade", "oferta-do-dia"], offerInDays: 2,
    seller: PARTNER, reviewCount: 3, soldCount: 305, createdDaysAgo: 4,
  }),
  makeProduct({
    name: "Cadeado Corrente Pro Tork 1,2m Antifurto",
    slug: "cadeado-corrente-pro-tork-12m-antifurto",
    brandId: "b-protork", categorySlug: "acessorios",
    listPrice: 149, price: 109, ref: "PT-CORRENTE",
    shortDescription: "Elos de aço temperado revestidos, resistente a alicate.",
    description:
      "Corrente antifurto Pro Tork de 1,2 m com elos em aço temperado revestidos em capa de nylon (não risca a moto). Cadeado com cilindro de segurança e 3 chaves.",
    specs: [
      { label: "Comprimento", value: "1,2 metro" },
      { label: "Material", value: "Aço temperado" },
      { label: "Chaves", value: "3 inclusas" },
    ],
    imageSeed: "pt-corrente", seller: PARTNER, freeShipping: false, reviewCount: 4, soldCount: 260, createdDaysAgo: 45,
  }),
  makeProduct({
    name: "Capacete LS2 Rapid II Solid",
    slug: "capacete-ls2-rapid-ii-solid",
    brandId: "b-ls2", categorySlug: "capacetes", subcategorySlug: "capacetes-fechados",
    listPrice: 629, price: 503, ref: "LS2-RAPID2",
    shortDescription: "Entrada da LS2 com casco aerodinâmico e ótimo encaixe.",
    description:
      "O LS2 Rapid II é o fechado de entrada da marca: casco KPA aerodinâmico, viseira com sistema de troca rápida e forração hipoalergênica removível. Leve e confortável para o dia a dia.",
    specs: [
      { label: "Casco", value: "KPA termoplástico" },
      { label: "Viseira", value: "Troca rápida" },
      { label: "Certificação", value: "ECE 22.06 / Inmetro" },
    ],
    imageSeed: "ls2-rapid2", axes: [
      { axis: "color", values: ["preto", "branco", "vermelho", "azul"] },
      { axis: "size", values: SIZE_NUM },
    ],
    tags: ["mais-vendido"], reviewCount: 4, soldCount: 615, createdDaysAgo: 160,
  }),
  makeProduct({
    name: "Capacete Norisk FF391 Stunt Matte",
    slug: "capacete-norisk-ff391-stunt-matte",
    brandId: "b-norisk", categorySlug: "capacetes", subcategorySlug: "capacetes-fechados",
    listPrice: 549, price: 384, ref: "NOR-FF391",
    shortDescription: "Visual fechado agressivo com dupla viseira por um preço de entrada.",
    description:
      "O Norisk FF391 Stunt traz visual fechado e agressivo, dupla viseira (cristal + solar interno) e forração removível. Excelente porta de entrada para quem quer segurança e estilo gastando pouco.",
    specs: [
      { label: "Casco", value: "ABS" },
      { label: "Óculos interno", value: "Sim" },
      { label: "Certificação", value: "Inmetro" },
    ],
    imageSeed: "nor-ff391", axes: [
      { axis: "color", values: ["preto-fosco", "cinza", "vermelho"] },
      { axis: "size", values: SIZE_NUM },
    ],
    tags: ["oferta-do-dia"], offerInDays: 3, reviewCount: 5, soldCount: 488, createdDaysAgo: 75,
  }),
  makeProduct({
    name: "Jaqueta X11 Evo 3 Masculina",
    slug: "jaqueta-x11-evo-3-masculina",
    brandId: "b-x11", categorySlug: "vestuario", subcategorySlug: "jaquetas",
    listPrice: 399, price: 299, ref: "X11-EVO3",
    shortDescription: "Tecido resistente com proteções e forro removível para meia estação.",
    description:
      "A X11 Evo 3 é versátil para o ano todo: tecido resistente à abrasão, proteções nos ombros e cotovelos, forro térmico removível e diversas aberturas de ventilação. Ótimo custo-benefício.",
    specs: [
      { label: "Material", value: "Poliéster de alta tenacidade" },
      { label: "Proteções", value: "Ombros e cotovelos" },
      { label: "Forro", value: "Térmico removível" },
    ],
    imageSeed: "x11-evo3", axes: [
      { axis: "color", values: ["preto", "cinza"] },
      { axis: "size", values: SIZE_LETTER },
    ],
    tags: ["mais-vendido", "oferta-do-dia"], offerInDays: 1, reviewCount: 4, soldCount: 705, createdDaysAgo: 140,
  }),
  makeProduct({
    name: "Pneu Michelin City Grip 2 (Dianteiro)",
    slug: "pneu-michelin-city-grip-2-dianteiro",
    brandId: "b-michelin", categorySlug: "pneus",
    listPrice: 459, price: 389, ref: "MCH-CG2-D",
    shortDescription: "Para scooters: aderência no molhado e quilometragem alta.",
    description:
      "O Michelin City Grip 2 é desenvolvido para scooters e maxi-scooters, com composto que prioriza a aderência no molhado e desenho que aumenta a vida útil. Rodar na cidade com segurança.",
    specs: [
      { label: "Medida", value: "Selecione abaixo" },
      { label: "Uso", value: "Scooter / urbano" },
    ],
    imageSeed: "mch-cg2", axes: [{ axis: "size", values: ["110/70-13", "120/70-15"] }],
    reviewCount: 3, soldCount: 132, createdDaysAgo: 30,
  }),
  makeProduct({
    name: "Óleo Motul 300V 4T Factory Line 10W40",
    slug: "oleo-motul-300v-4t-factory-line-10w40",
    brandId: "b-motul", categorySlug: "oleos-e-lubrificantes",
    listPrice: 159, price: 134.9, ref: "MTL-300V",
    shortDescription: "Óleo de competição com tecnologia Ester Core para máxima potência.",
    description:
      "O Motul 300V Factory Line é o óleo de competição da Motul, com tecnologia Ester Core que reduz o atrito e maximiza a potência. Para quem leva a performance a sério.",
    specs: [
      { label: "Viscosidade", value: "10W40" },
      { label: "Linha", value: "Competição (Factory Line)" },
      { label: "Volume", value: "1 litro" },
    ],
    imageSeed: "motul-300v", freeShipping: false, tags: ["destaque", "novidade"], reviewCount: 4, soldCount: 95, createdDaysAgo: 7,
  }),
  makeProduct({
    name: "Baú Givi B27N Monolock 27 Litros",
    slug: "bau-givi-b27n-monolock-27-litros",
    brandId: "b-givi", categorySlug: "baus-e-malas",
    listPrice: 699, price: 559, ref: "GVI-B27",
    shortDescription: "Compacto para o dia a dia, comporta um capacete integral.",
    description:
      "O Givi B27N com sistema Monolock é compacto e prático para o uso urbano, comportando um capacete integral. Lente refletora homologada e fechadura com chave. Base de fixação inclusa.",
    specs: [
      { label: "Capacidade", value: "27 litros" },
      { label: "Sistema", value: "Monolock" },
      { label: "Comporta", value: "1 capacete integral" },
    ],
    imageSeed: "givi-b27", tags: ["mais-vendido"], reviewCount: 5, soldCount: 380, createdDaysAgo: 115,
  }),
  makeProduct({
    name: "Capacete AGV Tourmodular Balance",
    slug: "capacete-agv-tourmodular-balance",
    brandId: "b-agv", categorySlug: "capacetes", subcategorySlug: "capacetes-articulados",
    listPrice: 4199, price: 3359, ref: "AGV-TOURMOD",
    shortDescription: "Articulado premium em carbono, P/J homologado e prep. para intercom.",
    description:
      "O AGV Tourmodular é o topo de linha articulado da AGV: casco em carbono, homologação P/J (pode rodar aberto ou fechado), óculos solar interno, preparação para sistema de comunicação e máximo isolamento acústico para viagens longas.",
    specs: [
      { label: "Casco", value: "100% Carbono" },
      { label: "Homologação", value: "P/J (ECE 22.06)" },
      { label: "Intercom", value: "Preparado" },
      { label: "Óculos interno", value: "Sim" },
    ],
    imageSeed: "agv-tourmod", axes: [
      { axis: "color", values: ["preto-fosco", "cinza", "branco"] },
      { axis: "size", values: SIZE_NUM },
    ],
    tags: ["destaque"], reviewCount: 4, soldCount: 58, createdDaysAgo: 22,
  }),
  makeProduct({
    name: "Luva Norisk Mtech Cano Longo",
    slug: "luva-norisk-mtech-cano-longo",
    brandId: "b-norisk", categorySlug: "vestuario", subcategorySlug: "luvas",
    listPrice: 219, price: 159, ref: "NOR-MTECH",
    shortDescription: "Cano longo com proteção rígida e couro sintético reforçado.",
    description:
      "A luva Norisk Mtech tem cano longo para proteção do punho, casco rígido nos nós dos dedos, reforço em couro sintético na palma e fechamento duplo. Boa para uso esportivo e viagens.",
    specs: [
      { label: "Cano", value: "Longo" },
      { label: "Proteção", value: "Rígida (nós dos dedos)" },
      { label: "Touchscreen", value: "Sim" },
    ],
    imageSeed: "nor-mtech", axes: [
      { axis: "color", values: ["preto", "vermelho"] },
      { axis: "size", values: SIZE_LETTER },
    ],
    reviewCount: 3, soldCount: 240, createdDaysAgo: 33,
  }),
  makeProduct({
    name: "Escapamento Pro Tork PowerCore CG 160",
    slug: "escapamento-pro-tork-powercore-cg-160",
    brandId: "b-protork", categorySlug: "escapamentos",
    listPrice: 349.9, price: 244.9, ref: "PT-PWC-CG160",
    shortDescription: "Modelo original esportivo para CG 160, ronco encorpado.",
    description:
      "Escapamento Pro Tork PowerCore para Honda CG 160. Mantém o desenho original com toque esportivo, corpo em aço carbono, pintura preta resistente ao calor e protetor térmico. Acompanha kit de instalação.",
    specs: [
      { label: "Modelo", value: "Honda CG 160" },
      { label: "Material", value: "Aço carbono" },
      { label: "Homologação", value: "Contran/Inmetro" },
    ],
    imageSeed: "pt-cg160", axes: [{ axis: "color", values: ["preto", "cromado"] }],
    tags: ["mais-vendido", "oferta-do-dia"], offerInDays: 2, reviewCount: 5, soldCount: 590, createdDaysAgo: 65,
  }),
  makeProduct({
    name: "Suporte de Baú Givi Universal Traseiro",
    slug: "suporte-de-bau-givi-universal-traseiro",
    brandId: "b-givi", categorySlug: "acessorios",
    listPrice: 249, price: 189, ref: "GVI-SUP-BAU",
    shortDescription: "Bagageiro em aço para fixar baú Monolock/Monokey na maioria das motos.",
    description:
      "Bagageiro/suporte traseiro Givi em aço com pintura preta, compatível com bases Monolock e Monokey. Kit universal com abraçadeiras e parafusos para a maioria das motos.",
    specs: [
      { label: "Material", value: "Aço com pintura epóxi" },
      { label: "Compatível", value: "Monolock / Monokey" },
    ],
    imageSeed: "givi-suporte", freeShipping: false, reviewCount: 3, soldCount: 150, createdDaysAgo: 55,
  }),
  makeProduct({
    name: "Capacete X11 Revo Pro Carbon",
    slug: "capacete-x11-revo-pro-carbon",
    brandId: "b-x11", categorySlug: "capacetes", subcategorySlug: "capacetes-fechados",
    listPrice: 1299, price: 974, ref: "X11-REVO",
    shortDescription: "Visual carbono, leve e com aerodinâmica refinada.",
    description:
      "O X11 Revo Pro traz acabamento estilo carbono, casco leve, dupla viseira e ventilação eficiente. Conjuga visual premium e preço acessível para quem quer destaque sem abrir mão do conforto.",
    specs: [
      { label: "Casco", value: "Policarbonato (visual carbono)" },
      { label: "Óculos interno", value: "Sim" },
      { label: "Certificação", value: "ECE 22.06 / Inmetro" },
    ],
    imageSeed: "x11-revo", axes: [
      { axis: "color", values: ["preto-fosco", "grafite"] },
      { axis: "size", values: SIZE_NUM },
    ],
    tags: ["novidade", "destaque"], reviewCount: 4, soldCount: 168, createdDaysAgo: 11,
  }),
  makeProduct({
    name: "Protetor de Motor Pro Tork Slider (Par)",
    slug: "protetor-de-motor-pro-tork-slider-par",
    brandId: "b-protork", categorySlug: "acessorios",
    listPrice: 189, price: 139, ref: "PT-SLIDER",
    shortDescription: "Absorve impacto em quedas e protege carenagem e motor.",
    description:
      "Par de sliders Pro Tork em nylon de alta resistência com base de alumínio. Absorvem o impacto em quedas, protegendo a carenagem, o motor e o piloto. Fixação direta no chassi.",
    specs: [
      { label: "Conteúdo", value: "Par" },
      { label: "Material", value: "Nylon + base de alumínio" },
    ],
    imageSeed: "pt-slider", freeShipping: false, seller: PARTNER, tags: ["mais-vendido"], reviewCount: 4, soldCount: 320, createdDaysAgo: 48,
  }),
  makeProduct({
    name: "Bota Alpinestars SMX-6 V2 Drystar",
    slug: "bota-alpinestars-smx-6-v2-drystar",
    brandId: "b-alpinestars", categorySlug: "vestuario", subcategorySlug: "jaquetas",
    listPrice: 1799, price: 1439, ref: "ALP-SMX6",
    shortDescription: "Cano alto impermeável (Drystar) com proteção do tornozelo.",
    description:
      "A bota SMX-6 V2 com membrana Drystar é impermeável e respirável, com proteção rígida no tornozelo e canela, sola esportiva e fechamento por velcro + fivela micrométrica. Conforto e segurança para sport e touring.",
    specs: [
      { label: "Tipo", value: "Cano alto esportiva" },
      { label: "Impermeável", value: "Sim (Drystar)" },
      { label: "Proteção", value: "Tornozelo e canela" },
    ],
    imageSeed: "alp-smx6", axes: [
      { axis: "color", values: ["preto", "branco"] },
      { axis: "size", values: ["39", "40", "41", "42", "43"] },
    ],
    tags: ["novidade"], reviewCount: 3, soldCount: 84, createdDaysAgo: 14,
  }),
  makeProduct({
    name: "Capa Protetora de Moto Texx Cobertura Total",
    slug: "capa-protetora-de-moto-texx-cobertura-total",
    brandId: "b-texx", categorySlug: "acessorios",
    listPrice: 139, price: 99, ref: "TXX-CAPA",
    shortDescription: "Forrada, impermeável e com proteção UV contra sol e chuva.",
    description:
      "Capa protetora Texx para cobertura total da moto, com forro interno que não risca a pintura, material impermeável, proteção UV e ilhós para cadeado. Disponível em tamanhos para diferentes portes de moto.",
    specs: [
      { label: "Proteção", value: "Sol, chuva e poeira" },
      { label: "Forro interno", value: "Sim (não risca)" },
    ],
    imageSeed: "txx-capa", axes: [{ axis: "size", values: ["m", "g", "gg"] }],
    freeShipping: false, tags: ["mais-vendido"], reviewCount: 4, soldCount: 510, createdDaysAgo: 85,
  }),
  makeProduct({
    name: "Intercomunicador X11 Bluetooth BT-30 (Par)",
    slug: "intercomunicador-x11-bluetooth-bt-30-par",
    brandId: "b-x11", categorySlug: "acessorios",
    listPrice: 899, price: 629, ref: "X11-BT30",
    shortDescription: "Comunicação piloto/garupa e moto a moto, com rádio FM.",
    description:
      "Par de intercomunicadores X11 BT-30 com Bluetooth: fale com o garupa, conecte moto a moto, atenda chamadas e ouça música ou rádio FM. À prova d'água, autonomia para um dia inteiro de viagem.",
    specs: [
      { label: "Conteúdo", value: "Par (2 unidades)" },
      { label: "Alcance", value: "Até 1.000 m (moto a moto)" },
      { label: "Recursos", value: "Bluetooth, FM, à prova d'água" },
    ],
    imageSeed: "x11-bt30", tags: ["novidade", "destaque", "oferta-do-dia"], offerInDays: 3,
    reviewCount: 4, soldCount: 140, createdDaysAgo: 5,
  }),
  makeProduct({
    name: "Pneu Michelin Pilot Street 2 (Dianteiro)",
    slug: "pneu-michelin-pilot-street-2-dianteiro",
    brandId: "b-michelin", categorySlug: "pneus",
    listPrice: 329, price: 279, ref: "MCH-PS2-D",
    shortDescription: "Par perfeito do traseiro: aderência e durabilidade na medida dianteira.",
    description:
      "Versão dianteira do consagrado Michelin Pilot Street 2. Composto com sílica para aderência em todas as condições e desenho que escoa água com eficiência. Combine com o traseiro para o conjunto completo.",
    specs: [
      { label: "Medida", value: "Selecione abaixo" },
      { label: "Uso", value: "Street / urbano" },
    ],
    imageSeed: "mch-ps2d", axes: [{ axis: "size", values: ["80/100-18", "90/90-19"] }],
    reviewCount: 3, soldCount: 410, createdDaysAgo: 105,
  }),
];

/* ----------------------------- Índices ------------------------------------ */
export const productsById = new Map(products.map((p) => [p.id, p]));
export const productsBySlug = new Map(products.map((p) => [p.slug, p]));

export function getProductById(id: string): Product | undefined {
  return productsById.get(id);
}
export function getProductBySlug(slug: string): Product | undefined {
  return productsBySlug.get(slug);
}
