import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/config/site";
import { InfoPage } from "@/components/info/InfoPage";
import { ChevronDownIcon, WhatsappIcon } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Central de ajuda",
  description: "Perguntas frequentes sobre pedidos, pagamento, entrega e trocas.",
};

const FAQ: { topic: string; items: { q: string; a: React.ReactNode }[] }[] = [
  {
    topic: "Pedidos e pagamento",
    items: [
      { q: "Quais formas de pagamento vocês aceitam?", a: "Pix (com 10% de desconto à vista), cartão de crédito em até 12x sem juros e boleto bancário." },
      { q: "Como acompanho meu pedido?", a: <>Acesse <Link href="/rastrear">Rastrear pedido</Link> ou a área <Link href="/conta">Minha conta</Link> para ver o status em tempo real.</> },
      { q: "Posso cancelar uma compra?", a: "Sim. Pedidos ainda não enviados podem ser cancelados pelo atendimento. Após o envio, vale a política de trocas e devoluções." },
    ],
  },
  {
    topic: "Entrega",
    items: [
      { q: "Vocês entregam em todo o Brasil?", a: "Sim, enviamos para todo o território nacional via PAC, SEDEX e transportadoras." },
      { q: "Qual o prazo de entrega?", a: <>O prazo aparece no checkout após informar o CEP. Veja mais em <Link href="/prazos-de-entrega">Prazos de entrega</Link>.</> },
      { q: "Tem frete grátis?", a: "Sim, no SEDEX para pedidos acima de R$ 299 (conforme a região)." },
    ],
  },
  {
    topic: "Trocas e garantia",
    items: [
      { q: "Como faço uma troca ou devolução?", a: <>Você tem até 7 dias para arrependimento e 90 dias para defeitos. Veja o passo a passo em <Link href="/trocas-e-devolucoes">Trocas e devoluções</Link>.</> },
      { q: "O produto tem garantia?", a: "Todos os produtos têm garantia legal de 90 dias, além da garantia do fabricante quando aplicável." },
    ],
  },
  {
    topic: "Conta",
    items: [
      { q: "Preciso ter conta para comprar?", a: "Não — é possível comprar como visitante. Mas com conta você acompanha pedidos, salva endereços e favoritos." },
      { q: "Esqueci minha senha, e agora?", a: <>Use a opção <Link href="/recuperar-senha">Recuperar senha</Link> na tela de login.</> },
    ],
  },
];

export default function AjudaPage() {
  return (
    <InfoPage
      eyebrow="Atendimento"
      title="Central de ajuda"
      subtitle="Encontre respostas rápidas para as dúvidas mais comuns. Não achou? Fale com a gente."
    >
      <div className="max-w-3xl space-y-8">
        {FAQ.map((group) => (
          <section key={group.topic}>
            <h2 className="mb-3 text-lg font-bold text-ink">{group.topic}</h2>
            <div className="divide-y divide-neutral-200 overflow-hidden rounded-xl border border-neutral-200 bg-white">
              {group.items.map((item) => (
                <details key={item.q} className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-sm font-medium text-ink hover:bg-neutral-50">
                    {item.q}
                    <ChevronDownIcon className="size-5 shrink-0 text-neutral-400 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="px-5 pb-4 text-sm leading-relaxed text-neutral-600 [&_a]:font-medium [&_a]:text-flame [&_a]:underline">
                    {item.a}
                  </div>
                </details>
              ))}
            </div>
          </section>
        ))}

        {/* Contato */}
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-6">
          <h2 className="text-lg font-bold text-ink">Ainda precisa de ajuda?</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Nosso time atende de Seg. a Sex., das 8h às 18h.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <a
              href={`https://wa.me/${site.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md bg-success px-4 py-2.5 font-semibold text-white hover:opacity-90"
            >
              <WhatsappIcon className="size-4" /> Falar no WhatsApp
            </a>
            <a
              href={`mailto:${site.email}`}
              className="inline-flex items-center rounded-md border border-neutral-300 px-4 py-2.5 font-semibold text-ink hover:bg-white"
            >
              {site.email}
            </a>
            <span className="inline-flex items-center rounded-md border border-neutral-300 px-4 py-2.5 font-semibold text-ink">
              {site.phone}
            </span>
          </div>
        </div>
      </div>
    </InfoPage>
  );
}
