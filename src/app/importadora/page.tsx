import Link from "next/link";
import { AlertTriangle, Boxes, ClipboardCheck, PackageCheck, Truck, Warehouse } from "lucide-react";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { PageHeader } from "@/components/app/page-header";
import { brasStaffCan, importerToday } from "@/lib/domain/bras/importadora";
import { importerLoads } from "@/lib/domain/cargas/cargas";
import { cargasToday } from "@/lib/cargas/rotulos";
import { PedidoCard } from "./pedido-card";

export const dynamic = "force-dynamic";

/** Hoje (D110): a fila do dia numa tela só, com botões grandes. */
export default async function Hoje() {
  const session = await requireRole("BRAS_IMPORTER");
  const db = await getDb();
  const [t, loads] = await Promise.all([importerToday(db, session.actor), importerLoads(db, session.actor)]);
  const hoje = cargasToday();
  const coletasHoje = loads.filter((l) => l.status === "ACEITA" && l.pickupDate === hoje).length;
  const aguardando = loads.filter((l) => l.status === "CHAMADA").length;
  const can = { disponibilidade: brasStaffCan(t.staffRole, "pedidos_disponibilidade"), balcao: brasStaffCan(t.staffRole, "pedidos_balcao") };
  const vazio = !t.conferir.length && !t.separar.length && !t.entregar.length;
  const bloco = (id: string, icon: React.ReactNode, title: string, hint: string, items: typeof t.conferir) => items.length ? (
    <section aria-labelledby={id} className="mb-8">
      <h2 id={id} className="mb-1 flex items-center gap-2 text-xl font-bold">{icon}{title} <span className="rounded-full bg-[var(--bd-acao)]/15 px-2 text-base tabular-nums">{items.length}</span></h2>
      <p className="mb-3 text-sm text-muted-foreground">{hint}</p>
      <ul className="grid gap-3 lg:grid-cols-2">{items.map((r) => <PedidoCard key={r.id} r={r} can={can} showAddress={false} />)}</ul>
    </section>
  ) : null;
  return (
    <>
      <PageHeader eyebrow="Importadora" title={`Hoje na ${t.importer.name}`} description={`${t.mes.pedidos} pedido(s) pago(s) e ${t.mes.caixas} caixa(s) vendidas pela Brás nos últimos 30 dias.`} />
      {(!t.galpoes || !t.produtos || t.desatualizados > 0) ? (
        <ul className="mb-6 space-y-2" aria-label="Avisos">
          {!t.galpoes ? <li className="flex items-center gap-2 rounded-lg bg-warning-soft px-4 py-3 text-sm"><Warehouse className="size-4 shrink-0" aria-hidden />Cadastre o seu galpão: o comprovante do comprador mostra endereço e horário. <Link href="/importadora/galpoes" className="font-semibold text-link underline">Cadastrar</Link></li> : null}
          {!t.produtos ? <li className="flex items-center gap-2 rounded-lg bg-warning-soft px-4 py-3 text-sm"><Boxes className="size-4 shrink-0" aria-hidden />Cadastre os produtos de caixa fechada (ou suba a planilha). <Link href="/importadora/produtos" className="font-semibold text-link underline">Começar</Link></li> : null}
          {t.desatualizados > 0 ? <li className="flex items-center gap-2 rounded-lg bg-warning-soft px-4 py-3 text-sm"><AlertTriangle className="size-4 shrink-0" aria-hidden />{t.desatualizados} produto(s) com estoque desatualizado: o comprador vê &quot;consultar&quot;. <Link href="/importadora/estoque" className="font-semibold text-link underline">Fazer a contagem</Link></li> : null}
        </ul>
      ) : null}
      {coletasHoje || aguardando ? <p className="mb-6 flex flex-wrap items-center gap-2 rounded-lg bg-surface-muted px-4 py-3 text-sm"><Truck className="size-4 shrink-0" aria-hidden />{coletasHoje ? `${coletasHoje} coleta(s) da transportadora marcada(s) para hoje.` : ""} {aguardando ? `${aguardando} aguardando a transportadora responder.` : ""} <Link href="/importadora/transportadoras" className="font-semibold text-link underline">Ver coletas</Link></p> : null}
      {bloco("h-conf", <ClipboardCheck className="size-5 text-[var(--bd-acao)]" aria-hidden />, "Conferir caixas", "Pedidos novos: confira se as caixas estão no galpão e toque em \"Tenho as caixas\".", t.conferir)}
      {bloco("h-sep", <PackageCheck className="size-5 text-[var(--bd-acao)]" aria-hidden />, "Separar", "Confirmados pela equipe da Brás: separe e deixe pronto para a transportadora.", t.separar)}
      {bloco("h-ent", <Truck className="size-5 text-[var(--bd-acao)]" aria-hidden />, "Entregar à transportadora", "Pagos: entregue quando o motorista mostrar o código do pedido.", t.entregar)}
      {vazio ? <p className="mb-8 rounded-xl border border-dashed border-border p-6 text-center text-muted-foreground">Nenhum pedido esperando você agora.</p> : null}
      {t.esgotando.length ? (
        <section aria-labelledby="h-esg" className="mb-8">
          <h2 id="h-esg" className="mb-3 text-xl font-bold">Esgotando</h2>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{t.esgotando.map((p) => <li key={p.id} className="ds-card flex items-center justify-between gap-2 p-3 text-sm"><span><b>{p.title}</b><span className="block text-xs text-muted-foreground">{p.sku}</span></span><span className="tabular-nums font-bold">{p.stockBoxes} cx</span></li>)}</ul>
          <Link href="/importadora/estoque" className="mt-3 inline-block text-sm font-semibold text-link underline">Lançar entrada</Link>
        </section>
      ) : null}
    </>
  );
}
