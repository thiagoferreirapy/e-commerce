import type { Metadata } from "next";
import { InfoPage } from "@/components/info/InfoPage";
import { TrackOrder } from "@/components/info/TrackOrder";

export const metadata: Metadata = {
  title: "Rastrear pedido",
  description: "Acompanhe o status e a entrega do seu pedido TORQUE.",
};

export default function RastrearPage() {
  return (
    <InfoPage
      eyebrow="Atendimento"
      title="Rastrear pedido"
      subtitle="Informe o número do pedido para ver o status atualizado da sua compra."
    >
      <TrackOrder />
    </InfoPage>
  );
}
