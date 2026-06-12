import Link from "next/link";
import { site, footerLinks, paymentMethods } from "@/config/site";
import { Logo } from "./Logo";
import { Newsletter } from "./Newsletter";
import { ShieldIcon, TruckIcon } from "@/components/ui/icons";

export function Footer() {
  return (
    <footer className="mt-16 bg-ink text-neutral-300">
      {/* Newsletter */}
      <div className="border-b border-white/10">
        <div className="container-page grid gap-6 py-10 md:grid-cols-2 md:items-center">
          <div>
            <p className="eyebrow mb-1.5 text-flame-400">Fique por dentro</p>
            <h2 className="text-2xl font-bold text-white">
              Receba ofertas exclusivas e novidades
            </h2>
            <p className="mt-1 text-sm text-neutral-400">
              Cadastre seu e-mail e ganhe 10% OFF na primeira compra.
            </p>
          </div>
          <Newsletter />
        </div>
      </div>

      {/* Colunas */}
      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-5">
        <div className="sm:col-span-2 lg:col-span-1">
          <Logo light />
          <p className="mt-4 max-w-xs text-sm text-neutral-400">{site.tagline}.</p>
          <div className="mt-5 flex gap-3">
            {Object.entries(site.social).map(([name, href]) => (
              <a
                key={name}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={name}
                className="grid size-9 place-items-center rounded-full border border-white/15 text-xs font-bold uppercase text-neutral-300 transition-colors hover:border-flame hover:text-flame"
              >
                {name[0]}
              </a>
            ))}
          </div>
        </div>

        <FooterCol title="Institucional" links={footerLinks.institucional} />
        <FooterCol title="Atendimento" links={footerLinks.atendimento} />
        <FooterCol title="Políticas" links={footerLinks.institucional2} />

        <div>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-white">Atendimento</h3>
          <p className="text-sm text-neutral-400">{site.phone}</p>
          <p className="mt-1 text-sm text-neutral-400">{site.email}</p>
          <p className="mt-1 text-xs text-neutral-500">Seg. a Sex., 8h às 18h</p>
          <div className="mt-5 space-y-2">
            <span className="flex items-center gap-2 text-xs text-neutral-400">
              <ShieldIcon className="size-4 text-flame-400" /> Site 100% seguro (SSL)
            </span>
            <span className="flex items-center gap-2 text-xs text-neutral-400">
              <TruckIcon className="size-4 text-flame-400" /> Entrega para todo o Brasil
            </span>
          </div>
        </div>
      </div>

      {/* Pagamentos + selos */}
      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-4 py-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
              Formas de pagamento
            </p>
            <div className="flex flex-wrap gap-2">
              {paymentMethods.map((m) => (
                <span
                  key={m}
                  className="rounded-md bg-white px-2.5 py-1.5 text-2xs font-bold text-ink"
                >
                  {m}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
              Segurança
            </p>
            <div className="flex gap-2">
              <span className="rounded-md border border-white/15 px-2.5 py-1.5 text-2xs font-bold text-neutral-300">
                SSL Seguro
              </span>
              <span className="rounded-md border border-white/15 px-2.5 py-1.5 text-2xs font-bold text-neutral-300">
                Reclame Aqui
              </span>
              <span className="rounded-md border border-white/15 px-2.5 py-1.5 text-2xs font-bold text-neutral-300">
                Google Safe
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Rodapé legal */}
      <div className="border-t border-white/10 bg-black/20">
        <div className="container-page py-5 text-center text-xs text-neutral-500">
          <p>
            © {COPYRIGHT_YEAR} {site.name} Comércio de Acessórios para Motos LTDA — CNPJ{" "}
            {site.cnpj}
          </p>
          <p className="mt-1">{site.address}</p>
          <p className="mt-2 text-neutral-600">
            Os preços e condições de pagamento são válidos somente para compras via internet. As
            imagens são meramente ilustrativas.
          </p>
        </div>
      </div>
    </footer>
  );
}

// Ano fixo no build (sem Date.now em runtime de render do servidor).
const COPYRIGHT_YEAR = 2026;

function FooterCol({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-white">{title}</h3>
      <ul className="space-y-2">
        {links.map((l) => (
          <li key={l.label}>
            <Link href={l.href} className="text-sm text-neutral-400 transition-colors hover:text-flame">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
