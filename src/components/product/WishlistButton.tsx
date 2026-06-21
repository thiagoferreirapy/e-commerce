"use client";

import { useWishlistStore } from "@/store/wishlist";
import { toast } from "@/store/toast";
import { cn } from "@/lib/utils";
import { HeartIcon } from "@/components/ui/icons";

export function WishlistButton({
  productId,
  productName,
  className,
  size = "md",
  highlightBorder = true,
}: {
  productId: string;
  productName?: string;
  className?: string;
  size?: "sm" | "md";
  /** Quando favoritado, deixa a borda laranja também. False = só o ícone. */
  highlightBorder?: boolean;
}) {
  const ids = useWishlistStore((s) => s.ids);
  const toggle = useWishlistStore((s) => s.toggle);
  const active = ids.includes(productId);

  function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    toggle(productId);
    toast.info(
      active
        ? "Removido dos favoritos"
        : `${productName ? `"${productName}"` : "Produto"} adicionado aos favoritos`,
    );
  }

  const dim = size === "sm" ? "size-9" : "size-10";

  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      aria-label={active ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      className={cn(
        "grid shrink-0 aspect-square place-items-center rounded-full border bg-white/90 backdrop-blur transition-colors",
        active
          ? cn("text-flame", highlightBorder ? "border-flame" : "border-neutral-200")
          : "border-neutral-200 text-neutral-500 hover:text-flame",
        dim,
        className,
      )}
    >
      <HeartIcon className="size-5" filled={active || undefined} />
    </button>
  );
}
