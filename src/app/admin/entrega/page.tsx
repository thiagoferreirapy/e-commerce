"use client";

import { useEffect, useState } from "react";
import {
  createShippingMethod,
  deleteShippingMethod,
  listShippingMethods,
  updateShippingMethod,
  type ShippingMethodRow,
  type ShippingMethodInput,
} from "@/services/admin";
import { toast } from "@/store/toast";
import { formatBRL } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Drawer";

const empty: ShippingMethodInput = {
  name: "",
  price: 0,
  etaDays: 3,
  freeAbove: null,
  active: true,
  position: 0,
};

export default function AdminShippingPage() {
  const [methods, setMethods] = useState<ShippingMethodRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; editing: ShippingMethodRow | null }>({
    open: false,
    editing: null,
  });

  function load() {
    setLoading(true);
    listShippingMethods()
      .then(setMethods)
      .catch(() => toast.error("Erro ao carregar métodos de entrega."))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function remove(m: ShippingMethodRow) {
    if (!confirm(`Excluir o método "${m.name}"?`)) return;
    try {
      await deleteShippingMethod(m.id);
      toast.success("Método removido.");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao remover.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-ink">
          Métodos de entrega <span className="text-neutral-400">({methods.length})</span>
        </h2>
        <Button onClick={() => setModal({ open: true, editing: null })}>Novo método</Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-400">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Preço</th>
              <th className="px-4 py-3">Prazo</th>
              <th className="px-4 py-3">Grátis acima de</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Posição</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-neutral-400">Carregando…</td>
              </tr>
            ) : methods.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-neutral-400">Nenhum método.</td>
              </tr>
            ) : (
              methods.map((m) => (
                <tr key={m.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3 font-semibold text-ink">{m.name}</td>
                  <td className="px-4 py-3 text-neutral-600">{formatBRL(m.price)}</td>
                  <td className="px-4 py-3 text-neutral-600">{m.etaDays} dias</td>
                  <td className="px-4 py-3 text-neutral-600">
                    {m.freeAbove != null ? formatBRL(m.freeAbove) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {m.active ? (
                      <Badge tone="success">Ativo</Badge>
                    ) : (
                      <span className="text-xs text-neutral-400">Inativo</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{m.position}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setModal({ open: true, editing: m })}
                      className="text-sm font-semibold text-flame hover:underline"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => remove(m)}
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
        <MethodModal
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

function MethodModal({
  editing,
  onClose,
  onSaved,
}: {
  editing: ShippingMethodRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<ShippingMethodInput>(
    editing
      ? {
          name: editing.name,
          price: editing.price,
          etaDays: editing.etaDays,
          freeAbove: editing.freeAbove,
          active: editing.active,
          position: editing.position,
        }
      : { ...empty },
  );
  const [saving, setSaving] = useState(false);

  function set<K extends keyof ShippingMethodInput>(key: K, value: ShippingMethodInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save() {
    if (form.name.trim().length < 2) {
      toast.error("Informe o nome do método.");
      return;
    }
    setSaving(true);
    try {
      if (editing) await updateShippingMethod(editing.id, form);
      else await createShippingMethod(form);
      toast.success("Método salvo.");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar método.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={editing ? "Editar método" : "Novo método de entrega"}>
      <div className="space-y-3">
        <Input
          label="Nome (ex: PAC, SEDEX)"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Preço (R$)"
            type="number"
            step="0.01"
            min="0"
            value={String(form.price)}
            onChange={(e) => set("price", Number(e.target.value) || 0)}
          />
          <Input
            label="Prazo (dias úteis)"
            type="number"
            step="1"
            min="1"
            value={String(form.etaDays)}
            onChange={(e) => set("etaDays", Number(e.target.value) || 1)}
          />
        </div>
        <Input
          label="Frete grátis acima de (R$, opcional)"
          type="number"
          step="0.01"
          min="0"
          value={form.freeAbove != null ? String(form.freeAbove) : ""}
          onChange={(e) => set("freeAbove", e.target.value ? Number(e.target.value) : null)}
        />
        <Input
          label="Posição (menor aparece primeiro)"
          type="number"
          step="1"
          min="0"
          value={String(form.position)}
          onChange={(e) => set("position", Number(e.target.value) || 0)}
        />
        <label className="flex items-center gap-2 text-sm font-medium text-ink">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => set("active", e.target.checked)}
            className="size-4 rounded text-flame focus:ring-flame/30"
          />
          Ativo (aparece no checkout)
        </label>
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
