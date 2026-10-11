import Link from "next/link";
import { BellRing, PackageCheck, Truck } from "lucide-react";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { pendingSurvey } from "@/lib/domain/precos/questionario";
import { benefitsPanel } from "@/lib/domain/beneficios/painel";
import { myReputation, TIER_LABEL } from "@/lib/domain/cargas/reputacao";
import { PainelBeneficios } from "@/components/beneficios/painel-beneficios";
import { QuestionarioPreco } from "@/components/descoberta/questionario-preco";
import { PageHeader } from "@/components/app/page-header";
import { carrierLoads } from "@/lib/domain/cargas/cargas";
import { LoadCard } from "@/components/cargas/load-card";
import { CarrierLoadActions } from "@/components/cargas/cargas-forms";
import { ExcursionBoard } from "@/components/cargas/excursion-board";
import { busBoard } from "@/lib/domain/cargas/excursao";
import { LOAD_QUICK_MESSAGES, carrierFixedPickups, fixedToday } from "@/lib/domain/cargas/vias";
import { LoadMessageForm } from "@/components/cargas/vias-forms";
import { carrierPaymentQueue } from "@/lib/domain/cargas/frete-pix";
import { RegisterPaymentButton } from "@/components/cargas/frete-pix-forms";
import { formatBRL } from "@/lib/money";

export const dynamic = "force-dynamic";

const pct = (bps: number) => String(bps / 100).replace(".", ",");

