import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategoryContext } from "@/services/catalog";
import { brandsBySlug } from "@/data/brands";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { ProductListing } from "@/components/catalog/ProductListing";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ marca?: string; sub?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const ctx = await getCategoryContext(slug);
  if (!ctx) return { title: "Categoria" };
  return {
    title: ctx.category.name,
    description: ctx.category.description ?? `Veja ${ctx.category.name} na TORQUE.`,
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { marca, sub } = await searchParams;
  const ctx = await getCategoryContext(slug);
  if (!ctx) notFound();

  const { category, trail } = ctx;
  const initialBrandSlugs = marca && brandsBySlug.has(marca) ? [marca] : [];
  const initialSubcategories = sub ? sub.split(",").map((s) => s.trim()).filter(Boolean) : [];

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

      <ProductListing
        categorySlug={slug}
        initialBrandSlugs={initialBrandSlugs}
        initialSubcategories={initialSubcategories}
      />
    </div>
  );
}
