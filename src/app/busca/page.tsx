import type { Metadata } from "next";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { ProductListing } from "@/components/catalog/ProductListing";
import { EmptyState } from "@/components/ui/States";
import { SearchIcon } from "@/components/ui/icons";

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams;
  return { title: q ? `Busca: ${q}` : "Busca" };
}

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const term = q?.trim() ?? "";

  return (
    <div className="container-page py-6">
      <Breadcrumb items={[{ label: "Início", href: "/" }, { label: "Resultados da busca" }]} />

      {term ? (
        <>
          <header className="mb-8 mt-4">
            <p className="eyebrow mb-1">Resultados para</p>
            <h1 className="text-2xl font-extrabold tracking-tight text-ink md:text-3xl">
              “{term}”
            </h1>
          </header>
          <ProductListing
            query={term}
            emptyMessage={`Não encontramos resultados para “${term}”. Verifique a ortografia ou tente termos mais gerais.`}
          />
        </>
      ) : (
        <div className="mt-8">
          <EmptyState
            icon={<SearchIcon className="size-12" />}
            title="O que você procura?"
            description="Digite na barra de busca acima por produto, marca ou modelo de moto."
            action={{ label: "Ver capacetes", href: "/categoria/capacetes" }}
          />
        </div>
      )}
    </div>
  );
}
