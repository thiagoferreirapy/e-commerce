import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

/** Estado vazio amigável. */
export function EmptyState({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: { label: string; href: string };
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-white px-6 py-16 text-center">
      {icon && <div className="mb-4 text-neutral-300">{icon}</div>}
      <h3 className="text-lg font-bold text-ink">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-neutral-500">{description}</p>
      )}
      {action && (
        <Link
          href={action.href}
          className={cn(
            "mt-6 inline-flex h-11 items-center justify-center rounded-md bg-flame px-5 text-sm font-semibold text-white",
            "transition-colors hover:bg-flame-600",
          )}
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}

/** Estado de erro com possibilidade de tentar novamente. */
export function ErrorState({
  message = "Algo deu errado ao carregar.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-danger/30 bg-danger-soft px-6 py-12 text-center">
      <h3 className="text-base font-bold text-danger">Ops!</h3>
      <p className="mt-1 text-sm text-ink-700">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          Tentar novamente
        </Button>
      )}
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-12 text-neutral-500">
      <span className="size-6 animate-spin rounded-full border-2 border-neutral-300 border-t-flame" />
      {label && <span className="text-sm">{label}</span>}
    </div>
  );
}
