"use client";

import { useEffect, useState } from "react";
import type { Product } from "@/types";
import { getProductsByIds } from "@/services/catalog";
import { getViewed } from "@/lib/recentlyViewed";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProductCarousel } from "./ProductCarousel";

/** Carrossel "Você viu recentemente" (ids do localStorage, dados da API). */
export function RecentlyViewed({ excludeId }: { excludeId?: string }) {
  const [items, setItems] = useState<Product[]>([]);

  useEffect(() => {
    const ids = getViewed().filter((id) => id !== excludeId);
    if (!ids.length) {
      setItems([]);
      return;
    }
    let active = true;
    getProductsByIds(ids)
      .then((products) => {
        if (active) setItems(products);
      })
      .catch(() => active && setItems([]));
    return () => {
      active = false;
    };
  }, [excludeId]);

  if (items.length === 0) return null;

  return (
    <section className="container-page py-12">
      <SectionHeading eyebrow="Continue de onde parou" title="Você viu recentemente" />
      <ProductCarousel products={items} />
    </section>
  );
}
