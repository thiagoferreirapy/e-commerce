"use client";

import { useEffect, useState } from "react";
import type { Product } from "@/types";
import { getProductsByIds } from "@/services/catalog";
import { useWishlistStore } from "@/store/wishlist";
import { useMounted } from "@/lib/hooks";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { ProductGrid } from "@/components/product/ProductCarousel";
import { ProductGridSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/States";
import { HeartIcon } from "@/components/ui/icons";

export default function WishlistPage() {
  const mounted = useMounted();
  const ids = useWishlistStore((s) => s.ids);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ids.length) {
      setProducts([]);
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    getProductsByIds(ids)
      .then((p) => {
        if (!active) return;
        setProducts(p);
        // Remove favoritos órfãos (ids sem produto correspondente) para o
        // contador do header refletir a lista realmente exibida.
        useWishlistStore.getState().prune(p.map((x) => x.id));
      })
      .catch(() => active && setProducts([]))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [ids]);

  const showLoading = !mounted || (loading && ids.length > 0);

  return (
    <div className="container-page py-10">
      <Breadcrumb items={[{ label: "Início", href: "/" }, { label: "Favoritos" }]} />
      <h1 className="mb-6 mt-4 text-2xl font-extrabold tracking-tight text-ink md:text-3xl">
        Meus favoritos{" "}
        {mounted && products.length > 0 && (
          <span className="text-neutral-400">({products.length})</span>
        )}
      </h1>

      {showLoading ? (
        <ProductGridSkeleton count={4} />
      ) : products.length > 0 ? (
        <ProductGrid products={products} />
      ) : (
        <EmptyState
          icon={<HeartIcon className="size-12" />}
          title="Sua lista de favoritos está vazia"
          description="Toque no coração dos produtos que você ama para salvá-los aqui."
          action={{ label: "Explorar produtos", href: "/" }}
        />
      )}
    </div>
  );
}
