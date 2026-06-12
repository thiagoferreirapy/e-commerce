import Link from "next/link";
import { getHomeShowcases } from "@/services/catalog";
import { Hero } from "@/components/home/Hero";
import { BenefitsBar } from "@/components/home/BenefitsBar";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { BrandStrip } from "@/components/home/BrandStrip";
import { ProductCarousel } from "@/components/product/ProductCarousel";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Countdown } from "@/components/ui/Countdown";

// Vitrines vêm da API em tempo de requisição.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Degrada com elegância: se a API de vitrines falhar, a home ainda renderiza
  // (hero, categorias, marcas) com as listas vazias.
  const { ofertas, maisVendidos, novidades, descontos } = await getHomeShowcases().catch(() => ({
    ofertas: [],
    maisVendidos: [],
    novidades: [],
    descontos: [],
  }));
  const offerEnds = ofertas.find((p) => p.offerEndsAt)?.offerEndsAt;

  return (
    <>
      <Hero />
      <BenefitsBar />
      <CategoryGrid />

      {/* Ofertas do dia com countdown */}
      <section className="bg-ink py-12 text-white">
        <div className="container-page">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow mb-1.5 text-flame-400">Aproveite</p>
              <h2 className="text-2xl font-bold md:text-3xl">Ofertas do dia</h2>
            </div>
            {offerEnds && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-neutral-300">Termina em</span>
                <Countdown endsAt={offerEnds} />
              </div>
            )}
          </div>
          <ProductCarousel products={ofertas} />
          <div className="mt-6 text-center">
            <Link
              href="/ofertas"
              className="inline-flex items-center gap-2 rounded-md border border-white/20 px-5 py-2.5 text-sm font-semibold text-white hover:border-flame hover:text-flame"
            >
              Ver todas as ofertas
            </Link>
          </div>
        </div>
      </section>

      <section className="container-page py-12">
        <SectionHeading
          eyebrow="Os queridinhos"
          title="Mais vendidos"
          href="/categoria/capacetes?ordenar=mais-vendidos"
        />
        <ProductCarousel products={maisVendidos} />
      </section>

      {/* Banner promocional editorial */}
      <section className="container-page py-4">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-ink to-ink-700 px-8 py-10 md:px-12 md:py-14">
          <div className="relative z-10 max-w-lg">
            <p className="eyebrow mb-2 text-flame-400">Equipe-se com segurança</p>
            <h2 className="text-2xl font-bold text-white md:text-3xl">
              Tudo para a sua pilotagem em um só lugar
            </h2>
            <p className="mt-2 text-sm text-neutral-300">
              Vestuário, proteção, manutenção e acessórios das marcas que você confia.
            </p>
            <Link
              href="/categoria/vestuario"
              className="mt-5 inline-flex items-center gap-2 rounded-md bg-flame px-5 py-3 text-sm font-semibold text-white hover:bg-flame-600"
            >
              Conferir vestuário
            </Link>
          </div>
          <div className="pointer-events-none absolute -right-10 top-1/2 hidden size-64 -translate-y-1/2 rounded-full bg-flame/20 blur-3xl md:block" />
        </div>
      </section>

      <section className="container-page py-12">
        <SectionHeading
          eyebrow="Acabou de chegar"
          title="Novidades"
          href="/categoria/capacetes?ordenar=novidades"
        />
        <ProductCarousel products={novidades} />
      </section>

      <section className="bg-neutral-100 py-12">
        <div className="container-page">
          <SectionHeading eyebrow="Pague menos" title="Descontos especiais" />
          <ProductCarousel products={descontos} />
        </div>
      </section>

      <BrandStrip />
    </>
  );
}
