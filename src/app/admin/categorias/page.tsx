"use client";

import { useEffect, useState } from "react";
import {
  createCategory,
  deleteCategory,
  listAdminCategories,
  updateCategory,
  type AdminCategoryRow,
  type CategoryInput,
} from "@/services/admin";
import { toast } from "@/store/toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Drawer";

const selectClass =
  "h-11 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm focus:border-flame focus:outline-none focus:ring-2 focus:ring-flame/30";

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export default function AdminCategoriesPage() {
  const [cats, setCats] = useState<AdminCategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; editing: AdminCategoryRow | null }>({
    open: false,
    editing: null,
  });
  const [subParent, setSubParent] = useState(""); // "" = todas

  function load() {
    setLoading(true);
    listAdminCategories()
      .then(setCats)
      .catch(() => toast.error("Erro ao carregar categorias."))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function remove(c: AdminCategoryRow) {
    if (!confirm(`Excluir a categoria "${c.name}"?`)) return;
    try {
      await deleteCategory(c.id);
      toast.success("Categoria removida.");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao remover.");
    }
  }

  const nameBySlug = new Map(cats.map((c) => [c.slug, c.name]));
  const roots = cats.filter((c) => !c.parentSlug);
  const subcats = cats.filter((c) => c.parentSlug);
  // Raízes que realmente têm subcategorias (opções do filtro).
  const parentsWithSubs = roots.filter((r) => r.subcategoryCount > 0);
  const filteredSubcats = subParent ? subcats.filter((c) => c.parentSlug === subParent) : subcats;

  function openEdit(c: AdminCategoryRow) {
    setModal({ open: true, editing: c });
  }

  // Célula de ações reutilizada nas duas tabelas.
  function Actions({ c }: { c: AdminCategoryRow }) {
    const blocked = c.productCount > 0 || c.subcategoryCount > 0;
    return (
      <td className="px-4 py-3 text-right">
        <button
          onClick={() => openEdit(c)}
          className="text-sm font-semibold text-flame hover:underline"
        >
          Editar
        </button>
        <button
          onClick={() => remove(c)}
          className="ml-3 text-sm font-semibold text-danger hover:underline disabled:opacity-40"
          disabled={blocked}
          title={blocked ? "Há produtos ou subcategorias vinculados." : undefined}
        >
          Excluir
        </button>
      </td>
    );
  }

  return (
    <div className="space-y-8">
      {/* Categorias-raiz */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink">
            Categorias <span className="text-neutral-400">({roots.length})</span>
          </h2>
          <Button onClick={() => setModal({ open: true, editing: null })}>Nova categoria</Button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-400">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Destaque</th>
                <th className="px-4 py-3">Posição</th>
                <th className="px-4 py-3">Produtos</th>
                <th className="px-4 py-3">Subcategorias</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-neutral-400">Carregando…</td>
                </tr>
              ) : roots.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-neutral-400">Nenhuma categoria.</td>
                </tr>
              ) : (
                roots.map((c) => (
                  <tr key={c.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 font-semibold text-ink">{c.name}</td>
                    <td className="px-4 py-3">
                      {c.featured ? (
                        <span className="text-flame" title="Destaque no header">★</span>
                      ) : (
                        <span className="text-neutral-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {c.featured ? c.position : <span className="text-neutral-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">{c.productCount}</td>
                    <td className="px-4 py-3 text-neutral-600">{c.subcategoryCount}</td>
                    <Actions c={c} />
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Subcategorias */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-ink">
            Subcategorias <span className="text-neutral-400">({filteredSubcats.length})</span>
          </h2>
          <label className="flex items-center gap-2 text-sm text-neutral-600">
            Filtrar por categoria-pai:
            <select
              value={subParent}
              onChange={(e) => setSubParent(e.target.value)}
              className="h-10 rounded-md border border-neutral-300 bg-white px-3 text-sm focus:border-flame focus:outline-none focus:ring-2 focus:ring-flame/30"
            >
              <option value="">Todas</option>
              {parentsWithSubs.map((r) => (
                <option key={r.slug} value={r.slug}>
                  {r.name} ({r.subcategoryCount})
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-400">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Categoria-pai</th>
                <th className="px-4 py-3">Destaque</th>
                <th className="px-4 py-3">Posição</th>
                <th className="px-4 py-3">Produtos</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-neutral-400">Carregando…</td>
                </tr>
              ) : filteredSubcats.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-neutral-400">
                    {subParent ? "Nenhuma subcategoria nessa categoria." : "Nenhuma subcategoria."}
                  </td>
                </tr>
              ) : (
                filteredSubcats.map((c) => (
                  <tr key={c.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 font-semibold text-ink">{c.name}</td>
                    <td className="px-4 py-3 text-neutral-600">
                      {nameBySlug.get(c.parentSlug ?? "") ?? c.parentSlug}
                    </td>
                    <td className="px-4 py-3">
                      {c.featured ? (
                        <span className="text-flame" title="Destaque no menu da categoria-pai">★</span>
                      ) : (
                        <span className="text-neutral-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {c.featured ? c.position : <span className="text-neutral-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">{c.productCount}</td>
                    <Actions c={c} />
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {modal.open && (
        <CategoryModal
          editing={modal.editing}
          categories={cats}
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

function CategoryModal({
  editing,
  categories,
  onClose,
  onSaved,
}: {
  editing: AdminCategoryRow | null;
  categories: AdminCategoryRow[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<CategoryInput>(
    editing
      ? {
          name: editing.name,
          slug: editing.slug,
          parentSlug: editing.parentSlug,
          imageUrl: editing.imageUrl,
          description: editing.description,
          featured: editing.featured ?? false,
          position: editing.position ?? 0,
        }
      : { name: "", slug: "", parentSlug: null, imageUrl: "", description: "", featured: false, position: 0 },
  );
  const [slugTouched, setSlugTouched] = useState(!!editing);
  const [saving, setSaving] = useState(false);

  // Não permite escolher a si mesma como pai.
  const parentOptions = categories.filter((c) => !c.parentSlug && c.id !== editing?.id);

  const isRoot = !form.parentSlug;

  // Posição prevista ao destacar = (qtd. de irmãos já destacados) + 1.
  // O servidor renumera de forma definitiva ao salvar, então isto é só a prévia.
  function nextFeaturedPosition(parentSlug: string | null): number {
    const count = categories.filter(
      (c) => (c.parentSlug ?? null) === parentSlug && c.featured && c.id !== editing?.id,
    ).length;
    return count + 1;
  }

  function toggleFeatured(checked: boolean) {
    setForm((f) => ({
      ...f,
      featured: checked,
      // Mantém a posição atual se já tinha; senão, entra no fim. Desmarcou -> 0.
      position: checked ? (f.position > 0 ? f.position : nextFeaturedPosition(f.parentSlug ?? null)) : 0,
    }));
  }

  async function save() {
    if (form.name.trim().length < 2 || form.slug.trim().length < 2) {
      toast.error("Preencha nome e slug.");
      return;
    }
    setSaving(true);
    try {
      if (editing) await updateCategory(editing.id, form);
      else await createCategory(form);
      toast.success("Categoria salva.");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar categoria.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={editing ? "Editar categoria" : "Nova categoria"}>
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
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-700">Categoria-pai (opcional)</label>
          <select
            value={form.parentSlug ?? ""}
            onChange={(e) => {
              const parentSlug = e.target.value || null;
              // Mudou de escopo: se estava destacada, recoloca no fim do novo escopo.
              setForm((f) => ({
                ...f,
                parentSlug,
                position: f.featured ? nextFeaturedPosition(parentSlug) : f.position,
              }));
            }}
            className={selectClass}
          >
            <option value="">— nenhuma (categoria-raiz) —</option>
            {parentOptions.map((r) => (
              <option key={r.slug} value={r.slug}>
                {r.name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-neutral-500">
            Selecionar um pai transforma esta em subcategoria.
          </p>
        </div>
        <Input
          label="URL da imagem (opcional)"
          value={form.imageUrl ?? ""}
          placeholder="https://… (vazio gera uma imagem padrão)"
          onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value || null }))}
        />
        <Input
          label="Descrição (opcional)"
          value={form.description ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value || null }))}
        />

        {/* Destaque + posição (mesma lógica para raiz e subcategoria) */}
        <div className="rounded-md border border-neutral-200 bg-neutral-50 p-3">
          <label className="flex items-center gap-2 text-sm font-medium text-ink">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => toggleFeatured(e.target.checked)}
              className="size-4 rounded text-flame focus:ring-flame/30"
            />
            {isRoot ? "Destacar no header" : "Destacar no menu da categoria-pai"}
          </label>
          {form.featured && (
            <p className="mt-2 text-xs text-neutral-600">
              Aparecerá na <strong className="text-flame">posição {form.position}</strong>{" "}
              {isRoot ? "do header" : "dentro da categoria-pai"}.
            </p>
          )}
        </div>

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
