"use client";

import { useEffect, useState } from "react";
import type { Coupon } from "@/types";
import {
  createCoupon,
  deleteCoupon,
  listAdminCoupons,
  updateCoupon,
  type CouponInput,
} from "@/services/admin";
import { toast } from "@/store/toast";
import { formatBRL } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Drawer";

const empty: CouponInput = { code: "", type: "percent", value: 10, minSubtotal: null, description: "" };

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; editing: Coupon | null }>({
    open: false,
    editing: null,
  });

  function load() {
    setLoading(true);
    listAdminCoupons()
      .then(setCoupons)
      .catch(() => toast.error("Erro ao carregar cupons."))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function remove(code: string) {
    try {
      await deleteCoupon(code);
      toast.success("Cupom removido.");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao remover.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-ink">
          Cupons <span className="text-neutral-400">({coupons.length})</span>
        </h2>
        <Button onClick={() => setModal({ open: true, editing: null })}>Novo cupom</Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-400">
            <tr>
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Desconto</th>
              <th className="px-4 py-3">Mínimo</th>
              <th className="px-4 py-3">Descrição</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-neutral-400">Carregando…</td>
              </tr>
            ) : coupons.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-neutral-400">Nenhum cupom.</td>
              </tr>
            ) : (
              coupons.map((c) => (
                <tr key={c.code} className="hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <Badge tone="ink">{c.code}</Badge>
                  </td>
                  <td className="px-4 py-3 font-semibold text-ink">
                    {c.type === "percent" ? `${c.value}%` : formatBRL(c.value)}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {c.minSubtotal ? formatBRL(c.minSubtotal) : "—"}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{c.description}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setModal({ open: true, editing: c })}
                      className="text-sm font-semibold text-flame hover:underline"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => remove(c.code)}
                      className="ml-3 text-sm font-semibold text-danger hover:underline"
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modal.open && (
        <CouponModal
          editing={modal.editing}
          onClose={() => setModal({ open: false, editing: null })}
          onSaved={() => {
            setModal({ open: false, editing: null });
            load();
          }}
        />
      )}
    </div>
  );
}

function CouponModal({
  editing,
  onClose,
  onSaved,
}: {
  editing: Coupon | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<CouponInput>(
    editing
      ? {
          code: editing.code,
          type: editing.type,
          value: editing.value,
          minSubtotal: editing.minSubtotal ?? null,
          description: editing.description,
        }
      : { ...empty },
  );
  const [saving, setSaving] = useState(false);

  async function save() {
    if (form.code.length < 3 || form.description.length < 3) {
      toast.error("Preencha código e descrição.");
      return;
    }
    setSaving(true);
    try {
      if (editing) await updateCoupon(editing.code, form);
      else await createCoupon(form);
      toast.success("Cupom salvo.");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar cupom.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={editing ? "Editar cupom" : "Novo cupom"}>
      <div className="space-y-3">
        <Input
          label="Código"
          value={form.code}
          disabled={!!editing}
          onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
        />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-700">Tipo</label>
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as "percent" | "fixed" })}
            className="h-11 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm focus:border-flame focus:outline-none focus:ring-2 focus:ring-flame/30"
          >
            <option value="percent">Percentual (%)</option>
            <option value="fixed">Valor fixo (R$)</option>
          </select>
        </div>
        <Input
          label={form.type === "percent" ? "Valor (%)" : "Valor (R$)"}
          type="number"
          step="0.01"
          value={String(form.value)}
          onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
        />
        <Input
          label="Subtotal mínimo (R$, opcional)"
          type="number"
          step="0.01"
          value={form.minSubtotal != null ? String(form.minSubtotal) : ""}
          onChange={(e) =>
            setForm({ ...form, minSubtotal: e.target.value ? Number(e.target.value) : null })
          }
        />
        <Input
          label="Descrição"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <div className="flex gap-2 pt-2">
          <Button fullWidth loading={saving} onClick={save}>
            Salvar
          </Button>
          <Button fullWidth variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
