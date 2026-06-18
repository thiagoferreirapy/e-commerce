"use client";

import { useEffect, useRef, useState } from "react";
import type { Coupon, CouponScope } from "@/types";
import {
  createCoupon,
  deleteCoupon,
  listAdminCoupons,
  updateCoupon,
  listAdminProducts,
  getAdminProduct,
  type CouponInput,
} from "@/services/admin";
import { toast } from "@/store/toast";
import { formatBRL } from "@/lib/format";
import { categories, categoriesBySlug } from "@/data/categories";
import { brands } from "@/data/brands";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Drawer";

const empty: CouponInput = {
  code: "",
  type: "percent",
  value: 10,
  minSubtotal: null,
  description: "",
  scope: "all",
  scopeValue: null,
  maxUses: null,
  startsAt: null,
  expiresAt: null,
};

const brandsById = new Map(brands.map((b) => [b.id, b]));

/** Texto curto descrevendo a quem o cupom se aplica. */
function scopeLabel(c: Coupon): string {
  switch (c.scope) {
    case "category":
      return `Categoria: ${categoriesBySlug.get(c.scopeValue ?? "")?.name ?? c.scopeValue}`;
    case "brand":
      return `Marca: ${brandsById.get(c.scopeValue ?? "")?.name ?? c.scopeValue}`;
    case "product":
      return "Produto específico";
    default:
      return "Site todo";
  }
}

function usesLabel(c: Coupon): string {
  if (c.maxUses == null) return `${c.usedCount ?? 0} / ∞`;
  return `${c.usedCount ?? 0} / ${c.maxUses}`;
}

const dateFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
function validityLabel(c: Coupon): string {
  const s = c.startsAt ? dateFmt.format(new Date(c.startsAt)) : null;
  const e = c.expiresAt ? dateFmt.format(new Date(c.expiresAt)) : null;
  if (!s && !e) return "—";
  return `${s ?? "…"} → ${e ?? "…"}`;
}

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
              <th className="px-4 py-3">Aplicável a</th>
              <th className="px-4 py-3">Mínimo</th>
              <th className="px-4 py-3">Usos</th>
              <th className="px-4 py-3">Validade</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-neutral-400">Carregando…</td>
              </tr>
            ) : coupons.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-neutral-400">Nenhum cupom.</td>
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
                  <td className="px-4 py-3 text-neutral-600">{scopeLabel(c)}</td>
                  <td className="px-4 py-3 text-neutral-600">
                    {c.minSubtotal ? formatBRL(c.minSubtotal) : "—"}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{usesLabel(c)}</td>
                  <td className="px-4 py-3 text-neutral-600">{validityLabel(c)}</td>
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

const selectClass =
  "h-11 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm focus:border-flame focus:outline-none focus:ring-2 focus:ring-flame/30";

