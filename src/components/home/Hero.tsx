import Link from "next/link";
import Image from "next/image";
import { ChevronRightIcon } from "@/components/ui/icons";

/** Banner principal + dois banners secundários (layout editorial). */
export function Hero() {
  return (
    <section className="container-page pt-6">
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Banner principal */}
        <Link
          href="/categoria/capacetes"
          className="group relative col-span-2 flex min-h-[280px] items-end overflow-hidden rounded-2xl bg-ink md:min-h-[420px]"
        >
          <Image
            src="https://picsum.photos/seed/torque-hero-moto/1200/800"
            alt="Coleção de capacetes premium TORQUE"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 66vw"
            className="object-cover opacity-70 transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
          <div className="relative p-7 md:p-10">
            <p className="eyebrow mb-3 text-flame-400">Nova coleção 2026</p>
            <h1 className="max-w-md text-3xl font-extrabold leading-[1.05] text-white md:text-5xl">
              Capacetes que acompanham o seu ritmo
            </h1>
            <p className="mt-3 max-w-sm text-sm text-neutral-200 md:text-base">
              Tecnologia de pista, conforto de viagem. Até 12x sem juros e frete grátis.
            </p>
            <span className="mt-6 inline-flex items-center gap-2 rounded-md bg-flame px-5 py-3 text-sm font-semibold text-white transition-colors group-hover:bg-flame-600">
              Explorar capacetes
              <ChevronRightIcon className="size-4" />
            </span>
          </div>
        </Link>

        {/* Banners secundários */}
        <div className="grid gap-4">
          <SecondaryBanner
            href="/categoria/escapamentos"
            seed="torque-hero-escape"
            eyebrow="Performance"
            title="Escapamentos esportivos"
            text="Ronco e ganho de torque"
          />
          <SecondaryBanner
            href="/ofertas"
            seed="torque-hero-oferta"
            eyebrow="Oferta relâmpago"
            title="Até 30% OFF"
            text="Por tempo limitado"
            accent
          />
        </div>
      </div>
    </section>
  );
}

function SecondaryBanner({
  href,
  seed,
  eyebrow,
  title,
  text,
  accent,
}: {
  href: string;
  seed: string;
  eyebrow: string;
  title: string;
  text: string;
  accent?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group relative flex min-h-[120px] items-end overflow-hidden rounded-2xl bg-ink-800 md:min-h-[202px]"
    >
      <Image
        src={`https://picsum.photos/seed/${seed}/700/500`}
        alt={title}
        fill
        sizes="(max-width: 1024px) 100vw, 33vw"
        className="object-cover opacity-60 transition-transform duration-700 group-hover:scale-105"
      />
      <div
        className={`absolute inset-0 bg-gradient-to-t ${accent ? "from-flame-800" : "from-ink"} via-ink/30 to-transparent`}
      />
      <div className="relative p-5">
        <p className="text-2xs font-semibold uppercase tracking-[0.18em] text-flame-300">
          {eyebrow}
        </p>
        <h3 className="mt-1 text-xl font-bold text-white">{title}</h3>
        <p className="text-xs text-neutral-200">{text}</p>
      </div>
    </Link>
  );
}
