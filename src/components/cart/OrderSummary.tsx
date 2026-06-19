import { formatBRL } from "@/lib/format";
import { PixIcon } from "@/components/ui/icons";

/** Resumo de valores (subtotal, desconto, frete, total + total no Pix). */
export function OrderSummary({
  subtotal,
  discount,
  shipping,
  pixTotal,
  shippingLabel,
  children,
}: {
  subtotal: number;
  discount: number;
  shipping: number | null;
  /** Total final à vista no Pix (já com desconto e frete), calculado pelo chamador. */
  pixTotal: number;
  shippingLabel?: string;
  children?: React.ReactNode;
}) {
  const total = subtotal - discount + (shipping ?? 0);

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5">
      <h2 className="text-base font-bold text-ink">Resumo</h2>
      <dl className="mt-4 space-y-2.5 text-sm">
        <Row label="Subtotal" value={formatBRL(subtotal)} />
        {discount > 0 && (
          <Row label="Desconto" value={`- ${formatBRL(discount)}`} accent="success" />
        )}
        <Row
          label={shippingLabel ? `Frete (${shippingLabel})` : "Frete"}
          value={
            shipping === null
              ? "Calcular"
              : shipping === 0
                ? "Grátis"
                : formatBRL(shipping)
          }
          accent={shipping === 0 ? "success" : undefined}
        />
      </dl>

      <div className="mt-4 flex items-end justify-between border-t border-neutral-200 pt-4">
        <span className="text-sm font-semibold text-ink">Total</span>
        <span className="text-2xl font-extrabold text-ink">{formatBRL(total)}</span>
      </div>
      <p className="mt-1 flex items-center justify-end gap-1 text-sm font-semibold text-success">
        {/* <PixIcon className="size-4" /> */}
        {formatBRL(pixTotal)}{" "}
        <span className="font-normal text-neutral-500">à vista no Pix</span>
      </p>

      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}

function Row({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "success";
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-neutral-500">{label}</dt>
      <dd className={accent === "success" ? "font-semibold text-success" : "font-medium text-ink"}>
        {value}
      </dd>
    </div>
  );
}
