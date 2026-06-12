"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
}

export function Tabs({ items, initial }: { items: TabItem[]; initial?: string }) {
  const [active, setActive] = useState(initial ?? items[0]?.id);

  return (
    <div>
      <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-neutral-200 no-scrollbar">
        {items.map((item) => (
          <button
            key={item.id}
            role="tab"
            aria-selected={active === item.id}
            onClick={() => setActive(item.id)}
            className={cn(
              "relative whitespace-nowrap px-4 py-3 text-sm font-semibold transition-colors",
              active === item.id ? "text-flame" : "text-neutral-500 hover:text-ink",
            )}
          >
            {item.label}
            {active === item.id && (
              <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-flame" />
            )}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="py-6 animate-fade-in">
        {items.find((i) => i.id === active)?.content}
      </div>
    </div>
  );
}
