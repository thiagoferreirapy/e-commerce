import type { Metadata } from "next";
import { site } from "@/config/site";
import { InfoPage, Prose } from "@/components/info/InfoPage";

export const metadata: Metadata = {
  title: "Política de privacidade",
  description: "Como a TORQUE coleta, usa e protege seus dados pessoais (LGPD).",
};

export default function PrivacidadePage() {
  return (
    <InfoPage
      eyebrow="Políticas"
      title="Política de privacidade"
      subtitle="Seu respeito e sua segurança são prioridade. Saiba como tratamos os seus dados."
      updatedAt="12 de junho de 2026"
    >
      <Prose>
        <p>
          Esta política descreve como a {site.name} (CNPJ {site.cnpj}) coleta, utiliza, armazena e
          protege os dados pessoais dos usuários, em conformidade com a Lei Geral de Proteção de
          Dados (Lei nº 13.709/2018 — LGPD).
        </p>

        <h2>1. Dados que coletamos</h2>
        <ul>
          <li><strong>Cadastro:</strong> nome, e-mail, CPF e telefone.</li>
          <li><strong>Entrega:</strong> endereço e CEP.</li>
          <li><strong>Pedidos:</strong> histórico de compras e itens favoritados.</li>
          <li><strong>Navegação:</strong> cookies e dados de uso para melhorar a experiência.</li>
        </ul>

        <h2>2. Como usamos seus dados</h2>
        <ul>
          <li>Processar pedidos, pagamentos e entregas.</li>
          <li>Oferecer suporte e comunicar status de compras.</li>
          <li>Enviar ofertas e novidades (apenas com seu consentimento).</li>
          <li>Prevenir fraudes e cumprir obrigações legais.</li>
        </ul>

        <h2>3. Compartilhamento</h2>
        <p>
          Compartilhamos dados apenas com parceiros essenciais à operação (transportadoras,
          gateways de pagamento e antifraude), sempre com cláusulas de confidencialidade. Nunca
          vendemos seus dados.
        </p>

        <h2>4. Segurança</h2>
        <p>
          Utilizamos criptografia (SSL/TLS), senhas protegidas por hash e cookies de sessão
          <strong> httpOnly</strong>. O acesso aos dados é restrito e auditado.
        </p>

        <h2>5. Seus direitos</h2>
        <p>
          Você pode solicitar acesso, correção, portabilidade ou exclusão dos seus dados, bem como
          revogar consentimentos, a qualquer momento, escrevendo para{" "}
          <a href={`mailto:${site.email}`}>{site.email}</a>.
        </p>

        <h2>6. Cookies</h2>
        <p>
          Usamos cookies para manter sua sessão, lembrar o carrinho e medir audiência. Você pode
          gerenciá-los nas configurações do seu navegador.
        </p>
      </Prose>
    </InfoPage>
  );
}
