import Link from "next/link";
import { ChevronRightIcon } from "./icons";

export function SectionHeading({
  eyebrow,
  title,
  description,
  href,
  hrefLabel = "Ver tudo",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  href?: string;
  hrefLabel?: string;
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="eyebrow mb-1.5">{eyebrow}</p>}
        <h2 className="text-2xl font-bold tracking-tight text-ink md:text-3xl">{title}</h2>
        {description && <p className="mt-1.5 text-sm text-neutral-500">{description}</p>}
      </div>
      {href && (
        <Link
          href={href}
          className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-flame hover:gap-2 transition-all sm:inline-flex"
        >
          {hrefLabel}
          <ChevronRightIcon className="size-4" />
        </Link>
      )}
    </div>
  );
}
