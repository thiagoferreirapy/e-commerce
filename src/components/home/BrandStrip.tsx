import Link from "next/link";
import { brands } from "@/data/brands";
import { SectionHeading } from "@/components/ui/SectionHeading";

/** "Compre por marca" — chips tipográficos clicáveis (sem depender de imagem). */
export function BrandStrip() {
  return (
    <section className="container-page py-12">
      <SectionHeading eyebrow="Marcas oficiais" title="Compre por marca" />
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {brands.map((b) => (
          <Link
            key={b.id}
            href={`/busca?q=${encodeURIComponent(b.name)}`}
            className="grid h-20 place-items-center rounded-xl border border-neutral-200 bg-white transition-all hover:-translate-y-0.5 hover:border-ink hover:shadow-sm"
          >
            <span className="font-display text-lg font-extrabold tracking-tight text-ink-600">
              {b.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