/** ISO -> valor de <input type="datetime-local"> (hora local, sem timezone). */
function toLocalInput(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
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
          scope: editing.scope,
          scopeValue: editing.scopeValue ?? null,
          maxUses: editing.maxUses ?? null,
          startsAt: editing.startsAt ?? null,
          expiresAt: editing.expiresAt ?? null,
        }
      : { ...empty },
  );
  const [saving, setSaving] = useState(false);

  function set<K extends keyof CouponInput>(key: K, value: CouponInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function changeScope(scope: CouponScope) {
    // Troca de escopo zera o valor selecionado anterior.
    setForm((f) => ({ ...f, scope, scopeValue: scope === "all" ? null : "" }));
  }

  async function save() {
    if (form.code.length < 3 || form.description.length < 3) {
      toast.error("Preencha código e descrição.");
      return;
    }
    if (form.scope !== "all" && !form.scopeValue) {
      toast.error("Selecione a categoria, marca ou produto do cupom.");
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
          onChange={(e) => set("code", e.target.value.toUpperCase())}
        />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-700">Tipo</label>
            <select
              value={form.type}
              onChange={(e) => set("type", e.target.value as "percent" | "fixed")}
              className={selectClass}
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
            onChange={(e) => set("value", Number(e.target.value))}
          />
        </div>

        {/* Escopo */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-700">Aplicável a</label>
          <select
            value={form.scope}
            onChange={(e) => changeScope(e.target.value as CouponScope)}
            className={selectClass}
          >
            <option value="all">Site todo (qualquer item)</option>
            <option value="category">Uma categoria</option>
            <option value="brand">Uma marca</option>
            <option value="product">Um produto específico</option>
          </select>
        </div>

        {form.scope === "category" && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-700">Categoria</label>
            <select
              value={form.scopeValue ?? ""}
              onChange={(e) => set("scopeValue", e.target.value || null)}
              className={selectClass}
            >
              <option value="">— selecione —</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.parentSlug ? `  ↳ ${c.name}` : c.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-neutral-500">
              Escolher uma categoria-raiz cobre todas as subcategorias dela.
            </p>
          </div>
        )}

        {form.scope === "brand" && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-700">Marca</label>
            <select
              value={form.scopeValue ?? ""}
              onChange={(e) => set("scopeValue", e.target.value || null)}
              className={selectClass}
            >
              <option value="">— selecione —</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {form.scope === "product" && (
          <ProductPicker value={form.scopeValue ?? null} onChange={(id) => set("scopeValue", id)} />
        )}

        <Input
          label="Subtotal mínimo (R$, opcional)"
          type="number"
          step="0.01"
          value={form.minSubtotal != null ? String(form.minSubtotal) : ""}
          onChange={(e) => set("minSubtotal", e.target.value ? Number(e.target.value) : null)}
        />

        <Input
          label="Limite de usos (opcional, vazio = ilimitado)"
          type="number"
          min="1"
          step="1"
          value={form.maxUses != null ? String(form.maxUses) : ""}
          onChange={(e) => set("maxUses", e.target.value ? Number(e.target.value) : null)}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Início (opcional)"
            type="datetime-local"
            value={toLocalInput(form.startsAt)}
            onChange={(e) =>
              set("startsAt", e.target.value ? new Date(e.target.value).toISOString() : null)
            }
          />
          <Input
            label="Expira em (opcional)"
            type="datetime-local"
            value={toLocalInput(form.expiresAt)}
            onChange={(e) =>
              set("expiresAt", e.target.value ? new Date(e.target.value).toISOString() : null)
            }
          />
        </div>

        <Input
          label="Descrição"
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
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

/** Busca um produto por nome e devolve o id selecionado. */
function ProductPicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (id: string | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ id: string; name: string }[]>([]);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Ao abrir com um produto já selecionado, busca o nome para exibir.
  useEffect(() => {
    if (value && !selectedName) {
      getAdminProduct(value)
        .then((p) => setSelectedName(p.name))
        .catch(() => setSelectedName(null));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  function onQueryChange(q: string) {
    setQuery(q);
    if (timer.current) clearTimeout(timer.current);
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    timer.current = setTimeout(() => {
      listAdminProducts({ q: q.trim(), pageSize: 8 })
        .then((page) => setResults(page.items.map((i) => ({ id: i.id, name: i.name }))))
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 300);
  }

  function pick(p: { id: string; name: string }) {
    onChange(p.id);
    setSelectedName(p.name);
    setQuery("");
    setResults([]);
  }

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-ink-700">Produto</label>
      {value && (
        <div className="mb-2 flex items-center justify-between rounded-md border border-flame/40 bg-flame-50 px-3 py-2 text-sm">
          <span className="font-medium text-ink">{selectedName ?? "Produto selecionado"}</span>
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setSelectedName(null);
            }}
            className="text-xs font-semibold text-neutral-500 hover:text-danger"
          >
            Trocar
          </button>
        </div>
      )}
      {!value && (
        <>
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Buscar produto por nome…"
            className="h-11 w-full rounded-md border border-neutral-300 px-3 text-sm focus:border-flame focus:outline-none focus:ring-2 focus:ring-flame/30"
          />
          {searching && <p className="mt-1 text-xs text-neutral-400">Buscando…</p>}
          {results.length > 0 && (
            <ul className="mt-1.5 max-h-44 overflow-y-auto rounded-md border border-neutral-200">
              {results.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => pick(p)}
                    className="block w-full px-3 py-2 text-left text-sm hover:bg-neutral-50"
                  >
                    {p.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
