"use client";

import { useState } from "react";
import { subscribeNewsletter } from "@/services/newsletter";
import { CheckIcon } from "@/components/ui/icons";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError("");
    try {
      await subscribeNewsletter(email);
      setStatus("ok");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Erro ao cadastrar.");
    }
  }

  if (status === "ok") {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-success/40 bg-success/10 px-4 py-3.5 text-sm text-white">
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-success">
          <CheckIcon className="size-4" />
        </span>
        Inscrição confirmada! Use o cupom <strong className="font-bold">BEMVINDO</strong> no
        checkout.
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full flex-col gap-2 sm:flex-row">
      <div className="flex-1">
        <label htmlFor="nl-email" className="sr-only">
          Seu e-mail
        </label>
        <input
          id="nl-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
          className="h-12 w-full rounded-md border border-white/15 bg-white/5 px-4 text-sm text-white placeholder:text-neutral-500 focus:border-flame focus:outline-none focus:ring-2 focus:ring-flame/30"
        />
        {error && <p className="mt-1 text-xs text-flame-300">{error}</p>}
      </div>
      <button
        type="submit"
        disabled={status === "loading"}
        className="h-12 shrink-0 rounded-md bg-flame px-6 text-sm font-semibold text-white transition-colors hover:bg-flame-600 disabled:opacity-60"
      >
        {status === "loading" ? "Enviando..." : "Cadastrar"}
      </button>
    </form>
  );
}
