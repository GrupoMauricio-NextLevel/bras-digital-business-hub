import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { PageHeader } from "@/components/app/page-header";
import { brasBoxLiters, brasStaffCan, listImporterProducts, listWarehouses, myImporter } from "@/lib/domain/bras/importadora";
import { formatBRL } from "@/lib/money";
import { ProdutoForm } from "../produto-form";

export const dynamic = "force-dynamic";
const STATUS = { RASCUNHO: "Rascunho", ATIVO: "À venda", ESGOTADO: "Esgotado", ALTO_MAR: "Em alto mar" } as const;

/** Produtos e caixas (D110, seção 6.2): o catálogo de caixa fechada da importadora. */
export default async function Produtos() {
  const session = await requireRole("BRAS_IMPORTER");
  const db = await getDb();
  const [me, prods, whs] = await Promise.all([myImporter(db, session.actor), listImporterProducts(db, session.actor, null), listWarehouses(db, session.actor, null)]);
  const pode = brasStaffCan(me.staffRole, "produtos");
  const ws = whs.map((w) => ({ id: w.id, name: w.name }));
  return (
    <>
      <PageHeader eyebrow="Importadora" title="Produtos e caixas" description="Caixa master, medidas, peso e preço por quantidade. A equipe da Brás liga cada produto à descoberta em vídeo." />
      {pode ? <details className="ds-card mb-6 p-4" open={!prods.length}><summary className="cursor-pointer text-base font-semibold">Cadastrar produto</summary><div className="mt-4"><ProdutoForm importerId={null} warehouses={ws} /></div></details> : null}
      {prods.length ? (
        <ul className="grid gap-3 lg:grid-cols-2" aria-label="Produtos">
          {prods.map((p) => (
            <li key={p.id} className="ds-card p-4">
              <p className="flex flex-wrap items-center justify-between gap-2"><b>{p.title}</b><span className="rounded-full bg-surface-muted px-2.5 py-0.5 text-xs">{STATUS[p.status]}</span></p>
              <p className="text-sm text-muted-foreground">{p.sku}{p.category ? ` · ${p.category}` : ""} · {p.unitsPerBox} un. por caixa{brasBoxLiters(p) ? ` · ${String(brasBoxLiters(p)).replace(".", ",")} L` : ""}</p>
              <p className="mt-1 text-sm">{p.priceTiers.map((t) => `${t.minBoxes}+ cx: ${formatBRL(t.priceBoxCents)}`).join(" · ")}</p>
              <p className="mt-1 text-sm">Estoque: <b className="tabular-nums">{p.stockBoxes} caixa(s)</b></p>
              {pode ? <details className="mt-2"><summary className="cursor-pointer text-sm font-semibold text-link">Editar</summary><div className="mt-3"><ProdutoForm importerId={null} warehouses={ws} product={{ ...p, status: p.status }} /></div></details> : null}
            </li>
          ))}
        </ul>
      ) : <p className="rounded-xl border border-dashed border-border p-6 text-center text-muted-foreground">Nenhum produto ainda. Cadastre acima ou suba a planilha em Estoque.</p>}
    </>
  );
}
