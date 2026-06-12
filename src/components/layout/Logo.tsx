import Link from "next/link";
import { cn } from "@/lib/utils";

/** Logotipo tipográfico da marca. */
export function Logo({ className, light }: { className?: string; light?: boolean }) {
  return (
    <Link href="/" aria-label="TORQUE — página inicial" className={cn("group flex items-center", className)}>
      <span
        className={cn(
          "font-display text-2xl font-extrabold tracking-tight",
          light ? "text-white" : "text-ink",
        )}
      >
        TOR<span className="text-flame">Q</span>UE
      </span>
      <span className="ml-1 mt-2 hidden h-1.5 w-1.5 rounded-full bg-flame sm:block" />
    </Link>
  );
}
