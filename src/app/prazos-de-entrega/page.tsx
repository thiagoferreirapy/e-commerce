import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage, Prose } from "@/components/info/InfoPage";

export const metadata: Metadata = {
  title: "Prazos de entrega",
  description: "Prazos e modalidades de frete da TORQUE por região.",
};

const REGIONS = [
  { region: "Grande SP", pac: "4 dias úteis", sedex: "2 dias úteis" },
  { region: "Interior de SP", pac: "5 dias úteis", sedex: "3 dias úteis" },
  { region: "Sul e Sudeste", pac: "6 dias úteis", sedex: "3–4 dias úteis" },
  { region: "Centro-Oeste", pac: "7 dias úteis", sedex: "4 dias úteis" },
  { region: "Nordeste", pac: "9–10 dias úteis", sedex: "5–6 dias úteis" },
  { region: "Norte", pac: "12 dias úteis", sedex: "7 dias úteis" },
];

export default function PrazosEntregaPage() {
  return (
    <InfoPage
      eyebrow="Atendimento"
      title="Prazos de entrega"
      subtitle="Calculamos o prazo exato no checkout a partir do seu CEP. Abaixo, uma estimativa por região."
    >
      <div className="mb-8 max-w-3xl overflow-x-auto rounded-xl border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-400">
            <tr>
              <th className="px-5 py-3">Região</th>
              <th className="px-5 py-3">PAC</th>
              <th className="px-5 py-3">SEDEX</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {REGIONS.map((r) => (
              <tr key={r.region}>
                <td className="px-5 py-3 font-medium text-ink">{r.region}</td>
                <td className="px-5 py-3 text-neutral-600">{r.pac}</td>
                <td className="px-5 py-3 text-neutral-600">{r.sedex}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Prose>
        <h2>Como o prazo é calculado</h2>
        <ul>
          <li>O prazo começa a contar após a <strong>confirmação do pagamento</strong>.</li>
          <li>Acrescente o tempo de <strong>postagem</strong> (até 1 dia útil) ao prazo de transporte.</li>
          <li>Produtos sob encomenda podem ter prazo adicional, sempre informado na página do produto.</li>
        </ul>

        <h2>Frete grátis</h2>
        <p>
          Pedidos acima de <strong>R$ 299</strong> têm frete grátis no SEDEX para as regiões
          elegíveis. O benefício aparece automaticamente no carrinho.
        </p>

        <h2>Acompanhamento</h2>
        <p>
          Assim que o pedido é despachado, você recebe o código de rastreio por e-mail e pode
          acompanhá-lo em <Link href="/rastrear">Rastrear pedido</Link>.
        </p>
      </Prose>
    </InfoPage>
  );
}
