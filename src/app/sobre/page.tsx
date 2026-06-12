import type { Metadata } from "next";
import { site } from "@/config/site";
import { InfoPage, Prose } from "@/components/info/InfoPage";

export const metadata: Metadata = {
  title: "Sobre a TORQUE",
  description: "Conheça a história, a missão e os valores da TORQUE.",
};

const STATS = [
  { value: "+10 anos", label: "acelerando junto com você" },
  { value: "+120 mil", label: "pedidos entregues" },
  { value: "+40 marcas", label: "parceiras oficiais" },
  { value: "4.9/5", label: "avaliação dos clientes" },
];

export default function SobrePage() {
  return (
    <InfoPage
      eyebrow="Nossa história"
      title="Sobre a TORQUE"
      subtitle="Equipamentos e acessórios para quem vive de moto — com curadoria técnica, marcas oficiais e atendimento de quem entende do assunto."
    >
      {/* Indicadores */}
      <div className="mb-10 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {STATS.map((s) => (
          <div key={s.label} className="rounded-xl border border-neutral-200 bg-white p-5 text-center">
            <p className="text-2xl font-extrabold text-flame">{s.value}</p>
            <p className="mt-1 text-xs text-neutral-500">{s.label}</p>
          </div>
        ))}
      </div>

      <Prose>
        <p>
          A <strong>TORQUE</strong> nasceu da paixão pelo motociclismo e da vontade de oferecer ao
          piloto brasileiro produtos de verdade: equipamentos certificados, marcas reconhecidas e
          informação técnica clara para você escolher com segurança.
        </p>

        <h2>Nossa missão</h2>
        <p>
          Equipar cada motociclista com o que há de melhor em proteção, performance e estilo —
          tornando o acesso a produtos premium simples, justo e confiável.
        </p>

        <h2>O que nos move</h2>
        <ul>
          <li>
            <strong>Segurança em primeiro lugar:</strong> só trabalhamos com produtos
            homologados (ECE / Inmetro) e marcas oficiais.
          </li>
          <li>
            <strong>Curadoria técnica:</strong> descrições honestas, especificações completas e
            recomendação do produto certo para cada uso.
          </li>
          <li>
            <strong>Respeito ao cliente:</strong> preço transparente, parcelamento sem juros,
            desconto no Pix e pós-venda de verdade.
          </li>
        </ul>

        <h2>Compromisso</h2>
        <p>
          Somos uma empresa brasileira que entrega para todo o país. Cada pedido é conferido,
          embalado com cuidado e acompanhado até a sua porta. Qualquer dúvida, fale com a gente em{" "}
          <a href={`mailto:${site.email}`}>{site.email}</a> ou pelo telefone {site.phone}.
        </p>
      </Prose>
    </InfoPage>
  );
}
