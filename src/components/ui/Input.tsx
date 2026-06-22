import { forwardRef, useId, useState } from "react";
import { cn } from "@/lib/utils";
import { EyeIcon, EyeOffIcon } from "@/components/ui/icons";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, label, error, hint, leftIcon, id, type, ...props },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  // Campos de senha ganham um botão de "ver senha" que alterna o type.
  const isPassword = type === "password";
  const [reveal, setReveal] = useState(false);
  const resolvedType = isPassword ? (reveal ? "text" : "password") : type;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-ink-700">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
            {leftIcon}
          </span>
        )}
        <input
          id={inputId}
          ref={ref}
          type={resolvedType}
          aria-invalid={!!error}
          className={cn(
            "h-11 w-full rounded-md border bg-white px-3.5 text-sm text-ink",
            "placeholder:text-neutral-400 transition-colors",
            "focus:border-flame focus:outline-none focus:ring-2 focus:ring-flame/30",
            leftIcon && "pl-10",
            isPassword && "pr-11",
            error ? "border-danger" : "border-neutral-300",
            className,
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setReveal((v) => !v)}
            aria-label={reveal ? "Ocultar senha" : "Mostrar senha"}
            aria-pressed={reveal}
            tabIndex={-1}
            className="absolute right-1 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-md text-neutral-400 transition-colors hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-flame/30"
          >
            {reveal ? <EyeOffIcon className="size-5" /> : <EyeIcon className="size-5" />}
          </button>
        )}
      </div>
      {error ? (
        <p className="mt-1 text-xs text-danger">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-neutral-500">{hint}</p>
      ) : null}
    </div>
  );
});
