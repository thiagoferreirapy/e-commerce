"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Product, ProductTag } from "@/types";
import {
  createProduct,
  updateProduct,
  uploadProductImage,
  listAdminBrands,
  listAdminCategories,
  type ProductInput,
  type ProductVariantInput,
} from "@/services/admin";
import { toast } from "@/store/toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PlusIcon, TrashIcon } from "@/components/ui/icons";

const ALL_TAGS: ProductTag[] = ["destaque", "novidade", "mais-vendido", "oferta-do-dia", "ultimas-unidades"];

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

/** Converte o DTO de produto no formato de input do formulário. */
function fromProduct(p: Product): ProductInput {
  return {
    name: p.name,
    slug: p.slug,
    brandId: p.brandId,
    categorySlug: p.categorySlug,
    subcategorySlug: p.subcategorySlug ?? null,
    listPrice: p.listPrice,
    price: p.price,
    ref: p.ref,
    shortDescription: p.shortDescription,
    description: p.description,
    freeShipping: p.freeShipping,
    offerEndsAt: p.offerEndsAt ?? null,
    soldCount: p.soldCount,
    tags: p.tags,
    images: p.images.length ? p.images : [""],
    specs: p.specs.length ? p.specs : [{ label: "", value: "" }],
    variants: p.variants.map((v) => ({
      color: v.options.color ?? null,
      size: v.options.size ?? null,
      sku: v.sku,
      stock: v.stock,
      imageUrl: v.imageUrl ?? null,
    })),
    totalStock: p.totalStock,
  };
}

const blank: ProductInput = {
  name: "",
  slug: "",
  brandId: "",
  categorySlug: "",
  subcategorySlug: null,
  listPrice: 0,
  price: 0,
  ref: "",
  shortDescription: "",
  description: "",
  freeShipping: false,
  offerEndsAt: null,
  soldCount: 0,
  tags: [],
  images: [""],
  specs: [{ label: "", value: "" }],
  variants: [],
  totalStock: 0,
};

