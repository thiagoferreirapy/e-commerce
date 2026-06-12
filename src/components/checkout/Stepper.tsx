import { cn } from "@/lib/utils";
import { CheckIcon } from "@/components/ui/icons";

export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="flex items-center gap-2">
      {steps.map((label, i) => {
        const n = i + 1;
        const done = n < current;
        const active = n === current;
        return (
          <li key={label} className="flex flex-1 items-center gap-2 last:flex-none">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold transition-colors",
                  done && "bg-success text-white",
                  active && "bg-flame text-white",
                  !done && !active && "bg-neutral-200 text-neutral-500",
                )}
              >
                {done ? <CheckIcon className="size-4" /> : n}
              </span>
              <span
                className={cn(
                  "hidden text-sm font-medium sm:block",
                  active ? "text-ink" : "text-neutral-400",
                )}
              >
                {label}
              </span>
            </div>
            {n < steps.length && (
              <span
                className={cn(
                  "h-px flex-1",
                  done ? "bg-success" : "bg-neutral-200",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
