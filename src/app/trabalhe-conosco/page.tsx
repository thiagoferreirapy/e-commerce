import type { Metadata } from "next";
import { InfoPage, Prose } from "@/components/info/InfoPage";
import { JobApplicationForm } from "@/components/info/JobApplicationForm";

export const metadata: Metadata = {
  title: "Trabalhe conosco",
  description: "Faça parte do time TORQUE. Veja nossos valores e candidate-se.",
};

export default function TrabalheConoscoPage() {
  return (
    <InfoPage
      eyebrow="Carreiras"
      title="Trabalhe conosco"
      subtitle="A gente acelera junto. Se você curte moto e quer crescer com a TORQUE, queremos te conhecer."
    >
      <Prose>
        <h2>Por que a TORQUE?</h2>
        <ul>
          <li>Ambiente colaborativo e apaixonado por motociclismo.</li>
          <li>Plano de carreira, treinamentos e descontos para colaboradores.</li>
          <li>Modelo híbrido para áreas administrativas.</li>
        </ul>
        <h2>Envie sua candidatura</h2>
        <p>
          Não tem uma vaga aberta no momento para o seu perfil? Sem problema — deixe seus dados no
          banco de talentos e entraremos em contato quando surgir uma oportunidade.
        </p>
      </Prose>

      <div className="mt-6 max-w-3xl">
        <JobApplicationForm />
      </div>
    </InfoPage>
  );
}
