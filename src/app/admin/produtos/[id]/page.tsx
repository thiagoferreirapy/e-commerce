"use client";

import { use, useEffect, useState } from "react";
import type { Product } from "@/types";
import { getAdminProduct } from "@/services/admin";
import { ProductForm } from "@/components/admin/ProductForm";

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    getAdminProduct(id).then(setProduct).catch(() => setError(true));
  }, [id]);

  if (error) return <p className="text-sm text-danger">Produto não encontrado.</p>;
  if (!product) return <p className="text-sm text-neutral-400">Carregando produto…</p>;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-ink">Editar: {product.name}</h2>
      <ProductForm product={product} />
    </div>
  );
}
