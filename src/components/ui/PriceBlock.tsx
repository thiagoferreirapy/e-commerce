import { cn } from "@/lib/utils";
import {
  discountPercent,
  formatBRL,
  formatInstallments,
  pixPrice,
} from "@/lib/format";
import { Badge } from "./Badge";
import { PixIcon } from "./icons";

/**
 * Bloco de preço padrão da loja:
 * - "de" riscado (quando há desconto)
 * - "por" em destaque
 * - selo de % OFF
 * - preço à vista no Pix
 * - parcelamento sem juros
 */
export function PriceBlock({
  listPrice,
  price,
  size = "md",
  showInstallments = true,
  showPix = true,
  className,
}: {
  listPrice: number;
  price: number;
  size?: "sm" | "md" | "lg";
  showInstallments?: boolean;
  showPix?: boolean;
  className?: string;
}) {
  const off = discountPercent(listPrice, price);
  const pix = pixPrice(price);

  const priceSize = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl",
  }[size];

  return (
    <div className={cn("space-y-1", className)}>
      {off > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-400 line-through">
            {formatBRL(listPrice)}
          </span>
          <Badge tone="flame">-{off}%</Badge>
        </div>
      )}
      <div className={cn("font-display font-bold leading-none text-ink", priceSize)}>
        {formatBRL(price)}
      </div>
      {showPix && (
        <p className="flex items-center gap-1 text-sm font-semibold text-success">
          <PixIcon className="size-4" />
          {formatBRL(pix)} <span className="font-normal text-neutral-500">à vista no Pix</span>
        </p>
      )}
      {showInstallments && (
        <p className="text-xs text-neutral-500">ou {formatInstallments(price)}</p>
      )}
    </div>
  );
}
