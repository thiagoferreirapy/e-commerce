import Link from "next/link";
import { ChevronRightIcon } from "./icons";

export interface Crumb {
  label: string;
  href?: string;
}

export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Trilha de navegação" className="text-sm">
      <ol className="flex flex-wrap items-center gap-1.5 text-neutral-500">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={i} className="flex items-center gap-1.5">
              {item.href && !last ? (
                <Link href={item.href} className="hover:text-flame transition-colors">
                  {item.label}
                </Link>
              ) : (
                <span className={last ? "font-medium text-ink" : ""} aria-current={last ? "page" : undefined}>
                  {item.label}
                </span>
              )}
              {!last && <ChevronRightIcon className="size-3.5 text-neutral-300" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
