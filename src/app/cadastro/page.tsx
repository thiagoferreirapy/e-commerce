"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { useCartStore } from "@/store/cart";
import { useWishlistStore } from "@/store/wishlist";
import { toast } from "@/store/toast";
import { AuthShell } from "@/components/auth/AuthShell";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function RegisterPage() {
  const router = useRouter();
  const register = useAuthStore((s) => s.register);
  const mergeCart = useCartStore((s) => s.mergeOnLogin);
  const mergeWish = useWishlistStore((s) => s.mergeOnLogin);
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function validate() {
    const e: Record<string, string> = {};
    if (form.name.trim().length < 3) e.name = "Informe seu nome completo.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "E-mail inválido.";
    if (form.password.length < 8 || !/[0-9]/.test(form.password))
      e.password = "Mínimo de 8 caracteres, com ao menos um número.";
    if (form.confirm !== form.password) e.confirm = "As senhas não conferem.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      await Promise.all([mergeCart(), mergeWish()]);
      toast.success("Cadastro criado com sucesso!");
      router.push("/conta");
    } catch (err) {
      setErrors({ email: err instanceof Error ? err.message : "Falha no cadastro." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Criar conta"
      subtitle="É rápido. Ganhe 10% OFF na primeira compra com o cupom BEMVINDO."
      footer={
        <>
          Já tem conta?{" "}
          <Link href="/login" className="font-semibold text-flame hover:underline">
            Entrar
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Input
          label="Nome completo"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          error={errors.name}
          placeholder="Seu nome"
        />
        <Input
          label="E-mail"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          error={errors.email}
          placeholder="seu@email.com"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Senha"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            error={errors.password}
            placeholder="••••••••"
          />
          <Input
            label="Confirmar senha"
            type="password"
            value={form.confirm}
            onChange={(e) => setForm({ ...form, confirm: e.target.value })}
            error={errors.confirm}
            placeholder="••••••••"
          />
        </div>
        <Button type="submit" fullWidth size="lg" loading={loading}>
          Criar minha conta
        </Button>
        <p className="text-center text-xs leading-relaxed text-neutral-500">
          Ao criar sua conta, você concorda com os{" "}
          <Link href="/termos-de-uso" className="font-medium text-flame hover:underline">
            Termos de Uso
          </Link>{" "}
          e a{" "}
          <Link
            href="/politica-de-privacidade"
            className="font-medium text-flame hover:underline"
          >
            Política de Privacidade
          </Link>
          .
        </p>
      </form>
    </AuthShell>
  );
}
