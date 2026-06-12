"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { Address, Order, OrderStatus } from "@/types";
import { useAuthStore } from "@/store/auth";
import { useMounted } from "@/lib/hooks";
import { getMyOrders } from "@/services/orders";
import {
  createAddress,
  deleteAddress,
  updateAddress,
  updateProfile,
  type AddressInput,
} from "@/services/account";
import { lookupCEP } from "@/services/cep";
import { submitReview } from "@/services/catalog";
import { logout as apiLogout } from "@/services/auth";
import { toast } from "@/store/toast";
import { formatBRL, formatCEP, formatDateShort } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Drawer";
import { EmptyState } from "@/components/ui/States";
import { Badge } from "@/components/ui/Badge";
import { UserIcon, TrashIcon, CheckIcon } from "@/components/ui/icons";

type Tab = "pedidos" | "enderecos" | "dados";

const STATUS_TONE: Record<OrderStatus, "success" | "ink" | "warning" | "danger"> = {
  entregue: "success",
  enviado: "ink",
  pago: "warning",
  cancelado: "danger",
};

export default function AccountPage() {
  const mounted = useMounted();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);
  const [tab, setTab] = useState<Tab>("pedidos");
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  // Modais
  const [profileOpen, setProfileOpen] = useState(false);
  const [addressModal, setAddressModal] = useState<{ open: boolean; editing: Address | null }>({
    open: false,
    editing: null,
  });

  useEffect(() => {
    if (!user) return;
    let active = true;
    setOrdersLoading(true);
    getMyOrders()
      .then((o) => active && setOrders(o))
      .catch(() => active && setOrders([]))
      .finally(() => active && setOrdersLoading(false));
    return () => {
      active = false;
    };
  }, [user]);

  if (!mounted) {
    return <div className="container-page py-16 text-center text-neutral-400">Carregando…</div>;
  }

  if (!user) {
    return (
      <div className="container-page py-10">
        <EmptyState
          icon={<UserIcon className="size-12" />}
          title="Entre na sua conta"
          description="Faça login para ver seus pedidos, endereços e dados pessoais."
          action={{ label: "Fazer login", href: "/login" }}
        />
      </div>
    );
  }

  async function handleDeleteAddress(id: string) {
    try {
      await deleteAddress(id);
      setUser({ ...user!, addresses: user!.addresses.filter((a) => a.id !== id) });
      toast.success("Endereço removido.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao remover endereço.");
    }
  }

  async function doLogout() {
    await apiLogout().catch(() => {});
    logout();
    router.push("/");
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "pedidos", label: "Meus pedidos" },
    { id: "enderecos", label: "Endereços" },
    { id: "dados", label: "Dados pessoais" },
  ];

  return (
    <div className="container-page py-10">
      <Breadcrumb items={[{ label: "Início", href: "/" }, { label: "Minha conta" }]} />

      <div className="mt-4 grid gap-8 lg:grid-cols-[260px_1fr]">
        {/* Sidebar */}
        <aside>
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-4">
            <span className="grid size-11 place-items-center rounded-full bg-ink text-white">
              <UserIcon className="size-6" />
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold text-ink">{user.name}</p>
              <p className="truncate text-xs text-neutral-500">{user.email}</p>
            </div>
          </div>
          <nav className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "block w-full border-l-2 px-4 py-3 text-left text-sm font-medium transition-colors",
                  tab === t.id
                    ? "border-flame bg-flame-50 text-flame-700"
                    : "border-transparent text-ink hover:bg-neutral-50",
                )}
              >
                {t.label}
              </button>
            ))}
            {user.role === "admin" && (
              <Link
                href="/admin"
                className="block border-l-2 border-transparent px-4 py-3 text-left text-sm font-semibold text-flame hover:bg-flame-50"
              >
                Painel administrativo →
              </Link>
            )}
            <button
              onClick={doLogout}
              className="block w-full border-l-2 border-transparent px-4 py-3 text-left text-sm font-medium text-danger hover:bg-neutral-50"
            >
              Sair
            </button>
          </nav>
        </aside>

        {/* Conteúdo */}
        <div>
          {tab === "pedidos" &&
            (ordersLoading ? (
              <p className="py-12 text-center text-sm text-neutral-400">Carregando pedidos…</p>
            ) : (
              <Orders
                orders={orders}
                onReviewed={(productId) =>
                  setOrders((prev) =>
                    prev.map((o) => ({
                      ...o,
                      items: o.items.map((it) =>
                        it.productId === productId ? { ...it, reviewed: true } : it,
                      ),
                    })),
                  )
                }
              />
            ))}

          {tab === "enderecos" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-ink">Endereços</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAddressModal({ open: true, editing: null })}
                >
                  Adicionar endereço
                </Button>
              </div>
              {user.addresses.length === 0 ? (
                <p className="rounded-xl border border-dashed border-neutral-300 bg-white px-4 py-8 text-center text-sm text-neutral-500">
                  Nenhum endereço cadastrado.
                </p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {user.addresses.map((a) => (
                    <div key={a.id} className="rounded-xl border border-neutral-200 bg-white p-4">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-ink">{a.label}</p>
                          {a.isDefault && <Badge tone="neutral">Padrão</Badge>}
                        </div>
                        <button
                          onClick={() => handleDeleteAddress(a.id)}
                          aria-label="Remover endereço"
                          className="text-neutral-400 hover:text-danger"
                        >
                          <TrashIcon className="size-4" />
                        </button>
                      </div>
                      <p className="mt-1.5 text-sm text-neutral-600">
                        {a.recipient}
                        <br />
                        {a.street}, {a.number} {a.complement && `- ${a.complement}`}
                        <br />
                        {a.district} · {a.city}/{a.state}
                        <br />
                        CEP {a.cep}
                      </p>
                      <button
                        onClick={() => setAddressModal({ open: true, editing: a })}
                        className="mt-3 text-sm font-semibold text-flame hover:underline"
                      >
                        Editar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "dados" && (
            <div className="max-w-md space-y-4">
              <h2 className="text-lg font-bold text-ink">Dados pessoais</h2>
              <Field label="Nome" value={user.name} />
              <Field label="E-mail" value={user.email} />
              <Field label="CPF" value={user.cpf ?? "—"} />
              <Field label="Telefone" value={user.phone ?? "—"} />
              <Button variant="outline" onClick={() => setProfileOpen(true)}>
                Editar dados
              </Button>
            </div>
          )}
        </div>
      </div>

      {profileOpen && (
        <ProfileModal
          onClose={() => setProfileOpen(false)}
          onSaved={(u) => {
            setUser(u);
            setProfileOpen(false);
            toast.success("Dados atualizados.");
          }}
        />
      )}

      {addressModal.open && (
        <AddressModal
          editing={addressModal.editing}
          onClose={() => setAddressModal({ open: false, editing: null })}
          onSaved={(addresses) => {
            setUser({ ...user, addresses });
            setAddressModal({ open: false, editing: null });
            toast.success("Endereço salvo.");
          }}
        />
      )}
    </div>
  );
}

/* ---------- Modal: editar dados pessoais ---------- */
function ProfileModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: (u: import("@/types").User) => void;
}) {
  const user = useAuthStore((s) => s.user)!;
  const [form, setForm] = useState({ name: user.name, cpf: user.cpf ?? "", phone: user.phone ?? "" });
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const updated = await updateProfile(form);
      onSaved(updated);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Editar dados pessoais">
      <div className="space-y-3">
        <Input
          label="Nome"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <Input
          label="CPF"
          value={form.cpf}
          onChange={(e) => setForm({ ...form, cpf: e.target.value })}
        />
        <Input
          label="Telefone"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
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

/* ---------- Modal: adicionar/editar endereço ---------- */
const emptyAddress: AddressInput = {
  label: "",
  recipient: "",
  cep: "",
  street: "",
  number: "",
  complement: "",
  district: "",
  city: "",
  state: "",
  isDefault: false,
};

function AddressModal({
  editing,
  onClose,
  onSaved,
}: {
  editing: Address | null;
  onClose: () => void;
  onSaved: (addresses: Address[]) => void;
}) {
  const [form, setForm] = useState<AddressInput>(
    editing ? { ...editing } : { ...emptyAddress },
  );
  const [saving, setSaving] = useState(false);

  function set<K extends keyof AddressInput>(key: K, value: AddressInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onCep(value: string) {
    set("cep", formatCEP(value));
    if (value.replace(/\D/g, "").length === 8) {
      try {
        const r = await lookupCEP(value);
        setForm((f) => ({ ...f, street: r.street, district: r.district, city: r.city, state: r.state }));
      } catch {
        /* ignore */
      }
    }
  }

  async function save() {
    if (!form.label || !form.recipient || !form.cep || !form.street || !form.number) {
      toast.error("Preencha os campos obrigatórios.");
      return;
    }
    setSaving(true);
    try {
      if (editing) await updateAddress(editing.id, form);
      else await createAddress(form);
      const { getAddresses } = await import("@/services/account");
      onSaved(await getAddresses());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar endereço.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={editing ? "Editar endereço" : "Adicionar endereço"} className="max-w-lg">
      <div className="grid grid-cols-2 gap-3">
        <Input label="Identificação" placeholder="Casa, Trabalho…" value={form.label} onChange={(e) => set("label", e.target.value)} />
        <Input label="Destinatário" value={form.recipient} onChange={(e) => set("recipient", e.target.value)} />
        <Input label="CEP" value={form.cep} maxLength={9} onChange={(e) => onCep(e.target.value)} />
        <Input label="Número" value={form.number} onChange={(e) => set("number", e.target.value)} />
        <Input className="col-span-2" label="Rua" value={form.street} onChange={(e) => set("street", e.target.value)} />
        <Input label="Complemento" value={form.complement ?? ""} onChange={(e) => set("complement", e.target.value)} />
        <Input label="Bairro" value={form.district} onChange={(e) => set("district", e.target.value)} />
        <Input label="Cidade" value={form.city} onChange={(e) => set("city", e.target.value)} />
        <Input label="UF" value={form.state} maxLength={2} onChange={(e) => set("state", e.target.value.toUpperCase())} />
      </div>
      <label className="mt-3 flex items-center gap-2 text-sm text-ink">
        <input
          type="checkbox"
          checked={form.isDefault ?? false}
          onChange={(e) => set("isDefault", e.target.checked)}
          className="text-flame focus:ring-flame/30"
        />
        Definir como endereço padrão
      </label>
      <div className="mt-4 flex gap-2">
        <Button fullWidth loading={saving} onClick={save}>
          Salvar endereço
        </Button>
        <Button fullWidth variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
      </div>
    </Modal>
  );
}

function Orders({
  orders,
  onReviewed,
}: {
  orders: Order[];
  onReviewed: (productId: string) => void;
}) {
  const [open, setOpen] = useState<string | null>(orders[0]?.id ?? null);
  const [reviewing, setReviewing] = useState<{ slug: string; productId: string; name: string } | null>(
    null,
  );

  if (orders.length === 0) {
    return (
      <EmptyState
        title="Você ainda não fez pedidos"
        description="Quando comprar, seus pedidos aparecerão aqui."
        action={{ label: "Ver produtos", href: "/" }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-ink">Meus pedidos</h2>
      {orders.map((o) => {
        const expanded = open === o.id;
        return (
          <div key={o.id} className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
            <button
              onClick={() => setOpen(expanded ? null : o.id)}
              className="flex w-full flex-wrap items-center justify-between gap-3 px-5 py-4 text-left"
            >
              <div>
                <p className="font-semibold text-ink">Pedido {o.number}</p>
                <p className="text-xs text-neutral-500">
                  {formatDateShort(o.createdAt)} · {o.items.length} item(ns)
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={STATUS_TONE[o.status]}>{o.status}</Badge>
                <span className="font-bold text-ink">{formatBRL(o.total)}</span>
              </div>
            </button>

            {expanded && (
              <div className="border-t border-neutral-100 px-5 py-4 animate-fade-in">
                <ul className="space-y-3">
                  {o.items.map((it) => {
                    const canReview = o.status !== "cancelado" && !!it.slug && !it.reviewed;
                    return (
                      <li key={it.productId} className="flex items-center gap-3">
                        <div className="relative size-14 shrink-0 overflow-hidden rounded-md bg-neutral-100">
                          <Image src={it.imageUrl} alt="" fill sizes="56px" className="object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-ink">{it.name}</p>
                          <p className="text-xs text-neutral-500">
                            {it.variantLabel && `${it.variantLabel} · `}Qtd: {it.quantity}
                          </p>
                          {it.reviewed ? (
                            <span className="mt-1 inline-flex items-center gap-1 text-2xs font-medium text-success">
                              <CheckIcon className="size-3.5" /> Você avaliou
                            </span>
                          ) : (
                            canReview && (
                              <button
                                onClick={() =>
                                  setReviewing({ slug: it.slug!, productId: it.productId, name: it.name })
                                }
                                className="mt-1 text-2xs font-semibold text-flame hover:underline"
                              >
                                Avaliar produto
                              </button>
                            )
                          )}
                        </div>
                        <span className="text-sm font-semibold">{formatBRL(it.unitPrice * it.quantity)}</span>
                      </li>
                    );
                  })}
                </ul>
                <div className="mt-4 grid gap-2 border-t border-neutral-100 pt-4 text-sm sm:grid-cols-2">
                  <p className="text-neutral-500">
                    Entrega: <span className="text-ink">{o.shippingLabel}</span> para{" "}
                    {o.address.city}/{o.address.state}
                  </p>
                  <p className="text-neutral-500 sm:text-right">
                    Pagamento: <span className="uppercase text-ink">{o.payment}</span>
                    {o.payment === "cartao" && o.installments && o.installments > 1
                      ? ` · ${o.installments}x`
                      : ""}
                  </p>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm">
                    Rastrear pedido
                  </Button>
                  <Link href="/">
                    <Button variant="ghost" size="sm">
                      Comprar novamente
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {reviewing && (
        <ReviewModal
          slug={reviewing.slug}
          productName={reviewing.name}
          onClose={() => setReviewing(null)}
          onDone={() => {
            onReviewed(reviewing.productId);
            setReviewing(null);
          }}
        />
      )}
    </div>
  );
}

/* ---------- Modal: avaliar produto comprado ---------- */
function ReviewModal({
  slug,
  productName,
  onClose,
  onDone,
}: {
  slug: string;
  productName: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [form, setForm] = useState({ title: "", comment: "" });
  const [saving, setSaving] = useState(false);

  async function save() {
    if (form.title.trim().length < 2 || form.comment.trim().length < 3) {
      toast.error("Preencha o título e o comentário.");
      return;
    }
    setSaving(true);
    try {
      await submitReview(slug, { rating, title: form.title, comment: form.comment });
      toast.success("Avaliação publicada. Obrigado!");
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao enviar avaliação.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Avaliar produto">
      <p className="-mt-1 mb-3 text-sm text-neutral-500">{productName}</p>
      <div className="mb-3 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            aria-label={`${n} estrelas`}
            className={n <= rating ? "text-flame" : "text-neutral-300"}
          >
            <svg viewBox="0 0 24 24" className="size-7" fill="currentColor" aria-hidden>
              <path d="M12 3.2l2.7 5.5 6 .9-4.3 4.2 1 6-5.4-2.8L6.6 19.9l1-6L3.3 9.6l6-.9z" />
            </svg>
          </button>
        ))}
      </div>
      <div className="space-y-3">
        <Input
          label="Título"
          placeholder="Resuma sua experiência"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-700">Comentário</label>
          <textarea
            value={form.comment}
            onChange={(e) => setForm({ ...form, comment: e.target.value })}
            placeholder="Conte como foi sua experiência com o produto"
            className="h-28 w-full rounded-md border border-neutral-300 p-3 text-sm focus:border-flame focus:outline-none focus:ring-2 focus:ring-flame/30"
          />
        </div>
        <div className="flex gap-2 pt-1">
          <Button fullWidth loading={saving} onClick={save}>
            Publicar avaliação
          </Button>
          <Button fullWidth variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">{label}</p>
      <p className="mt-0.5 text-sm text-ink">{value}</p>
    </div>
  );
}
