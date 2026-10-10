import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { PageHeader } from "@/components/app/page-header";
import { brasStaffCan, listImporterProducts, listStockMovements, myImporter } from "@/lib/domain/bras/importadora";
import { brasStockAge } from "@/lib/domain/bras/estoque";
import { getBrasRules } from "@/lib/domain/bras/regras";
import { MoverEstoque, PlanilhaEstoque } from "../estoque-client";

export const dynamic = "force-dynamic";
const KIND = { ENTRADA: "Entrada", SAIDA: "Saída", AJUSTE: "Ajuste", CONTAGEM: "Contagem", VENDA: "Venda Brás", ESTORNO: "Devolução" } as const;
const quando = (iso: string) => new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

/** Estoque em caixas (D110): saldo e frescor por produto, lançamento rápido, planilha e histórico. */
export default async function Estoque() {
  const session = await requireRole("BRAS_IMPORTER");
  const db = await getDb();
  const [me, prods, movs, rules] = await Promise.all([myImporter(db, session.actor), listImporterProducts(db, session.actor, null), listStockMovements(db, session.actor, null, undefined, 30), getBrasRules(db)]);
  const pode = brasStaffCan(me.staffRole, "estoque") && me.importer.stockMode !== "BLING";
  const limite = rules.stock.freshnessHours * 3_600_000;
  const agora = new Date().getTime();
  return (
    <>
      <PageHeader eyebrow="Importadora" title="Estoque em caixas" description={`O comprador vê o saldo enquanto ele estiver em dia (até ${rules.stock.freshnessHours} h sem contagem); depois aparece "consultar". Venda confirmada pela Brás baixa as caixas sozinha.`} />
      {me.importer.stockMode === "BLING" ? <p className="mb-6 rounded-lg bg-info-soft px-4 py-3 text-sm">O estoque desta importadora vem do Bling: ajuste lá.</p> : null}
      {pode ? <section aria-labelledby="es-plan" className="ds-card mb-6 p-4"><h2 id="es-plan" className="mb-3 text-base font-semibold">Planilha de produtos e estoque</h2><PlanilhaEstoque importerId={null} modeloHref="/importadora/estoque/modelo" /></section> : null}
      {prods.length ? (
        <ul className="mb-8 grid gap-3 lg:grid-cols-2" aria-label="Saldo por produto">
          {prods.map((p) => {
            const velho = !p.stockUpdatedAt || agora - new Date(p.stockUpdatedAt).getTime() > limite;
            return (
              <li key={p.id} className="ds-card p-4">
                <p className="flex items-center justify-between gap-2"><b>{p.title}</b><span className="text-2xl font-bold tabular-nums">{p.stockBoxes}<span className="ml-1 text-sm font-normal text-muted-foreground">cx</span></span></p>
                <p className={`text-sm ${velho ? "text-warning" : "text-muted-foreground"}`}>{p.sku} · {brasStockAge(p.stockUpdatedAt ? new Date(p.stockUpdatedAt).toISOString() : null)}{velho ? " · faça a contagem" : ""}</p>
                {pode ? <MoverEstoque importerId={null} productId={p.id} title={p.title} /> : null}
              </li>
            );
          })}
        </ul>
      ) : <p className="mb-8 rounded-xl border border-dashed border-border p-6 text-center text-muted-foreground">Nenhum produto ainda. Cadastre em Produtos e caixas ou suba a planilha.</p>}
      {movs.length ? (
        <section aria-labelledby="es-hist">
          <h2 id="es-hist" className="mb-3 text-base font-semibold">Últimos movimentos</h2>
          <ul className="ds-card divide-y divide-border text-sm">{movs.map(({ m, title }) => <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 p-3"><span><b>{KIND[m.kind]}</b> · {title}{m.note ? <span className="text-muted-foreground"> · {m.note}</span> : null}</span><span className="tabular-nums">{m.boxes > 0 ? `+${m.boxes}` : m.boxes} → {m.balanceAfter} cx · {quando(new Date(m.createdAt).toISOString())}</span></li>)}</ul>
        </section>
      ) : null}
    </>
  );
}
