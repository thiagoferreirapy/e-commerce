import type { VariantAxis, VariantOptionDTO } from "../types";

/** Mapa de cor → hex (espelha o seed do front). */
export const COLOR_HEX: Record<string, string> = {
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

export function labelize(value: string): string {
  return value.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

interface VariantRow {
  color: string | null;
  size: string | null;
}

/**
 * Reconstrói `variantAxes` (com label/hex) a partir das linhas de Variant,
 * preservando a ordem de primeira aparição.
 */
export function buildVariantAxes(
  variants: VariantRow[],
): { axis: VariantAxis; options: VariantOptionDTO[] }[] {
  const axes: { axis: VariantAxis; values: string[] }[] = [];
  const seen: Record<string, Set<string>> = { color: new Set(), size: new Set() };

  const push = (axis: VariantAxis, value: string | null) => {
    if (!value || seen[axis].has(value)) return;
    seen[axis].add(value);
    let entry = axes.find((a) => a.axis === axis);
    if (!entry) {
      entry = { axis, values: [] };
      axes.push(entry);
    }
    entry.values.push(value);
  };

  for (const v of variants) {
    push("color", v.color);
    push("size", v.size);
  }

  // color antes de size (ordem de exibição padrão)
  axes.sort((a, b) => (a.axis === "color" ? -1 : 1) - (b.axis === "color" ? -1 : 1));

  return axes.map((a) => ({
    axis: a.axis,
    options: a.values.map<VariantOptionDTO>((value) => ({
      axis: a.axis,
      value,
      label: a.axis === "color" ? labelize(value) : value.toUpperCase(),
      hex: a.axis === "color" ? COLOR_HEX[value] ?? "#7C746A" : undefined,
    })),
  }));
}

/** Monta o objeto `options` ({color,size}) de uma variante. */
export function variantOptions(v: VariantRow): Partial<Record<VariantAxis, string>> {
  const o: Partial<Record<VariantAxis, string>> = {};
  if (v.color) o.color = v.color;
  if (v.size) o.size = v.size;
  return o;
}
