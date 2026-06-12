"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  deleteProduct,
  listAdminProducts,
  type AdminProductRow,
} from "@/services/admin";
import { toast } from "@/store/toast";
import { formatBRL } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Drawer";
import { SearchIcon } from "@/components/ui/icons";

export default function AdminProductsPage() {
  const [rows, setRows] = useState<AdminProductRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [toDelete, setToDelete] = useState<AdminProductRow | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    listAdminProducts({ q: q || undefined, page, pageSize: 15 })
      .then((r) => {
        setRows(r.items);
        setTotal(r.total);
        setPageCount(r.pageCount);
      })
      .catch(() => toast.error("Erro ao carregar produtos."))
      .finally(() => setLoading(false));
  }, [q, page]);

  useEffect(() => {
    const id = setTimeout(load, q ? 300 : 0);
    return () => clearTimeout(id);
  }, [load, q]);

  async function confirmDelete() {
    if (!toDelete) return;
    try {
      await deleteProduct(toDelete.id);
      toast.success("Produto excluído.");
      setToDelete(null);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-ink">
          Produtos <span className="text-neutral-400">({total})</span>
        </h2>
        <Link href="/admin/produtos/novo">
          <Button>Novo produto</Button>
        </Link>
      </div>

      <Input
        leftIcon={<SearchIcon className="size-5" />}
        placeholder="Buscar por nome, REF ou slug…"
        value={q}
        onChange={(e) => {
          setPage(1);
          setQ(e.target.value);
        }}
      />

      <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-400">
            <tr>
              <th className="px-4 py-3">Produto</th>
              <th className="px-4 py-3">Marca</th>
              <th className="px-4 py-3 text-right">Preço</th>
              <th className="px-4 py-3 text-center">Estoque</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-neutral-400">
                  Carregando…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-neutral-400">
                  Nenhum produto encontrado.
                </td>
              </tr>
            ) : (
              rows.map((p) => (
                <tr key={p.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{p.name}</p>
                    <p className="text-xs text-neutral-400">{p.ref}</p>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{p.brand}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-semibold text-ink">{formatBRL(p.price)}</span>
                    {p.listPrice > p.price && (
                      <span className="ml-1 text-xs text-neutral-400 line-through">
                        {formatBRL(p.listPrice)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge tone={p.totalStock === 0 ? "danger" : p.totalStock <= 5 ? "warning" : "neutral"}>
                      {p.totalStock}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/produtos/${p.id}`} className="text-sm font-semibold text-flame hover:underline">
                      Editar
                    </Link>
                    <button
                      onClick={() => setToDelete(p)}
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

      {pageCount > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Anterior
          </Button>
          <span className="text-sm text-neutral-500">
            Página {page} de {pageCount}
          </span>
          <Button variant="outline" size="sm" disabled={page >= pageCount} onClick={() => setPage((p) => p + 1)}>
            Próxima
          </Button>
        </div>
      )}

      <Modal open={!!toDelete} onClose={() => setToDelete(null)} title="Excluir produto">
        <p className="text-sm text-neutral-600">
          Tem certeza que deseja excluir <strong>{toDelete?.name}</strong>? Esta ação não pode ser
          desfeita.
        </p>
        <div className="mt-4 flex gap-2">
          <Button variant="danger" fullWidth onClick={confirmDelete}>
            Excluir
          </Button>
          <Button variant="ghost" fullWidth onClick={() => setToDelete(null)}>
            Cancelar
          </Button>
        </div>
      </Modal>
    </div>
  );
}
