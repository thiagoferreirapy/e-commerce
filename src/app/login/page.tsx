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

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const mergeCart = useCartStore((s) => s.mergeOnLogin);
  const mergeWish = useWishlistStore((s) => s.mergeOnLogin);
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  function validate() {
    const e: typeof errors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "E-mail inválido.";
    if (form.password.length < 6) e.password = "Mínimo de 6 caracteres.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await login(form.email, form.password);
      // Mescla carrinho/favoritos do visitante no servidor (uma única vez).
      await Promise.all([mergeCart(), mergeWish()]);
      toast.success("Bem-vindo de volta!");
      router.push("/conta");
    } catch (err) {
      setErrors({ password: err instanceof Error ? err.message : "Falha no login." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Entrar na sua conta"
      subtitle="Acesse seus pedidos, favoritos e endereços."
      footer={
        <>
          Ainda não tem conta?{" "}
          <Link href="/cadastro" className="font-semibold text-flame hover:underline">
            Criar cadastro
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Input
          label="E-mail"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          error={errors.email}
          placeholder="seu@email.com"
        />
        <Input
          label="Senha"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          error={errors.password}
          placeholder="••••••••"
        />
        <div className="flex justify-end">
          <Link href="/recuperar-senha" className="text-sm text-flame hover:underline">
            Esqueci minha senha
          </Link>
        </div>
        <Button type="submit" fullWidth size="lg" loading={loading}>
          Entrar
        </Button>
      </form>
    </AuthShell>
  );
}
