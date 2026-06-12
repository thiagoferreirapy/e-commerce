import Link from "next/link";
import Image from "next/image";
import { rootCategories } from "@/data/categories";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function CategoryGrid() {
  return (
    <section className="container-page py-12">
      <SectionHeading eyebrow="Navegue" title="Escolha por categoria" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
        {rootCategories.map((cat) => (
          <Link
            key={cat.id}
            href={`/categoria/${cat.slug}`}
            className="group flex flex-col items-center gap-3 rounded-xl border border-neutral-200 bg-white p-4 text-center transition-all hover:-translate-y-0.5 hover:border-flame hover:shadow-sm"
          >
            <div className="relative size-16 overflow-hidden rounded-full bg-neutral-100">
              <Image
                src={cat.imageUrl}
                alt=""
                fill
                sizes="64px"
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
            </div>
            <span className="text-xs font-semibold leading-tight text-ink group-hover:text-flame">
              {cat.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
