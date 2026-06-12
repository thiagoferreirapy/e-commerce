"use client";

import { ProductForm } from "@/components/admin/ProductForm";

export default function NewProductPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-ink">Novo produto</h2>
      <ProductForm />
    </div>
  );
}
