import { Breadcrumb } from "@/components/ui/Breadcrumb";

/**
 * Shell padrão das páginas institucionais (Sobre, Políticas, Ajuda, etc.).
 * Cabeçalho editorial + área de conteúdo com tipografia consistente.
 */
export function InfoPage({
  title,
  eyebrow,
  subtitle,
  updatedAt,
  children,
}: {
  title: string;
  eyebrow?: string;
  subtitle?: string;
  updatedAt?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="container-page py-10">
      <Breadcrumb items={[{ label: "Início", href: "/" }, { label: title }]} />

      <header className="mt-6 max-w-3xl">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink md:text-4xl">
          {title}
        </h1>
        {subtitle && <p className="mt-3 text-lg text-neutral-500">{subtitle}</p>}
        {updatedAt && (
          <p className="mt-2 text-xs text-neutral-400">Última atualização: {updatedAt}</p>
        )}
      </header>

      <div className="mt-8">{children}</div>
    </div>
  );
}

/**
 * Bloco de texto com tipografia (h2/p/ul/strong/a) estilizada via variantes
 * de descendente — evita repetir classes em cada elemento.
 */
export function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-neutral-600
        [&_a]:font-medium [&_a]:text-flame [&_a]:underline
        [&_h2]:mt-9 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:text-ink
        [&_h3]:mt-6 [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-ink
        [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:pl-5
        [&_strong]:font-semibold [&_strong]:text-ink
        [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5"
    >
      {children}
    </div>
  );
}
