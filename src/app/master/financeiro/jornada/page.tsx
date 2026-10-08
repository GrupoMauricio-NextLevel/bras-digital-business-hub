import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { getJourneyConfig, journeyDistribution, MILESTONES } from "@/lib/domain/journey";
import { PageHeader, SectionTitle } from "@/components/app/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { JourneyEditor } from "../catalog-admin";
import { FinNav } from "../fin-nav";

export const dynamic = "force-dynamic";

export default async function JornadaMaster() {
  const s = await requireRole("NEXTLEVEL_MASTER");
  const db = await getDb();
  const [config, dist] = await Promise.all([getJourneyConfig(db), journeyDistribution(db, s.actor)]);
  return (
    <>
      <PageHeader eyebrow="Financeiro corporativo NextLevel" title="Jornada da Loja NextLevel" description="Fases que organizam o catálogo no painel do cliente. Os marcos são medidos nos dados reais de cada loja; nada é marcado sem acontecer. Bloqueios obrigatórios ficam no próprio produto (Catálogo)." />
      <FinNav active="jornada" />
      <div className="mb-6 grid gap-3 sm:grid-cols-5">{config.phases.map((p) => <Card key={p.key}><CardContent className="pt-5"><p className="text-xs text-muted-foreground">{p.name}</p><p className="text-2xl font-bold tabular-nums">{dist[p.key] ?? 0}</p><p className="text-xs text-muted-foreground">lojas nesta fase</p></CardContent></Card>)}</div>
      <Card><CardContent className="pt-5"><SectionTitle title="Configuração" /><JourneyEditor config={config} /></CardContent></Card>
      <SectionTitle title="Marcos disponíveis" />
      <ul className="grid gap-1 text-sm sm:grid-cols-2">{Object.entries(MILESTONES).map(([k, v]) => <li key={k}><code className="text-xs">{k}</code> · {v}</li>)}</ul>
    </>
  );
}
