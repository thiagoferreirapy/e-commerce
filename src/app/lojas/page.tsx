import type { Metadata } from "next";
import { InfoPage } from "@/components/info/InfoPage";
import { TruckIcon } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Lojas físicas",
  description: "Encontre uma loja TORQUE perto de você.",
};

interface Store {
  city: string;
  name: string;
  address: string;
  phone: string;
  hours: string;
}

const STORES: Store[] = [
  {
    city: "São Paulo / SP",
    name: "TORQUE Paulista",
    address: "Av. das Motocicletas, 1000 — Bela Vista",
    phone: "(11) 3000-1000",
    hours: "Seg. a Sáb., 9h às 19h",
  },
  {
    city: "São Paulo / SP",
    name: "TORQUE Zona Sul",
    address: "Av. Washington Luís, 2500 — Campo Belo",
    phone: "(11) 3000-1001",
    hours: "Seg. a Sáb., 9h às 19h",
  },
  {
    city: "Rio de Janeiro / RJ",
    name: "TORQUE Barra",
    address: "Av. das Américas, 5000 — Barra da Tijuca",
    phone: "(21) 3000-2000",
    hours: "Seg. a Sáb., 9h às 19h",
  },
  {
    city: "Belo Horizonte / MG",
    name: "TORQUE Savassi",
    address: "Av. do Contorno, 6000 — Savassi",
    phone: "(31) 3000-3000",
    hours: "Seg. a Sex., 9h às 18h",
  },
  {
    city: "Curitiba / PR",
    name: "TORQUE Batel",
    address: "Av. do Batel, 1500 — Batel",
    phone: "(41) 3000-4000",
    hours: "Seg. a Sex., 9h às 18h",
  },
  {
    city: "Porto Alegre / RS",
    name: "TORQUE Moinhos",
    address: "Rua Padre Chagas, 300 — Moinhos de Vento",
    phone: "(51) 3000-5000",
    hours: "Seg. a Sex., 9h às 18h",
  },
];

export default function LojasPage() {
  return (
    <InfoPage
      eyebrow="Onde estamos"
      title="Lojas físicas"
      subtitle="Visite uma de nossas unidades para experimentar produtos, tirar dúvidas com especialistas e retirar pedidos."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {STORES.map((s) => (
          <div key={s.name} className="rounded-xl border border-neutral-200 bg-white p-5">
            <p className="text-2xs font-semibold uppercase tracking-wider text-flame-600">{s.city}</p>
            <h2 className="mt-1 text-lg font-bold text-ink">{s.name}</h2>
            <p className="mt-2 text-sm text-neutral-600">{s.address}</p>
            <p className="mt-3 text-sm text-neutral-600">
              <span className="font-semibold text-ink">Tel.:</span> {s.phone}
            </p>
            <p className="text-sm text-neutral-600">
              <span className="font-semibold text-ink">Horário:</span> {s.hours}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 flex items-start gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-5 text-sm text-neutral-600">
        <TruckIcon className="size-5 shrink-0 text-flame" />
        <p>
          <strong className="text-ink">Retire na loja:</strong> compre no site e escolha retirar em
          uma unidade. Você recebe um aviso por e-mail quando o pedido estiver disponível.
        </p>
      </div>
    </InfoPage>
  );
}
