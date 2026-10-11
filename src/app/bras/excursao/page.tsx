import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { formatBRL } from "@/lib/money";
import { getExcursionRules } from "@/lib/domain/cargas/regras-excursao";
import { allTrips } from "@/lib/domain/cargas/excursao";
import { ExcursionRulesEditor } from "@/components/cargas/master-forms";
import { excursionFeeReport } from "@/lib/domain/cargas/frete-pix";

export const dynamic = "force-dynamic";
const STATUS: Record<string, string> = { ABERTA: "Recebendo", LOTADA: "Fechada", EM_VIAGEM: "Em viagem", CHEGOU: "Chegou", ENCERRADA: "Encerrada", CANCELADA: "Cancelada" };

/** Cargas Excursão no Master (D112, D114): viagens de todos os ônibus, ocupação, frete e taxa; regras dos fardos. */
export default async function Excursao() {
  const session = await requireRole("NEXTLEVEL_MASTER");
  const db = await getDb();
  const [{ version, ...rules }, trips, fees] = await Promise.all([getExcursionRules(db), allTrips(db, session.actor), excursionFeeReport(db, session.actor)]);
  return (
    <>
      <PageHeader eyebrow="Estúdio Brás Digital · NextLevel Cargas" title="Ônibus de excursão" description={`Viagens de todos os ônibus e as regras dos fardos (versão ${version}, valores em rascunho até você decidir).`} />
      <section aria-labelledby="ex-trips" className="ds-card mb-6 p-4">
        <h2 id="ex-trips" className="mb-3 text-base font-semibold">Viagens ({trips.length})</h2>
        {trips.length ? <div className="overflow-x-auto"><table className="w-full text-sm">
          <caption className="sr-only">Viagens dos ônibus</caption>
          <thead><tr className="border-b border-border text-left"><th scope="col" className="p-2">Viagem</th><th scope="col" className="p-2">Ônibus e rota</th><th scope="col" className="p-2">Saída</th><th scope="col" className="p-2 text-right">Bagageiro</th><th scope="col" className="p-2 text-right">Fardos</th><th scope="col" className="p-2 text-right">Frete</th><th scope="col" className="p-2 text-right">Taxa</th></tr></thead>
          <tbody>{trips.map((t) => <tr key={t.id} className="border-b border-border last:border-0">
            <th scope="row" className="p-2 text-left font-medium">{t.number} <Badge tone={t.status === "ABERTA" ? "success" : t.status === "CANCELADA" ? "neutral" : "info"}>{STATUS[t.status] ?? t.status}</Badge></th>
            <td className="p-2">{t.carrierName}<span className="block text-muted-foreground">{t.routeName}</span></td>
            <td className="p-2">{new Date(t.departAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</td>
            <td className="p-2 text-right tabular-nums">{t.usedUnits}/{t.capacityUnits}</td>
            <td className="p-2 text-right tabular-nums">{t.parcels}{t.waiting ? <span className="block text-warning">{t.waiting} aguardando</span> : null}</td>
            <td className="p-2 text-right tabular-nums">{formatBRL(t.freightCents)}</td>
            <td className="p-2 text-right tabular-nums">{formatBRL(t.feeCents)}</td>
          </tr>)}</tbody>
        </table></div> : <p className="text-sm text-muted-foreground">Nenhuma viagem ainda. O ônibus abre as viagens no painel dele (Rotas e viagens).</p>}
      </section>
      <section aria-labelledby="ex-fee" className="ds-card mb-6 p-4">
        <h2 id="ex-fee" className="mb-1 text-base font-semibold">Taxa da plataforma a faturar</h2>
        <p className="mb-3 text-sm text-muted-foreground">Por ônibus e mês, dos fardos coletados (taxa congelada no aceite). O frete é do dono do ônibus; a taxa vai em fatura mensal. {rules.fee.charging ? "Cobrança ligada." : "Cobrança desligada: nada é cobrado até você ligar."} {rules.pixOnline ? "Pix do frete ligado." : "Pix do frete desligado: cliente e ônibus combinam o pagamento."}</p>
        {fees.length ? <div className="overflow-x-auto"><table className="w-full text-sm">
          <caption className="sr-only">Taxa da plataforma por ônibus e mês</caption>
          <thead><tr className="border-b border-border text-left"><th scope="col" className="p-2">Ônibus</th><th scope="col" className="p-2">Mês</th><th scope="col" className="p-2 text-right">Fardos</th><th scope="col" className="p-2 text-right">Frete</th><th scope="col" className="p-2 text-right">Pago por Pix</th><th scope="col" className="p-2 text-right">Taxa</th></tr></thead>
          <tbody>{fees.map((f) => <tr key={`${f.carrier}-${f.month}`} className="border-b border-border last:border-0"><th scope="row" className="p-2 text-left font-medium">{f.carrier}</th><td className="p-2">{f.month.slice(5)}/{f.month.slice(0, 4)}</td><td className="p-2 text-right tabular-nums">{f.parcels}</td><td className="p-2 text-right tabular-nums">{formatBRL(f.freightCents)}</td><td className="p-2 text-right tabular-nums">{formatBRL(f.pixCents)}</td><td className="p-2 text-right font-semibold tabular-nums">{formatBRL(f.feeCents)}</td></tr>)}</tbody>
        </table></div> : <p className="text-sm text-muted-foreground">Nenhum fardo coletado ainda.</p>}
      </section>
      <section className="ds-card p-4"><ExcursionRulesEditor rules={rules} /></section>
    </>
  );
}
