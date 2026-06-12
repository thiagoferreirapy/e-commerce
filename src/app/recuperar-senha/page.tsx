"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { forgotPassword, resetPassword } from "@/services/auth";
import { toast } from "@/store/toast";
import { AuthShell } from "@/components/auth/AuthShell";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { CheckIcon } from "@/components/ui/icons";

type Phase = "request" | "sent" | "reset";

export default function RecoverPasswordPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("request");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function requestReset(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("E-mail inválido.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await forgotPassword(email);
      // Em desenvolvimento a API retorna um token de teste para concluir o fluxo.
      if (res.devToken) {
        setToken(res.devToken);
        setPhase("reset");
      } else {
        setPhase("sent");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao solicitar recuperação.");
    } finally {
      setLoading(false);
    }
  }

  async function doReset(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8 || !/[0-9]/.test(password)) {
      setError("A senha deve ter ao menos 8 caracteres e um número.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await resetPassword(token, password);
      toast.success("Senha redefinida! Faça login.");
      router.push("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível redefinir a senha.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title={phase === "reset" ? "Definir nova senha" : "Recuperar senha"}
      subtitle={
        phase === "request"
          ? "Enviaremos um link de redefinição para o seu e-mail."
          : phase === "reset"
            ? "Escolha uma nova senha para a sua conta."
            : undefined
      }
      footer={
        <Link href="/login" className="font-semibold text-flame hover:underline">
          Voltar ao login
        </Link>
      }
    >
      {phase === "sent" && (
        <div className="flex items-start gap-3 rounded-lg border border-success/40 bg-success-soft p-4 text-sm text-ink">
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-success text-white">
            <CheckIcon className="size-4" />
          </span>
          <p>
            Se existir uma conta para <strong>{email}</strong>, você receberá um link para
            redefinir sua senha em instantes.
          </p>
        </div>
      )}

      {phase === "request" && (
        <form onSubmit={requestReset} className="space-y-4">
          <Input
            label="E-mail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={error}
            placeholder="seu@email.com"
          />
          <Button type="submit" fullWidth size="lg" loading={loading}>
            Enviar link de recuperação
          </Button>
        </form>
      )}

      {phase === "reset" && (
        <form onSubmit={doReset} className="space-y-4">
          <Input
            label="Nova senha"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={error}
            hint="Mínimo 8 caracteres, com ao menos um número."
            placeholder="••••••••"
          />
          <Button type="submit" fullWidth size="lg" loading={loading}>
            Redefinir senha
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
