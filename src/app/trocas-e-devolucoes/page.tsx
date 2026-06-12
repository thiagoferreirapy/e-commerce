import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/config/site";
import { InfoPage, Prose } from "@/components/info/InfoPage";

export const metadata: Metadata = {
  title: "Trocas e devoluções",
  description: "Saiba como trocar ou devolver um produto comprado na TORQUE.",
};

export default function TrocasDevolucoesPage() {
  return (
    <InfoPage
      eyebrow="Atendimento"
      title="Trocas e devoluções"
      subtitle="Comprou e não era bem o que esperava? A gente resolve. Veja como funciona."
    >
      <Prose>
        <h2>Prazo de arrependimento (7 dias)</h2>
        <p>
          Conforme o Código de Defesa do Consumidor, você pode desistir da compra em até{" "}
          <strong>7 dias corridos</strong> após o recebimento, sem necessidade de justificativa. O
          produto deve estar sem uso, com etiquetas e na embalagem original.
        </p>

        <h2>Troca por defeito (até 90 dias)</h2>
        <p>
          Identificou um defeito de fabricação? Você tem <strong>90 dias</strong> (garantia legal)
          para solicitar a troca. Conforme o caso, acionamos também a garantia do fabricante.
        </p>

        <h2>Como solicitar</h2>
        <ol>
          <li>Acesse <Link href="/conta">Minha conta</Link> e localize o pedido.</li>
          <li>Entre em contato pela <Link href="/ajuda">Central de ajuda</Link> informando o número do pedido e o motivo.</li>
          <li>Receba o código de postagem reversa (frete por nossa conta em caso de defeito).</li>
          <li>Poste o produto e acompanhe o reembolso ou o envio do novo item.</li>
        </ol>

        <h2>Reembolso</h2>
        <ul>
          <li><strong>Pix / boleto:</strong> devolução em até 10 dias úteis após recebermos o produto.</li>
          <li><strong>Cartão de crédito:</strong> estorno em até 2 faturas, conforme a operadora.</li>
        </ul>

        <h2>Itens não elegíveis</h2>
        <p>
          Por questões de higiene e segurança, produtos de uso pessoal danificados pelo uso, sem
          embalagem ou fora do prazo não podem ser trocados, salvo defeito de fabricação.
        </p>

        <p>
          Dúvidas? Fale com a gente em <a href={`mailto:${site.email}`}>{site.email}</a> ou {site.phone}.
        </p>
      </Prose>
    </InfoPage>
  );
}
