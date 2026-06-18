"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  createBrand,
  deleteBrand,
  listAdminBrands,
  updateBrand,
  type AdminBrandRow,
  type BrandInput,
} from "@/services/admin";
import { toast } from "@/store/toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Drawer";

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<AdminBrandRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; editing: AdminBrandRow | null }>({
    open: false,
    editing: null,
  });

  function load() {
    setLoading(true);
    listAdminBrands()
      .then(setBrands)
      .catch(() => toast.error("Erro ao carregar marcas."))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function remove(b: AdminBrandRow) {
    if (!confirm(`Excluir a marca "${b.name}"?`)) return;
    try {
      await deleteBrand(b.id);
      toast.success("Marca removida.");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao remover.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-ink">
          Marcas <span className="text-neutral-400">({brands.length})</span>
        </h2>
        <Button onClick={() => setModal({ open: true, editing: null })}>Nova marca</Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-400">
            <tr>
              <th className="px-4 py-3">Logo</th>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Produtos</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-neutral-400">Carregando…</td>
              </tr>
            ) : brands.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-neutral-400">Nenhuma marca.</td>
              </tr>
            ) : (
              brands.map((b) => (
                <tr key={b.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <span className="relative block h-7 w-16">
                      <Image src={b.logoUrl} alt={b.name} fill className="object-contain" unoptimized />
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-ink">{b.name}</td>
                  <td className="px-4 py-3 text-neutral-500">{b.slug}</td>
                  <td className="px-4 py-3 text-neutral-600">{b.productCount}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setModal({ open: true, editing: b })}
                      className="text-sm font-semibold text-flame hover:underline"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => remove(b)}
                      className="ml-3 text-sm font-semibold text-danger hover:underline disabled:opacity-40"
                      disabled={b.productCount > 0}
                      title={b.productCount > 0 ? "Há produtos vinculados a esta marca." : undefined}
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
        <BrandModal
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

function BrandModal({
  editing,
  onClose,
  onSaved,
}: {
  editing: AdminBrandRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<BrandInput>(
    editing
      ? { name: editing.name, slug: editing.slug, logoUrl: editing.logoUrl }
      : { name: "", slug: "", logoUrl: "" },
  );
  const [slugTouched, setSlugTouched] = useState(!!editing);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (form.name.trim().length < 2 || form.slug.trim().length < 2) {
      toast.error("Preencha nome e slug.");
      return;
    }
    setSaving(true);
    try {
      if (editing) await updateBrand(editing.id, form);
      else await createBrand(form);
      toast.success("Marca salva.");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar marca.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={editing ? "Editar marca" : "Nova marca"}>
      <div className="space-y-3">
        <Input
          label="Nome"
          value={form.name}
          onChange={(e) => {
            const name = e.target.value;
            setForm((f) => ({ ...f, name, slug: slugTouched ? f.slug : slugify(name) }));
          }}
        />
        <Input
          label="Slug"
          value={form.slug}
          onChange={(e) => {
            setSlugTouched(true);
            setForm((f) => ({ ...f, slug: slugify(e.target.value) }));
          }}
        />
        <Input
          label="URL do logo (opcional)"
          value={form.logoUrl ?? ""}
          placeholder="https://… (vazio gera um logo padrão)"
          onChange={(e) => setForm((f) => ({ ...f, logoUrl: e.target.value || null }))}
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
