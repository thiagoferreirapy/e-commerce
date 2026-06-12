import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategory, categoryTrail } from "@/data/categories";
import { getProductBySlugAsync, getRelatedProducts } from "@/services/catalog";
import {
  discountPercent,
  formatBRL,
  formatInstallments,
  pixPrice,
} from "@/lib/format";
import { site } from "@/config/site";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Tabs } from "@/components/ui/Tabs";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProductDetail } from "@/components/product/ProductDetail";
import { ReviewsTab } from "@/components/product/ReviewsTab";
import { RecentlyViewed } from "@/components/product/RecentlyViewed";
import { ProductCarousel } from "@/components/product/ProductCarousel";
import { PixIcon } from "@/components/ui/icons";

interface Props {
  params: Promise<{ slug: string }>;
}

// Renderizado sob demanda (dados vêm da API).
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlugAsync(slug);
  if (!product) return { title: "Produto não encontrado" };
  return {
    title: product.name,
    description: product.shortDescription,
    openGraph: { title: product.name, description: product.shortDescription, images: [product.images[0]] },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlugAsync(slug);
  if (!product) notFound();

  const brand = product.brand;
  const category = getCategory(product.subcategorySlug ?? product.categorySlug);
  const trail = category ? categoryTrail(category.slug) : [];
  const related = await getRelatedProducts(slug);

  // Dados estruturados de produto (schema.org).
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.images,
    description: product.shortDescription,
    sku: product.ref,
    brand: { "@type": "Brand", name: brand?.name },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: product.rating,
      reviewCount: product.reviewCount,
    },
    offers: {
      "@type": "Offer",
      priceCurrency: "BRL",
      price: product.price,
      availability:
        product.totalStock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      url: `${site.url}/produto/${product.slug}`,
    },
  };

  return (
    <div className="container-page py-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Breadcrumb
        items={[
          { label: "Início", href: "/" },
          ...trail.map((c) => ({ label: c.name, href: `/categoria/${c.slug}` })),
          { label: product.name },
        ]}
      />

      <div className="mt-6">
        <ProductDetail product={product} />
      </div>

      {/* Abas */}
      <div className="mt-12">
        <Tabs
          items={[
            {
              id: "descricao",
              label: "Descrição",
              content: (
                <div className="prose-torque max-w-3xl text-sm leading-relaxed text-neutral-600">
                  <p>{product.description}</p>
                </div>
              ),
            },
            {
              id: "specs",
              label: "Especificações",
              content: (
                <div className="max-w-2xl overflow-hidden rounded-lg border border-neutral-200">
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-neutral-100">
                      {product.specs.map((s) => (
                        <tr key={s.label} className="even:bg-neutral-50">
                          <th className="w-1/3 px-4 py-3 text-left font-semibold text-ink">
                            {s.label}
                          </th>
                          <td className="px-4 py-3 text-neutral-600">{s.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ),
            },
            {
              id: "pagamento",
              label: "Formas de pagamento",
              content: <PaymentInfo price={product.price} />,
            },
          ]}
        />
      </div>

      {/* Avaliações dos clientes (seção dedicada na parte de baixo) */}
      <section id="avaliacoes" className="mt-14 scroll-mt-24">
        <SectionHeading
          eyebrow="O que dizem os clientes"
          title={`Avaliações${product.reviewCount ? ` (${product.reviewCount})` : ""}`}
        />
        <ReviewsTab reviews={product.reviews} rating={product.rating} />
      </section>

      {/* Relacionados */}
      {related.length > 0 && (
        <section className="mt-12">
          <SectionHeading eyebrow="Combina com" title="Produtos relacionados" />
          <ProductCarousel products={related} />
        </section>
      )}

      <RecentlyViewed excludeId={product.id} />
    </div>
  );
}

function PaymentInfo({ price }: { price: number }) {
  return (
    <div className="grid max-w-2xl gap-4 sm:grid-cols-2">
      <div className="rounded-lg border border-success/30 bg-success-soft p-4">
        <p className="flex items-center gap-2 font-bold text-success">
          <PixIcon className="size-5" /> Pix
        </p>
        <p className="mt-1 text-2xl font-extrabold text-ink">{formatBRL(pixPrice(price))}</p>
        <p className="text-xs text-neutral-500">
          {discountPercent(price, pixPrice(price))}% de desconto à vista
        </p>
      </div>
      <div className="rounded-lg border border-neutral-200 p-4">
        <p className="font-bold text-ink">Cartão de crédito</p>
        <p className="mt-1 text-sm text-neutral-600">{formatInstallments(price)}</p>
        <p className="text-xs text-neutral-500">Aceitamos Visa, Master, Elo e Amex.</p>
      </div>
      <div className="rounded-lg border border-neutral-200 p-4">
        <p className="font-bold text-ink">Boleto bancário</p>
        <p className="mt-1 text-sm text-neutral-600">{formatBRL(price)} à vista</p>
        <p className="text-xs text-neutral-500">Compensação em até 2 dias úteis.</p>
      </div>
    </div>
  );
}
