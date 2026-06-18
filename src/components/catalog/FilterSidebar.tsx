"use client";

import type { ProductPage } from "@/services/catalog";
import { cn } from "@/lib/utils";
import { PriceRange } from "./PriceRange";

export interface CatalogFilters {
  subcategories: string[];
  brandSlugs: string[];
  colors: string[];
  sizes: string[];
  inStock: boolean;
  freeShipping: boolean;
  minDiscount?: number;
  price: { min: number; max: number };
}

const DISCOUNT_OPTIONS = [10, 20, 30, 40];

export function FilterSidebar({
  facets,
  bounds,
  filters,
  onChange,
  onClear,
}: {
  facets: ProductPage["facets"];
  bounds: { min: number; max: number };
  filters: CatalogFilters;
  onChange: (next: CatalogFilters) => void;
  onClear: () => void;
}) {
  const toggle = <K extends "subcategories" | "brandSlugs" | "colors" | "sizes">(
    key: K,
    value: string,
  ) => {
    const set = new Set(filters[key]);
    set.has(value) ? set.delete(value) : set.add(value);
    onChange({ ...filters, [key]: [...set] });
  };

  const activeCount =
    filters.subcategories.length +
    filters.brandSlugs.length +
    filters.colors.length +
    filters.sizes.length +
    (filters.inStock ? 1 : 0) +
    (filters.freeShipping ? 1 : 0) +
    (filters.minDiscount ? 1 : 0) +
    (filters.price.min > bounds.min || filters.price.max < bounds.max ? 1 : 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wide text-ink">Filtros</h2>
        {activeCount > 0 && (
          <button onClick={onClear} className="text-xs font-semibold text-flame hover:underline">
            Limpar ({activeCount})
          </button>
        )}
      </div>

      {facets.subcategories.length > 0 && (
        <Section title="Subcategoria">
          <div className="max-h-56 space-y-1 overflow-y-auto pr-1">
            {facets.subcategories.map((s) => (
              <Check
                key={s.slug}
                label={s.name}
                count={s.count}
                checked={filters.subcategories.includes(s.slug)}
                onChange={() => toggle("subcategories", s.slug)}
              />
            ))}
          </div>
        </Section>
      )}

      <Section title="Disponibilidade">
        <Check
          label="Somente em estoque"
          checked={filters.inStock}
          onChange={(v) => onChange({ ...filters, inStock: v })}
        />
        <Check
          label="Frete grátis"
          checked={filters.freeShipping}
          onChange={(v) => onChange({ ...filters, freeShipping: v })}
        />
      </Section>

      <Section title="Preço">
        <PriceRange
          bounds={bounds}
          value={filters.price}
          onChange={(price) => onChange({ ...filters, price })}
        />
      </Section>

      {facets.brands.length > 0 && (
        <Section title="Marca">
          <div className="max-h-56 space-y-1 overflow-y-auto pr-1">
            {facets.brands.map((b) => (
              <Check
                key={b.slug}
                label={b.name}
                count={b.count}
                checked={filters.brandSlugs.includes(b.slug)}
                onChange={() => toggle("brandSlugs", b.slug)}
              />
            ))}
          </div>
        </Section>
      )}

      {facets.colors.length > 0 && (
        <Section title="Cor">
          <div className="flex flex-wrap gap-2">
            {facets.colors.map((c) => {
              const active = filters.colors.includes(c.value);
              return (
                <button
                  key={c.value}
                  onClick={() => toggle("colors", c.value)}
                  title={c.label}
                  aria-pressed={active}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs transition-colors",
                    active ? "border-flame bg-flame-50 text-flame-700" : "border-neutral-200 text-neutral-600 hover:border-neutral-400",
                  )}
                >
                  <span
                    className="size-3.5 rounded-full border border-black/10"
                    style={{ backgroundColor: c.hex }}
                  />
                  {c.label}
                </button>
              );
            })}
          </div>
        </Section>
      )}

      {facets.sizes.length > 0 && (
        <Section title="Tamanho">
          <div className="flex flex-wrap gap-2">
            {facets.sizes.map((s) => {
              const active = filters.sizes.includes(s.value);
              return (
                <button
                  key={s.value}
                  onClick={() => toggle("sizes", s.value)}
                  aria-pressed={active}
                  className={cn(
                    "min-w-10 rounded-md border px-2 py-1.5 text-xs font-semibold uppercase transition-colors",
                    active ? "border-flame bg-flame text-white" : "border-neutral-200 text-neutral-700 hover:border-neutral-400",
                  )}
                >
                  {s.value}
                </button>
              );
            })}
          </div>
        </Section>
      )}

      <Section title="Desconto">
        <div className="space-y-1">
          {DISCOUNT_OPTIONS.map((d) => (
            <Check
              key={d}
              label={`${d}% ou mais`}
              type="radio"
              checked={filters.minDiscount === d}
              onChange={() =>
                onChange({ ...filters, minDiscount: filters.minDiscount === d ? undefined : d })
              }
            />
          ))}
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-neutral-200 pt-5 first:border-0 first:pt-0">
      <h3 className="mb-3 text-sm font-semibold text-ink">{title}</h3>
      {children}
    </div>
  );
}

function Check({
  label,
  checked,
  onChange,
  count,
  type = "checkbox",
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  count?: number;
  type?: "checkbox" | "radio";
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 py-1 text-sm text-neutral-700">
      <input
        type={type}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        // Radio não dispara onChange ao reclicar já marcado; o clique permite desmarcar.
        onClick={() => {
          if (type === "radio" && checked) onChange(false);
        }}
        className={cn(
          "size-4 shrink-0 border-neutral-300 text-flame focus:ring-flame/30",
          type === "radio" ? "rounded-full" : "rounded",
        )}
      />
      <span className="flex-1">{label}</span>
      {count !== undefined && <span className="text-xs text-neutral-400">{count}</span>}
    </label>
  );
}
