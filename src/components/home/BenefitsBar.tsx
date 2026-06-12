import { benefits } from "@/config/site";
import {
  CartIcon,
  PixIcon,
  ShieldIcon,
  TruckIcon,
} from "@/components/ui/icons";

const icons = { truck: TruckIcon, pix: PixIcon, card: CartIcon, shield: ShieldIcon };

/** Faixa de benefícios em destaque na home (todos os viewports). */
export function BenefitsBar() {
  return (
    <section className="container-page pt-6">
      <div className="grid grid-cols-2 gap-3 rounded-xl border border-neutral-200 bg-white p-2 md:grid-cols-4">
        {benefits.map((b) => {
          const Icon = icons[b.icon];
          return (
            <div key={b.title} className="flex items-center gap-3 rounded-lg px-3 py-2.5">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-flame-50 text-flame">
                <Icon className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold leading-tight text-ink">{b.title}</p>
                <p className="truncate text-xs text-neutral-500">{b.text}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
