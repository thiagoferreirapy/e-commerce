import type { Brand } from "@/types";

/** Logo tipográfico (sem dependência de rede para falhar no build). */
function logo(name: string) {
  return `https://placehold.co/200x80/0E0F12/FFFFFF/png?text=${encodeURIComponent(
    name,
  )}&font=montserrat`;
}

export const brands: Brand[] = [
  { id: "b-agv", name: "AGV", slug: "agv", logoUrl: logo("AGV") },
  { id: "b-airoh", name: "Airoh", slug: "airoh", logoUrl: logo("Airoh") },
  { id: "b-ls2", name: "LS2", slug: "ls2", logoUrl: logo("LS2") },
  { id: "b-norisk", name: "Norisk", slug: "norisk", logoUrl: logo("Norisk") },
  { id: "b-protork", name: "Pro Tork", slug: "pro-tork", logoUrl: logo("Pro Tork") },
  { id: "b-alpinestars", name: "Alpinestars", slug: "alpinestars", logoUrl: logo("Alpinestars") },
  { id: "b-texx", name: "Texx", slug: "texx", logoUrl: logo("Texx") },
  { id: "b-x11", name: "X11", slug: "x11", logoUrl: logo("X11") },
  { id: "b-michelin", name: "Michelin", slug: "michelin", logoUrl: logo("Michelin") },
  { id: "b-pirelli", name: "Pirelli", slug: "pirelli", logoUrl: logo("Pirelli") },
  { id: "b-motul", name: "Motul", slug: "motul", logoUrl: logo("Motul") },
  { id: "b-givi", name: "Givi", slug: "givi", logoUrl: logo("Givi") },
];

export const brandsById = new Map(brands.map((b) => [b.id, b]));
export const brandsBySlug = new Map(brands.map((b) => [b.slug, b]));

export function getBrand(id: string): Brand | undefined {
  return brandsById.get(id);
}
