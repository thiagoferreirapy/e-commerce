import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/config/site";
import { InfoPage, Prose } from "@/components/info/InfoPage";

export const metadata: Metadata = {
  title: "Termos de uso",
  description: "Termos e condições de uso da loja TORQUE.",
};

export default function TermosPage() {
  return (
    <InfoPage
      eyebrow="Políticas"
      title="Termos de uso"
      subtitle="Ao usar a loja TORQUE, você concorda com as condições abaixo."
      updatedAt="12 de junho de 2026"
    >
      <Prose>
        <h2>1. Aceitação</h2>
        <p>
          Ao acessar e utilizar este site, você concorda com estes Termos de Uso e com a{" "}
          <Link href="/politica-de-privacidade">Política de privacidade</Link>. Caso não concorde,
          recomendamos não utilizar a plataforma.
        </p>

        <h2>2. Cadastro e conta</h2>
        <ul>
          <li>As informações fornecidas devem ser verídicas e atualizadas.</li>
          <li>Você é responsável por manter a confidencialidade da sua senha.</li>
          <li>É proibido o uso da conta por terceiros não autorizados.</li>
        </ul>

        <h2>3. Produtos e preços</h2>
        <p>
          Imagens são meramente ilustrativas. Preços e condições de pagamento são válidos para
          compras pela internet e podem mudar sem aviso prévio. Em caso de erro evidente de preço, a
          {" "}{site.name} poderá cancelar o pedido e reembolsar integralmente.
        </p>

        <h2>4. Pagamentos</h2>
        <p>
          Os pagamentos são processados por parceiros certificados. A aprovação está sujeita à
          análise antifraude e à confirmação da instituição financeira.
        </p>

        <h2>5. Propriedade intelectual</h2>
        <p>
          Marcas, logotipos, textos e imagens são protegidos por direitos autorais e não podem ser
          reproduzidos sem autorização.
        </p>

        <h2>6. Limitação de responsabilidade</h2>
        <p>
          A {site.name} não se responsabiliza por indisponibilidades temporárias, uso indevido de
          produtos em desacordo com as instruções do fabricante ou danos decorrentes de terceiros.
        </p>

        <h2>7. Trocas e devoluções</h2>
        <p>
          Aplicam-se as condições descritas na{" "}
          <Link href="/politica-de-trocas">Política de trocas</Link> e em{" "}
          <Link href="/trocas-e-devolucoes">Trocas e devoluções</Link>.
        </p>

        <h2>8. Foro</h2>
        <p>
          Estes termos são regidos pela legislação brasileira. Fica eleito o foro da comarca de São
          Paulo/SP para dirimir eventuais conflitos.
        </p>

        <p>Dúvidas sobre estes termos? Escreva para <a href={`mailto:${site.email}`}>{site.email}</a>.</p>
      </Prose>
    </InfoPage>
  );
}