/** Hoje (D111): responder chamadas, coletar no Brás e entregar, numa tela só. */
export default async function Hoje() {
  const session = await requireRole("CARRIER");
  const db = await getDb();
  const { carrier, loads, usage } = await carrierLoads(db, session.actor);
  const excursao = carrier.operation === "EXCURSAO";
  const [trips, fixed, payQueue, survey] = await Promise.all([excursao ? busBoard(db, session.actor) : Promise.resolve([]), carrierFixedPickups(db, session.actor), excursao ? carrierPaymentQueue(db, session.actor) : Promise.resolve({ onArrival: [], toRefund: [] }), pendingSurvey(db, session.actor)]);
  const benefits = await benefitsPanel(db, session.actor);
  // Reputação (D134): aparece junto com os benefícios (mesma chave por marca no Master).
  const rep = benefits ? await myReputation(db, session.actor) : null;
  const fixasHoje = fixedToday(fixed);
  const chamadas = loads.filter((l) => l.status === "CHAMADA");
  const coletar = loads.filter((l) => l.status === "ACEITA");
  const transito = loads.filter((l) => l.status === "COLETADA");
  const bloco = (id: string, icon: React.ReactNode, title: string, hint: string, items: typeof loads) => (
    <section aria-labelledby={id} className="mb-8">
      <h2 id={id} className="mb-1 flex items-center gap-2 text-xl font-bold">{icon}{title} <span className="rounded-full bg-[var(--brand-primary)]/15 px-2 text-base tabular-nums">{items.length}</span></h2>
      <p className="mb-3 text-sm text-muted-foreground">{hint}</p>
      {items.length ? <ul className="grid gap-3 lg:grid-cols-2">{items.map((l) => <LoadCard key={l.id} load={l} who="transportadora" actions={<><CarrierLoadActions id={l.id} status={l.status} commissionPct={pct(usage.commissionBps)} /><LoadMessageForm loadId={l.id} number={l.number} quick={LOAD_QUICK_MESSAGES.transportadora} /></>} />)}</ul> : <p className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">Nada aqui agora.</p>}
    </section>
  );
  return (
    <>
      <PageHeader eyebrow="NextLevel Cargas" title={`Olá, ${carrier.contactName}`} description={excursao ? `Fardos do Brás para o ônibus ${carrier.name}: aceite as chamadas, colete pela etiqueta e entregue com o código do cliente.` : `Coletas das importadoras do Brás para a ${carrier.name}. Comissão da NextLevel no seu plano: ${pct(usage.commissionBps)}% do frete.`} />
      {usage.freeLimit !== null && !excursao ? <p role="note" className="mb-6 rounded-lg bg-surface-muted px-4 py-3 text-sm">Plano grátis: <b className="tabular-nums">{usage.acceptedThisMonth} de {usage.freeLimit}</b> cargas aceitas neste mês.</p> : null}
      {!carrier.hasDriverLink ? <p className="mb-6 rounded-lg bg-warning-soft px-4 py-3 text-sm">Gere o link do motorista para ele ver endereço, horário e códigos no celular. <Link href="/transportadora/perfil" className="font-semibold text-link underline">Gerar link</Link></p> : null}
      {benefits ? <PainelBeneficios data={benefits} /> : null}
      {rep ? (
        <section aria-labelledby="t-rep" className="ds-card mb-6 p-4" data-reputacao>
          <h2 id="t-rep" className="text-sm font-semibold">Sua reputação no grupo: <span className="text-[var(--brand-primary)]">{TIER_LABEL[rep.tier]}</span></h2>
          <p className="text-sm text-muted-foreground">Últimos 180 dias: {rep.signals.deliveries} entrega(s) · avaliação {rep.signals.rating === null ? "ainda sem avaliação" : `${rep.signals.rating.toLocaleString("pt-BR")} de 5`} · {rep.signals.refusalPct}% de recusas.</p>
          {rep.next ? <p className="mt-1 text-sm">Para chegar ao {TIER_LABEL[rep.next.tier]}: {rep.next.missing.join("; ")}.</p> : <p className="mt-1 text-sm">Você está no nível mais alto. As importadoras veem o selo ao escolher a transportadora.</p>}
        </section>
      ) : null}
      {survey ? <QuestionarioPreco product={survey.product} /> : null}
      {fixasHoje.length ? (
        <section aria-labelledby="t-fixa" className="mb-8 rounded-xl border border-[var(--brand-primary)]/40 p-4">
          <h2 id="t-fixa" className="mb-2 text-lg font-bold">Coletas fixas de hoje</h2>
          <ul className="grid gap-1 text-sm">{fixasHoje.map((f) => <li key={f.id}><b>{f.time}</b> · {f.importer}{f.pickupAddress ? ` · ${f.pickupAddress}` : ""}</li>)}</ul>
          <p className="mt-2 text-xs text-muted-foreground">Combinadas com as importadoras que têm você como preferida. A chamada com os pedidos chega aqui quando ela juntar a carga.</p>
        </section>
      ) : null}
      {!fixed.length ? <p className="mb-6 rounded-lg bg-surface-muted px-4 py-3 text-sm">Quer mais carga? Veja para onde vão os pedidos das importadoras do Brás e peça para ser preferida. <Link href="/transportadora/importadoras" className="font-semibold text-link underline">Importadoras na rede</Link></p> : null}
      {payQueue.onArrival.length || payQueue.toRefund.length ? (
        <section aria-labelledby="t-pag" className="ds-card mb-8 p-4">
          <h2 id="t-pag" className="mb-2 text-lg font-bold">Pagamentos do frete</h2>
          {payQueue.onArrival.length ? <><h3 className="text-sm font-semibold">Pagam na chegada ({payQueue.onArrival.length})</h3><ul className="mb-3 mt-1 space-y-2">{payQueue.onArrival.map((p) => <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 text-sm"><span><b className="font-mono">{p.label}</b> · {p.recipientName} · {formatBRL(p.priceCents)}</span><RegisterPaymentButton parcelId={p.id} label={p.label} what="RECEBIDO" /></li>)}</ul></> : null}
          {payQueue.toRefund.length ? <><h3 className="text-sm font-semibold">Pix para devolver ({payQueue.toRefund.length})</h3><p className="text-xs text-muted-foreground">Fardos pagos que não viajaram. Devolva pelo app do Mercado Pago (Atividade → o pagamento → Devolver) e marque aqui.</p><ul className="mt-1 space-y-2">{payQueue.toRefund.map((p) => <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 text-sm"><span><b className="font-mono">{p.label}</b> · {p.recipientName} · {formatBRL(p.priceCents)}</span><RegisterPaymentButton parcelId={p.id} label={p.label} what="DEVOLVIDO" /></li>)}</ul></> : null}
        </section>
      ) : null}
      {excursao ? <section aria-label="Viagens do ônibus" className="mb-10"><ExcursionBoard trips={trips} /><Link href="/transportadora/rotas" className="mt-4 inline-block text-sm font-semibold text-link underline">Rotas, preços e nova viagem</Link></section> : null}
      {excursao && !loads.length ? null : <>
      {bloco("t-cham", <BellRing className="size-5 text-[var(--brand-primary)]" aria-hidden />, "Chamadas para responder", "Aceite informando o frete combinado, ou recuse com o motivo (a importadora chama outra).", chamadas)}
      {bloco("t-col", <PackageCheck className="size-5 text-[var(--brand-primary)]" aria-hidden />, "Coletar no Brás", "No balcão, o motorista mostra o código de cada pedido. Sem código, a importadora não entrega.", coletar)}
      {bloco("t-tra", <Truck className="size-5 text-[var(--brand-primary)]" aria-hidden />, "Em trânsito", "Marque a entrega quando deixar a carga no destino.", transito)}
      </>}
    </>
  );
}
