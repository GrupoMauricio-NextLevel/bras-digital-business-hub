"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Package } from "lucide-react";
import { IndexList, type IndexColumn } from "@/components/ds/index-list";
import { EmptyState } from "@/components/app/empty-state";
import { StatusBadge } from "@/components/app/status-badge";
import { ProductArt } from "@/components/app/product-art";
import { Badge } from "@/components/ui/badge";
import { bulkProductStatusAction } from "@/app/actions/supplier";
import type { IndexSpec, IndexView } from "@/lib/ds/index-list";
import { formatBRL } from "@/lib/money";
import { cn } from "@/lib/utils";

export type ProductRow = { id: string; name: string; sku: string; category: string; images: string[]; sellsUnit: boolean; sellsPack: boolean; distribution: string; costCents: number; suggestedPriceCents: number; status: "ACTIVE" | "DRAFT" | "ARCHIVED"; available: number; onHand: number };

const spec: IndexSpec<ProductRow> = {
  searchText: (r) => `${r.name} ${r.sku} ${r.category}`,
  filterValue: { status: (r) => r.status, category: (r) => r.category, stock: (r) => (r.available === 0 ? "out" : r.available < 10 ? "low" : "ok") },
  sortValue: { name: (r) => r.name, cost: (r) => r.costCents, price: (r) => r.suggestedPriceCents, stock: (r) => r.available },
};
const DEFAULT_VIEWS: IndexView[] = [
  { id: "active", name: "Ativos", query: { search: "", filters: { status: "ACTIVE" }, sort: null } },
  { id: "low", name: "Estoque baixo", query: { search: "", filters: { stock: "low" }, sort: { key: "stock", dir: "asc" } } },
  { id: "draft", name: "Rascunhos", query: { search: "", filters: { status: "DRAFT" }, sort: null } },
];

/** Lista de produtos do fornecedor: busca, filtros, visões salvas e edição em lote de status. */
export function ProductsList({ rows, categories, base = "/supplier/products" }: { rows: ProductRow[]; categories: string[]; base?: string }) {
  const router = useRouter();
  const run = (status: "ACTIVE" | "DRAFT" | "ARCHIVED", done: string) => async (ids: string[]) => {
    const r = await bulkProductStatusAction(ids, status);
    if (r.ok) { toast.success(`${r.data.updated} ${r.data.updated === 1 ? "produto" : "produtos"} ${done}`); router.refresh(); } else toast.error(r.error);
  };
  const columns: IndexColumn<ProductRow>[] = [
    { key: "name", header: "Produto", sortKey: "name", primary: true, cell: (r) => <div className="flex items-center gap-3"><ProductArt images={r.images} size="sm" /><div className="min-w-0"><div className="truncate font-medium">{r.name}</div><div className="text-xs text-muted-foreground">{r.sku} · {r.category}</div></div></div> },
    { key: "type", header: "Venda", hideBelow: "md", cell: (r) => <div className="flex gap-1">{r.sellsUnit ? <Badge tone="outline">Unitária</Badge> : null}{r.sellsPack ? <Badge tone="info">Grade</Badge> : null}</div> },
    { key: "dist", header: "Distribuição", hideBelow: "lg", cell: (r) => <StatusBadge value={r.distribution} /> },
    { key: "cost", header: "Custo", sortKey: "cost", align: "right", cell: (r) => <span className="tabular-nums">{formatBRL(r.costCents)}</span> },
    { key: "price", header: "Sugerido", sortKey: "price", align: "right", hideBelow: "md", cell: (r) => <span className="tabular-nums">{formatBRL(r.suggestedPriceCents)}</span> },
    { key: "stock", header: "Disponível", sortKey: "stock", align: "right", cell: (r) => <span className={cn("font-medium tabular-nums", r.available < 10 && "text-warning")}>{r.available} <span className="text-xs font-normal text-muted-foreground">/ {r.onHand}</span></span> },
    { key: "status", header: "Status", cell: (r) => <StatusBadge value={r.status} dot /> },
  ];
  return (
    <IndexList<ProductRow>
      storageKey="supplier-products" rows={rows} columns={columns} rowKey={(r) => r.id} spec={spec} defaultViews={DEFAULT_VIEWS}
      rowHref={(r) => `${base}/${r.id}`} noun={{ singular: "produto", plural: "produtos" }} searchPlaceholder="Buscar por nome, SKU ou categoria"
      filters={[
        { key: "status", label: "Status", options: [{ value: "ACTIVE", label: "Ativo" }, { value: "DRAFT", label: "Rascunho" }, { value: "ARCHIVED", label: "Arquivado" }] },
        { key: "category", label: "Categoria", options: categories.map((c) => ({ value: c, label: c })) },
        { key: "stock", label: "Estoque", options: [{ value: "ok", label: "Normal" }, { value: "low", label: "Baixo" }, { value: "out", label: "Zerado" }] },
      ]}
      bulkActions={[{ label: "Ativar", onRun: run("ACTIVE", "ativados") }, { label: "Passar para rascunho", onRun: run("DRAFT", "em rascunho") }, { label: "Arquivar", tone: "danger", onRun: run("ARCHIVED", "arquivados") }]}
      empty={<EmptyState icon={Package} title="Nenhum produto" description="Cadastre o primeiro produto para distribuir à rede." />}
    />
  );
}
