import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { formatBRL } from "@/lib/money";
import { myCarrier } from "@/lib/domain/cargas/cargas";
import { listRoutes } from "@/lib/domain/cargas/excursao";
import { getExcursionRules } from "@/lib/domain/cargas/regras-excursao";
import { RouteForm, TripForm, type RouteValue } from "@/components/cargas/excursao-forms";

export const dynamic = "force-dynamic";
const WEEKDAYS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

/** Rotas e viagens do ônibus de excursão (D114): tabela por tamanho, pontos de embarque e retirada, abrir viagem. */
export default async function Rotas() {
  const session = await requireRole("CARRIER");
  const db = await getDb();
  const c = await myCarrier(db, session.actor);
  if (c.operation !== "EXCURSAO") return (
    <>
      <PageHeader eyebrow="NextLevel Cargas" title="Rotas e viagens" description="Para ônibus de excursão." />
      <p className="rounded-xl border border-dashed border-border p-6 text-center text-muted-foreground">Rotas e viagens são do ônibus de excursão. Se você também roda com ônibus, fale com a NextLevel Cargas.</p>
    </>
  );
  const [routes, rules] = await Promise.all([listRoutes(db, session.actor, null), getExcursionRules(db)]);
  return (
    <>
      <PageHeader eyebrow="NextLevel Cargas · Ônibus de excursão" title="Rotas e viagens" description="Cadastre a rota com o preço de cada tamanho uma vez; depois é só abrir a viagem da semana. O cliente vê o preço antes de pedir: acaba a pechincha." />
      <section aria-labelledby="r-trip" className="ds-card mb-6 p-4"><h2 id="r-trip" className="mb-3 text-lg font-bold">Abrir viagem</h2><TripForm carrierId={null} routes={routes.filter((r) => r.active).map((r) => ({ id: r.id, name: r.name }))} defaultCapacity={rules.defaultCapacityUnits} /></section>
      <section aria-labelledby="r-list" className="space-y-3">
        <h2 id="r-list" className="text-lg font-bold">Rotas ({routes.length})</h2>
        {routes.map((r) => (
          <details key={r.id} className="ds-card p-4 text-sm">
            <summary className="cursor-pointer"><span className="font-semibold">{r.name}</span> {r.active ? null : <Badge tone="neutral">Fora de uso</Badge>}<span className="block text-muted-foreground">P {formatBRL(r.prices.P)} · M {formatBRL(r.prices.M)} · G {formatBRL(r.prices.G)} · chega ao Brás: {r.arrivalWeekdays.length ? r.arrivalWeekdays.map((d) => WEEKDAYS[d]).join(", ") : "a combinar"}</span></summary>
            <div className="mt-3"><RouteForm carrierId={null} value={{ id: r.id, name: r.name, originCity: r.originCity, originUf: r.originUf as RouteValue["originUf"], citiesServed: r.citiesServed as RouteValue["citiesServed"], brasPoint: r.brasPoint, cityPoint: r.cityPoint, arrivalWeekdays: r.arrivalWeekdays, travelHours: r.travelHours, prices: r.prices, active: r.active }} /></div>
          </details>
        ))}
        <details className="ds-card p-4" open={!routes.length}><summary className="cursor-pointer font-semibold">Nova rota</summary><div className="mt-3"><RouteForm carrierId={null} /></div></details>
      </section>
    </>
  );
}
