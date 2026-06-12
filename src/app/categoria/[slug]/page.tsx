import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategory, categoryTrail } from "@/data/categories";
import { brandsBySlug } from "@/data/brands";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { ProductListing } from "@/components/catalog/ProductListing";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ marca?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) return { title: "Categoria" };
  return {
    title: category.name,
    description: category.description ?? `Veja ${category.name} na TORQUE.`,
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { marca } = await searchParams;
  const category = getCategory(slug);
  if (!category) notFound();

  const trail = categoryTrail(slug);
  const initialBrandSlugs = marca && brandsBySlug.has(marca) ? [marca] : [];

  return (
    <div className="container-page py-6">
      <Breadcrumb
        items={[
          { label: "Início", href: "/" },
          ...trail.map((c, i) => ({
            label: c.name,
            href: i < trail.length - 1 ? `/categoria/${c.slug}` : undefined,
          })),
        ]}
      />

      <header className="mb-8 mt-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-ink md:text-4xl">
          {category.name}
        </h1>
        {category.description && (
          <p className="mt-2 max-w-2xl text-sm text-neutral-500">{category.description}</p>
        )}
      </header>

      <ProductListing categorySlug={slug} initialBrandSlugs={initialBrandSlugs} />
    </div>
  );
}
