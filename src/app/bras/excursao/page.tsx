import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { formatBRL } from "@/lib/money";
import { getExcursionRules } from "@/lib/domain/cargas/regras-excursao";
import { allTrips } from "@/lib/domain/cargas/excursao";
import { ExcursionRulesEditor } from "@/components/cargas/master-forms";

export const dynamic = "force-dynamic";
const STATUS: Record<string, string> = { ABERTA: "Recebendo", LOTADA: "Fechada", EM_VIAGEM: "Em viagem", CHEGOU: "Chegou", ENCERRADA: "Encerrada", CANCELADA: "Cancelada" };

/** Cargas Excursão no Master (D112, D114): viagens de todos os ônibus, ocupação, frete e taxa; regras dos fardos. */
export default async function Excursao() {
  const session = await requireRole("NEXTLEVEL_MASTER");
  const db = await getDb();
  const [{ version, ...rules }, trips] = await Promise.all([getExcursionRules(db), allTrips(db, session.actor)]);
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
      <section className="ds-card p-4"><ExcursionRulesEditor rules={rules} /></section>
    </>
  );
}
