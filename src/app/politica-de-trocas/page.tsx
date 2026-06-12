import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/config/site";
import { InfoPage, Prose } from "@/components/info/InfoPage";

export const metadata: Metadata = {
  title: "Política de trocas",
  description: "Condições oficiais de troca, devolução e reembolso da TORQUE.",
};

export default function PoliticaTrocasPage() {
  return (
    <InfoPage
      eyebrow="Políticas"
      title="Política de trocas"
      subtitle="As condições oficiais que regem trocas, devoluções e reembolsos na TORQUE."
      updatedAt="12 de junho de 2026"
    >
      <Prose>
        <h2>1. Direito de arrependimento</h2>
        <p>
          Nos termos do art. 49 do Código de Defesa do Consumidor, o cliente pode desistir da
          compra em até <strong>7 (sete) dias corridos</strong> a contar do recebimento, sem
          necessidade de justificativa, com reembolso integral, inclusive do frete.
        </p>

        <h2>2. Condições do produto</h2>
        <ul>
          <li>Sem indícios de uso e sem violação dos lacres de segurança.</li>
          <li>Com todos os acessórios, manuais e brindes recebidos.</li>
          <li>Na embalagem original, sempre que possível.</li>
        </ul>

        <h2>3. Produtos com defeito</h2>
        <p>
          Para vícios de qualidade, o prazo é de <strong>90 (noventa) dias</strong> (garantia legal
          para bens duráveis). Havendo garantia do fabricante, ela também será acionada.
        </p>

        <h2>4. Prazos de reembolso</h2>
        <ul>
          <li><strong>Cartão de crédito:</strong> estorno em até 2 faturas subsequentes.</li>
          <li><strong>Pix / boleto:</strong> depósito em até 10 dias úteis na conta informada.</li>
        </ul>

        <h2>5. Frete da devolução</h2>
        <p>
          Em casos de defeito ou erro no envio, o frete de devolução é por nossa conta (postagem
          reversa). No arrependimento, seguimos o disposto na legislação vigente.
        </p>

        <h2>6. Como solicitar</h2>
        <p>
          O passo a passo completo está em{" "}
          <Link href="/trocas-e-devolucoes">Trocas e devoluções</Link>. Para abrir uma solicitação,
          acesse <Link href="/conta">Minha conta</Link> ou escreva para{" "}
          <a href={`mailto:${site.email}`}>{site.email}</a>.
        </p>
      </Prose>
    </InfoPage>
  );
}
