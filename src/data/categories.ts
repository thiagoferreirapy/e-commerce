import type { Category } from "@/types";

/** Imagem temática de moto por categoria (palavra-chave inferida do seed). */
function img(seed: string) {
  const kw = seed.includes("cap")
    ? "motorcycle,helmet"
    : seed.includes("escap")
      ? "motorcycle,exhaust"
      : seed.includes("jaqueta") || seed.includes("vestuario")
        ? "motorcycle,jacket"
        : seed.includes("luva")
          ? "motorcycle,gloves"
          : seed.includes("pneu")
            ? "motorcycle,tire"
            : seed.includes("bau")
              ? "motorcycle,case"
              : seed.includes("oleo")
                ? "motor,oil"
                : "motorcycle,gear";
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return `https://loremflickr.com/600/600/${encodeURIComponent(kw)}?lock=${h % 100000}`;
}

/** Categorias raiz + subcategorias (parentSlug aponta para a raiz). */
export const categories: Category[] = [
  {
    id: "c-capacetes",
    name: "Capacetes",
    slug: "capacetes",
    imageUrl: img("torque-capacetes"),
    description: "Fechados, articulados e off-road com certificação.",
  },
  {
    id: "c-cap-fechado",
    name: "Fechados",
    slug: "capacetes-fechados",
    parentSlug: "capacetes",
    imageUrl: img("torque-cap-fechado"),
  },
  {
    id: "c-cap-articulado",
    name: "Articulados",
    slug: "capacetes-articulados",
    parentSlug: "capacetes",
    imageUrl: img("torque-cap-articulado"),
  },
  {
    id: "c-escapamentos",
    name: "Escapamentos",
    slug: "escapamentos",
    imageUrl: img("torque-escapamentos"),
    description: "Ponteiras e escapes esportivos homologados.",
  },
  {
    id: "c-vestuario",
    name: "Vestuário",
    slug: "vestuario",
    imageUrl: img("torque-vestuario"),
    description: "Jaquetas, luvas e proteção para pilotar.",
  },
  {
    id: "c-jaquetas",
    name: "Jaquetas",
    slug: "jaquetas",
    parentSlug: "vestuario",
    imageUrl: img("torque-jaquetas"),
  },
  {
    id: "c-luvas",
    name: "Luvas",
    slug: "luvas",
    parentSlug: "vestuario",
    imageUrl: img("torque-luvas"),
  },
  {
    id: "c-pneus",
    name: "Pneus",
    slug: "pneus",
    imageUrl: img("torque-pneus"),
    description: "Street, sport e trail das melhores marcas.",
  },
  {
    id: "c-baus",
    name: "Baús e Malas",
    slug: "baus-e-malas",
    imageUrl: img("torque-baus"),
    description: "Bagageiro com capacidade para o dia a dia e viagem.",
  },
  {
    id: "c-oleos",
    name: "Óleos e Lubrificantes",
    slug: "oleos-e-lubrificantes",
    imageUrl: img("torque-oleos"),
    description: "Linha sintética e semissintética para alta performance.",
  },
  {
    id: "c-acessorios",
    name: "Acessórios",
    slug: "acessorios",
    imageUrl: img("torque-acessorios"),
    description: "Manoplas, alarmes, suportes e mais.",
  },
];

/** Apenas categorias de topo (sem parentSlug). */
export const rootCategories = categories.filter((c) => !c.parentSlug);

export const categoriesBySlug = new Map(categories.map((c) => [c.slug, c]));

export function getCategory(slug: string): Category | undefined {
  return categoriesBySlug.get(slug);
}

export function getSubcategories(parentSlug: string): Category[] {
  return categories.filter((c) => c.parentSlug === parentSlug);
}

/** Trilha Home > Categoria > Subcategoria a partir de um slug. */
export function categoryTrail(slug: string): Category[] {
  const cat = getCategory(slug);
  if (!cat) return [];
  if (cat.parentSlug) {
    const parent = getCategory(cat.parentSlug);
    return parent ? [parent, cat] : [cat];
  }
  return [cat];
}
