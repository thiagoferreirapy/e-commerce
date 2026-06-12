"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  listProducts,
  type ProductPage,
  type SortKey,
} from "@/services/catalog";
import type { ProductTag } from "@/types";
import { ProductGrid } from "@/components/product/ProductCarousel";
import { ProductGridSkeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { FilterIcon, SearchIcon } from "@/components/ui/icons";
import { FilterSidebar, type CatalogFilters } from "./FilterSidebar";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "relevancia", label: "Mais relevantes" },
  { value: "mais-vendidos", label: "Mais vendidos" },
  { value: "menor-preco", label: "Menor preço" },
  { value: "maior-preco", label: "Maior preço" },
  { value: "maior-desconto", label: "Maior desconto" },
  { value: "nome", label: "Nome (A-Z)" },
];

const PAGE_SIZE = 12;

function emptyFilters(): CatalogFilters {
  return {
    brandSlugs: [],
    colors: [],
    sizes: [],
    inStock: false,
    freeShipping: false,
    minDiscount: undefined,
    price: { min: 0, max: 0 },
  };
}

export function ProductListing({
  categorySlug,
  tag,
  query,
  initialBrandSlugs = [],
  emptyMessage,
}: {
  categorySlug?: string;
  tag?: ProductTag;
  query?: string;
  initialBrandSlugs?: string[];
  emptyMessage?: string;
}) {
  const [filters, setFilters] = useState<CatalogFilters>(() => ({
    ...emptyFilters(),
    brandSlugs: initialBrandSlugs,
  }));
  const [sort, setSort] = useState<SortKey>("relevancia");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ProductPage | null>(null);
  const [bounds, setBounds] = useState<{ min: number; max: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const priceTouched = useRef(false);

  // Reaplica filtros base quando a categoria/busca muda.
  useEffect(() => {
    priceTouched.current = false;
    setBounds(null);
    setFilters({ ...emptyFilters(), brandSlugs: initialBrandSlugs });
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categorySlug, query, tag]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const priceNarrowed =
        priceTouched.current &&
        bounds &&
        (filters.price.min > bounds.min || filters.price.max < bounds.max);

      const result = await listProducts({
        categorySlug,
        tag,
        query,
        brandSlugs: filters.brandSlugs.length ? filters.brandSlugs : undefined,
        colors: filters.colors.length ? filters.colors : undefined,
        sizes: filters.sizes.length ? filters.sizes : undefined,
        inStock: filters.inStock || undefined,
        freeShipping: filters.freeShipping || undefined,
        minDiscount: filters.minDiscount,
        minPrice: priceNarrowed ? filters.price.min : undefined,
        maxPrice: priceNarrowed ? filters.price.max : undefined,
        sort,
        page,
        pageSize: PAGE_SIZE,
      });
      setData(result);
      // Define bounds e preço inicial na primeira carga.
      if (!bounds) {
        setBounds(result.priceBounds);
        if (!priceTouched.current) {
          setFilters((f) => ({ ...f, price: result.priceBounds }));
        }
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [categorySlug, tag, query, filters, sort, page, bounds]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function updateFilters(next: CatalogFilters) {
    if (next.price.min !== filters.price.min || next.price.max !== filters.price.max) {
      priceTouched.current = true;
    }
    setFilters(next);
    setPage(1);
  }

  function clearFilters() {
    priceTouched.current = false;
    setFilters({ ...emptyFilters(), price: bounds ?? { min: 0, max: 0 } });
    setPage(1);
  }

  const sidebar =
    data && bounds ? (
      <FilterSidebar
        facets={data.facets}
        bounds={bounds}
        filters={filters}
        onChange={updateFilters}
        onClear={clearFilters}
      />
    ) : null;

  return (
    <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
      {/* Sidebar desktop */}
      <aside className="hidden lg:block">{sidebar}</aside>

      <div>
        {/* Toolbar */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-neutral-500" aria-live="polite">
            {data ? (
              <>
                Exibindo{" "}
                <strong className="text-ink">
                  {(data.page - 1) * data.pageSize + (data.items.length ? 1 : 0)}–
                  {(data.page - 1) * data.pageSize + data.items.length}
                </strong>{" "}
                de <strong className="text-ink">{data.total}</strong> produtos
              </>
            ) : (
              "Carregando produtos…"
            )}
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setDrawerOpen(true)}
              className="flex items-center gap-2 rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium text-ink lg:hidden"
            >
              <FilterIcon className="size-4" /> Filtros
            </button>
            <div className="flex-1 sm:w-48 sm:flex-none">
              <Select
                aria-label="Ordenar por"
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value as SortKey);
                  setPage(1);
                }}
                options={SORT_OPTIONS}
              />
            </div>
          </div>
        </div>

        {/* Conteúdo */}
        {error ? (
          <ErrorState onRetry={fetchData} />
        ) : loading ? (
          <ProductGridSkeleton count={PAGE_SIZE} />
        ) : data && data.items.length > 0 ? (
          <>
            <ProductGrid products={data.items} />
            <div className="mt-10">
              <Pagination page={data.page} pageCount={data.pageCount} onChange={setPage} />
            </div>
          </>
        ) : (
          <EmptyState
            icon={<SearchIcon className="size-12" />}
            title="Nenhum produto encontrado"
            description={
              emptyMessage ??
              "Tente remover alguns filtros ou buscar por outro termo. Temos muito mais no catálogo."
            }
            action={{ label: "Ver todo o catálogo", href: "/categoria/capacetes" }}
          />
        )}
      </div>

      {/* Drawer de filtros (mobile) */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Filtros"
        side="left"
        footer={
          <div className="flex gap-3">
            <Button variant="outline" fullWidth onClick={clearFilters}>
              Limpar
            </Button>
            <Button fullWidth onClick={() => setDrawerOpen(false)}>
              Ver {data?.total ?? 0} produtos
            </Button>
          </div>
        }
      >
        <div className="p-5">{sidebar}</div>
      </Drawer>
    </div>
  );
}
