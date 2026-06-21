"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeftIcon, ChevronRightIcon } from "./icons";

/**
 * Carrossel horizontal com scroll-snap nativo + setas. Usado nas vitrines,
 * relacionados e visualizados. Cada filho deve ter largura própria.
 */
export function Carousel({
  children,
  className,
  itemClassName,
}: {
  children: React.ReactNode;
  className?: string;
  itemClassName?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);

  function scrollBy(dir: 1 | -1) {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * (el.clientWidth * 0.8), behavior: "smooth" });
  }

  return (
    <div className={cn("group/carousel relative", className)}>
      <div
        ref={trackRef}
        className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 pb-1"
      >
        {Array.isArray(children)
          ? children.map((child, i) => (
              <div
                key={i}
                // snap-always (mobile): cada arraste para exatamente no próximo item
                // (sem "pular" vários com a inércia). No desktop (md+) volta ao normal,
                // deixando as setas avançarem em grupo.
                className={cn(
                  "snap-start snap-always shrink-0 md:snap-normal",
                  itemClassName ?? "w-[15rem]",
                )}
              >
                {child}
              </div>
            ))
          : children}
      </div>

      <CarouselButton dir="left" onClick={() => scrollBy(-1)} />
      <CarouselButton dir="right" onClick={() => scrollBy(1)} />
    </div>
  );
}

function CarouselButton({ dir, onClick }: { dir: "left" | "right"; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={dir === "left" ? "Anterior" : "Próximo"}
      className={cn(
        "absolute top-1/2 z-10 hidden size-11 -translate-y-1/2 place-items-center rounded-full border border-neutral-200 bg-white text-ink shadow-md transition",
        "opacity-0 group-hover/carousel:opacity-100 hover:bg-neutral-50 md:grid",
        dir === "left" ? "-left-3" : "-right-3",
      )}
    >
      {dir === "left" ? (
        <ChevronLeftIcon className="size-5" />
      ) : (
        <ChevronRightIcon className="size-5" />
      )}
    </button>
  );
}
