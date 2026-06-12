"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

/** Galeria com thumbnails + imagem principal e zoom no hover (desktop). */
export function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");

  const current = images[active] ?? images[0];

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setOrigin(`${x}% ${y}%`);
  }

  return (
    <div className="flex flex-col-reverse gap-3 md:flex-row">
      {/* Thumbnails */}
      <div className="flex gap-3 md:flex-col">
        {images.map((src, i) => (
          <button
            key={i}
            onMouseEnter={() => setActive(i)}
            onClick={() => setActive(i)}
            aria-label={`Ver imagem ${i + 1}`}
            className={cn(
              "relative size-16 shrink-0 overflow-hidden rounded-md border bg-neutral-100 transition-colors md:size-20",
              i === active ? "border-flame" : "border-neutral-200 hover:border-neutral-400",
            )}
          >
            <Image src={src} alt="" fill sizes="80px" className="object-cover" />
          </button>
        ))}
      </div>

      {/* Imagem principal */}
      <div
        className="relative aspect-square flex-1 overflow-hidden rounded-xl border border-neutral-200 bg-white"
        onMouseEnter={() => setZoom(true)}
        onMouseLeave={() => setZoom(false)}
        onMouseMove={onMove}
      >
        <Image
          src={current}
          alt={alt}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          className={cn(
            "object-cover transition-transform duration-200",
            zoom ? "scale-[1.8]" : "scale-100",
          )}
          style={{ transformOrigin: origin }}
        />
      </div>
    </div>
  );
}
