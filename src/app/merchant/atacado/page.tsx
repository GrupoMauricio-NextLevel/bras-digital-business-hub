import { redirect } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { requireStoreAdmin } from "@/lib/require-session";
import { getDb } from "@/db/client";
import { storeModality } from "@/lib/domain/order-policy";
import { painelDeAtacado } from "@/lib/domain/atacado";
import { MinOrder } from "./min-order";
import { ProdutosDoAtacado, RegrasDoMix } from "./painel-atacado";

export const dynamic = "force-dynamic";

/** Atacado do lojista (AT1, D258): regras que liberam o atacado, pedido mínimo e, por produto, preço de atacado, grades e faixas. */
export default async function AtacadoPage() {
  const session = await requireStoreAdmin();
  const db = await getDb();
  if ((await storeModality(db, session.store!.id)) === "NETWORK") redirect("/merchant");
  const d = await painelDeAtacado(db, session.store!.id);
  const l = d.limites;
  return (
    <>
      <PageHeader title="Atacado" description="Venda como o Brás vende: atacado mesclado da loja toda, grade fechada, grade livre por cor e tamanho, pacote e preço por quantidade. As regras valem na loja virtual, nas propostas e nos pedidos do balcão." />
      <p className="mb-5 flex flex-wrap gap-2 text-xs" aria-label="Limites do seu plano">
        <span className="rounded-full bg-[var(--ds-soft)] px-3 py-1 font-semibold text-[var(--ds-link)]">Plano {l.plano}</span>
        <span className="rounded-full border border-border px-3 py-1">{l.regrasMix} regra{l.regrasMix === 1 ? "" : "s"} de atacado</span>
        <span className="rounded-full border border-border px-3 py-1">{l.gradesPorProduto >= 99 ? "Grades sem limite" : `${l.gradesPorProduto} grade${l.gradesPorProduto === 1 ? "" : "s"} por produto`}</span>
        <span className="rounded-full border border-border px-3 py-1">{l.faixas} faixas por produto</span>
        <span className="rounded-full border border-border px-3 py-1">{l.pacote ? "Pacote sortido" : "Pacote sortido no Pro"}</span>
        <span className="rounded-full border border-border px-3 py-1">{l.gradeLivre ? "Grade livre e múltiplos" : "Grade livre no Pro"}</span>
      </p>
      <RegrasDoMix regras={d.regras} categorias={d.categorias} limites={l} />
      <MinOrder cents={session.store!.minOrderCents} />
      {d.produtos.length === 0 ? <p className="text-sm text-muted-foreground">Ative produtos na sua loja para definir preços de atacado e grades.</p> : <ProdutosDoAtacado produtos={d.produtos} limites={l} />}
    </>
  );
}