export function ProductForm({ product }: { product?: Product }) {
  const router = useRouter();
  const editing = !!product;
  const [form, setForm] = useState<ProductInput>(product ? fromProduct(product) : blank);
  const [slugTouched, setSlugTouched] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Marcas e categorias vêm da API (refletem o que foi cadastrado no admin).
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);
  const [categories, setCategories] = useState<
    { slug: string; name: string; parentSlug: string | null }[]
  >([]);

  useEffect(() => {
    listAdminBrands()
      .then((bs) => {
        setBrands(bs.map((b) => ({ id: b.id, name: b.name })));
        if (!editing) setForm((f) => (f.brandId ? f : { ...f, brandId: bs[0]?.id ?? "" }));
      })
      .catch(() => {});
    listAdminCategories()
      .then((cs) => {
        setCategories(cs.map((c) => ({ slug: c.slug, name: c.name, parentSlug: c.parentSlug })));
        const firstRoot = cs.find((c) => !c.parentSlug)?.slug ?? "";
        if (!editing) setForm((f) => (f.categorySlug ? f : { ...f, categorySlug: firstRoot }));
      })
      .catch(() => {});
  }, [editing]);

  const rootCategories = categories.filter((c) => !c.parentSlug);

  function set<K extends keyof ProductInput>(key: K, value: ProductInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // permite reenviar o mesmo arquivo
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await uploadProductImage(file);
      // Substitui campos vazios e adiciona a nova URL ao final.
      setForm((f) => ({ ...f, images: [...f.images.filter((x) => x.trim()), url] }));
      toast.success("Imagem enviada e salva.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao enviar imagem.");
    } finally {
      setUploading(false);
    }
  }

  const subcats = categories.filter((c) => c.parentSlug === form.categorySlug);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const payload: ProductInput = {
      ...form,
      slug: form.slug || slugify(form.name),
      images: form.images.map((i) => i.trim()).filter(Boolean),
      specs: form.specs.filter((s) => s.label.trim() && s.value.trim()),
      subcategorySlug: form.subcategorySlug || null,
      offerEndsAt: form.offerEndsAt || null,
    };
    if (!payload.images.length) {
      toast.error("Adicione ao menos uma imagem.");
      return;
    }
    setSaving(true);
    try {
      if (editing) await updateProduct(product!.id, payload);
      else await createProduct(payload);
      toast.success(editing ? "Produto atualizado." : "Produto criado.");
      router.push("/admin/produtos");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar produto.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      {/* Básico */}
      <Section title="Informações básicas">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Nome"
            value={form.name}
            onChange={(e) => {
              set("name", e.target.value);
              if (!slugTouched) set("slug", slugify(e.target.value));
            }}
            required
          />
          <Input
            label="Slug (URL)"
            value={form.slug}
            onChange={(e) => {
              setSlugTouched(true);
              set("slug", slugify(e.target.value));
            }}
            required
          />
          <Input label="REF / SKU base" value={form.ref} onChange={(e) => set("ref", e.target.value)} required />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-700">Marca</label>
            <select
              value={form.brandId}
              onChange={(e) => set("brandId", e.target.value)}
              className="h-11 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm focus:border-flame focus:outline-none focus:ring-2 focus:ring-flame/30"
            >
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-700">Categoria</label>
            <select
              value={form.categorySlug}
              onChange={(e) => {
                set("categorySlug", e.target.value);
                set("subcategorySlug", null);
              }}
              className="h-11 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm focus:border-flame focus:outline-none focus:ring-2 focus:ring-flame/30"
            >
              {rootCategories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-700">Subcategoria</label>
            <select
              value={form.subcategorySlug ?? ""}
              onChange={(e) => set("subcategorySlug", e.target.value || null)}
              disabled={!subcats.length}
              className="h-11 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm disabled:bg-neutral-100 focus:border-flame focus:outline-none focus:ring-2 focus:ring-flame/30"
            >
              <option value="">— nenhuma —</option>
              {subcats.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <Input
          label="Descrição curta"
          value={form.shortDescription}
          onChange={(e) => set("shortDescription", e.target.value)}
          required
        />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-700">Descrição completa</label>
          <textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            required
            className="h-28 w-full rounded-md border border-neutral-300 p-3 text-sm focus:border-flame focus:outline-none focus:ring-2 focus:ring-flame/30"
          />
        </div>
      </Section>

      {/* Preços */}
      <Section title="Preço e disponibilidade">
        <div className="grid gap-3 sm:grid-cols-3">
          <NumInput label="Preço de (R$)" value={form.listPrice} onChange={(v) => set("listPrice", v)} />
          <NumInput label="Preço por (R$)" value={form.price} onChange={(v) => set("price", v)} />
          <NumInput label="Vendidos" value={form.soldCount} onChange={(v) => set("soldCount", v)} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {form.variants.length === 0 && (
            <NumInput label="Estoque total" value={form.totalStock} onChange={(v) => set("totalStock", v)} />
          )}
          <Input
            label="Fim da oferta (opcional)"
            type="datetime-local"
            value={toLocalInput(form.offerEndsAt)}
            onChange={(e) => set("offerEndsAt", e.target.value ? new Date(e.target.value).toISOString() : null)}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={form.freeShipping}
            onChange={(e) => set("freeShipping", e.target.checked)}
            className="text-flame focus:ring-flame/30"
          />
          Frete grátis
        </label>
        <div>
          <p className="mb-1.5 text-sm font-medium text-ink-700">Selos</p>
          <div className="flex flex-wrap gap-2">
            {ALL_TAGS.map((t) => {
              const on = form.tags.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() =>
                    set("tags", on ? form.tags.filter((x) => x !== t) : [...form.tags, t])
                  }
                  className={
                    "rounded-full border px-3 py-1 text-xs font-semibold " +
                    (on ? "border-flame bg-flame-50 text-flame-700" : "border-neutral-300 text-neutral-500")
                  }
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>
      </Section>

      {/* Imagens */}
      <Section title="Imagens">
        <div className="flex flex-wrap items-center gap-3">
          <label
            className={
              "inline-flex h-10 cursor-pointer items-center gap-2 rounded-md bg-ink px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90" +
              (uploading ? " pointer-events-none opacity-60" : "")
            }
          >
            {uploading ? "Enviando…" : "Enviar imagem"}
            <input
              type="file"
              accept="image/*"
              onChange={handleUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
          <span className="text-xs text-neutral-500">
            JPG, PNG, WEBP ou AVIF (até 5 MB). A imagem é salva no servidor e a URL guardada no
            produto.
          </span>
        </div>

        <p className="mt-1 text-xs font-medium text-neutral-500">
          Ou informe URLs de imagens manualmente:
        </p>
        <RowList
          rows={form.images}
          onAdd={() => set("images", [...form.images, ""])}
          onRemove={(i) => set("images", form.images.filter((_, idx) => idx !== i))}
          render={(url, i) => (
            <Input
              value={url}
              placeholder="https://… ou /uploads/arquivo.jpg"
              onChange={(e) => set("images", form.images.map((x, idx) => (idx === i ? e.target.value : x)))}
            />
          )}
          addLabel="Adicionar URL"
        />
      </Section>

      {/* Especificações */}
      <Section title="Especificações">
        <RowList
          rows={form.specs}
          onAdd={() => set("specs", [...form.specs, { label: "", value: "" }])}
          onRemove={(i) => set("specs", form.specs.filter((_, idx) => idx !== i))}
          render={(spec, i) => (
            <div className="grid flex-1 grid-cols-2 gap-2">
              <Input
                value={spec.label}
                placeholder="Atributo (ex: Casco)"
                onChange={(e) =>
                  set("specs", form.specs.map((x, idx) => (idx === i ? { ...x, label: e.target.value } : x)))
                }
              />
              <Input
                value={spec.value}
                placeholder="Valor (ex: Fibra)"
                onChange={(e) =>
                  set("specs", form.specs.map((x, idx) => (idx === i ? { ...x, value: e.target.value } : x)))
                }
              />
            </div>
          )}
          addLabel="Adicionar especificação"
        />
      </Section>

      {/* Variantes */}
      <Section title="Variantes (cor/tamanho)">
        <p className="-mt-2 text-xs text-neutral-500">
          Com variantes, o estoque total é a soma dos estoques de cada variante.
        </p>
        <RowList
          rows={form.variants}
          onAdd={() =>
            set("variants", [
              ...form.variants,
              { color: "", size: "", sku: "", stock: 0, imageUrl: "" } as ProductVariantInput,
            ])
          }
          onRemove={(i) => set("variants", form.variants.filter((_, idx) => idx !== i))}
          render={(v, i) => (
            <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-4">
              <Input
                value={v.color ?? ""}
                placeholder="cor (slug)"
                onChange={(e) =>
                  set("variants", form.variants.map((x, idx) => (idx === i ? { ...x, color: e.target.value || null } : x)))
                }
              />
              <Input
                value={v.size ?? ""}
                placeholder="tamanho"
                onChange={(e) =>
                  set("variants", form.variants.map((x, idx) => (idx === i ? { ...x, size: e.target.value || null } : x)))
                }
              />
              <Input
                value={v.sku}
                placeholder="SKU"
                onChange={(e) =>
                  set("variants", form.variants.map((x, idx) => (idx === i ? { ...x, sku: e.target.value } : x)))
                }
              />
              <Input
                type="number"
                value={String(v.stock)}
                placeholder="estoque"
                onChange={(e) =>
                  set("variants", form.variants.map((x, idx) => (idx === i ? { ...x, stock: Number(e.target.value) } : x)))
                }
              />
            </div>
          )}
          addLabel="Adicionar variante"
        />
      </Section>

      <div className="flex gap-3">
        <Button type="submit" loading={saving} size="lg">
          {editing ? "Salvar alterações" : "Criar produto"}
        </Button>
        <Button type="button" variant="outline" size="lg" onClick={() => router.push("/admin/produtos")}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

/* ------- helpers de UI ------- */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-3 rounded-xl border border-neutral-200 bg-white p-5">
      <legend className="px-1 text-sm font-bold text-ink">{title}</legend>
      {children}
    </fieldset>
  );
}

function NumInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <Input
      label={label}
      type="number"
      step="0.01"
      value={String(value)}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  );
}

function RowList<T>({
  rows,
  onAdd,
  onRemove,
  render,
  addLabel,
}: {
  rows: T[];
  onAdd: () => void;
  onRemove: (i: number) => void;
  render: (row: T, i: number) => React.ReactNode;
  addLabel: string;
}) {
  return (
    <div className="space-y-2">
      {rows.map((row, i) => (
        <div key={i} className="flex items-start gap-2">
          <div className="flex-1">{render(row, i)}</div>
          <button
            type="button"
            onClick={() => onRemove(i)}
            aria-label="Remover"
            className="mt-1 grid size-9 shrink-0 place-items-center rounded-md text-neutral-400 hover:bg-neutral-100 hover:text-danger"
          >
            <TrashIcon className="size-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={onAdd}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-flame hover:underline"
      >
        <PlusIcon className="size-4" /> {addLabel}
      </button>
    </div>
  );
}

/** ISO -> valor de <input type="datetime-local"> (sem timezone). */
function toLocalInput(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
