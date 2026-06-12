"use client";

import { useState } from "react";
import { toast } from "@/store/toast";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { CheckIcon } from "@/components/ui/icons";

const AREAS = ["Atendimento", "Vendas / Loja", "Logística", "Marketing", "Tecnologia", "Outra"];

export function JobApplicationForm() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", area: AREAS[0], message: "" });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast.error("Preencha nome e um e-mail válido.");
      return;
    }
    setLoading(true);
    // Mock de envio (sem backend de RH). Em produção, integraria com um ATS/e-mail.
    setTimeout(() => {
      setLoading(false);
      setSent(true);
    }, 700);
  }

  if (sent) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-success/40 bg-success-soft p-5 text-sm text-ink">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-success text-white">
          <CheckIcon className="size-4" />
        </span>
        <div>
          <p className="font-semibold">Candidatura enviada!</p>
          <p className="mt-1 text-neutral-600">
            Obrigado pelo interesse, {form.name.split(" ")[0]}. Nosso time vai analisar seu perfil e
            entrar em contato se houver uma vaga compatível.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl border border-neutral-200 bg-white p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Nome completo" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input label="E-mail" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Input label="Telefone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-700">Área de interesse</label>
          <select
            value={form.area}
            onChange={(e) => setForm({ ...form, area: e.target.value })}
            className="h-11 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm focus:border-flame focus:outline-none focus:ring-2 focus:ring-flame/30"
          >
            {AREAS.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink-700">Conte um pouco sobre você</label>
        <textarea
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          className="h-28 w-full rounded-md border border-neutral-300 p-3 text-sm focus:border-flame focus:outline-none focus:ring-2 focus:ring-flame/30"
          placeholder="Experiência, disponibilidade, link do LinkedIn…"
        />
      </div>
      <Button type="submit" size="lg" loading={loading}>
        Enviar candidatura
      </Button>
    </form>
  );
}
