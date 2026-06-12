import type { Metadata } from "next";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { ProductListing } from "@/components/catalog/ProductListing";

export const metadata: Metadata = {
  title: "Ofertas do dia",
  description: "As melhores promoções em equipamentos e acessórios para moto.",
};

export default function OffersPage() {
  return (
    <div className="container-page py-6">
      <Breadcrumb items={[{ label: "Início", href: "/" }, { label: "Ofertas do dia" }]} />

      <header className="mb-8 mt-4">
        <p className="eyebrow mb-1">Por tempo limitado</p>
        <h1 className="text-3xl font-extrabold tracking-tight text-ink md:text-4xl">
          Ofertas do dia
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-neutral-500">
          Descontos selecionados a dedo. Aproveite antes que o tempo acabe.
        </p>
      </header>

      <ProductListing tag="oferta-do-dia" />
    </div>
  );
}
