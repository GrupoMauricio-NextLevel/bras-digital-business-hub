import Link from "next/link";
import { requireRole } from "@/lib/require-session";
import { BRAS_PANELS, canOpenBrasPanelPreview } from "@/lib/bras/panels";
import { VideosManager } from "../estudio-client";
import { EstudioHeader } from "../header";
import { estudioData } from "../data";
import { getDb } from "@/db/client";
import { brandByCode } from "@/lib/brand";
import { brasDiscoveryStats, brasWeekPlan } from "@/lib/domain/bras/videos";
import { WeekPlan } from "./week-plan";
import { listAllBrasProducts } from "@/lib/domain/bras/importadora";

export const dynamic = "force-dynamic";

/** Roteiro de produção (D95): 4 descobertas por semana, cada uma com Shorts, trecho e análise. */
function Roteiro() {
  return (
    <details className="ds-card mb-6 p-4">
      <summary className="cursor-pointer font-semibold">Roteiro de cada descoberta (Shorts, trecho e análise)</summary>
      <div className="mt-3 grid gap-4 text-sm md:grid-cols-3">
        <div><p className="font-bold">1. Shorts de descoberta (público, 30 a 60 s, vertical)</p><ul className="mt-1 list-disc space-y-1 pl-5"><li>Gancho em 3 segundos: &quot;Achei no Brás um produto que…&quot;</li><li>O que é e para quem serve.</li><li>Um sinal de tendência em palavras, sem números.</li><li>Convite: &quot;análise completa e preço da caixa na Brás Digital&quot;.</li></ul></div>
        <div><p className="font-bold">2. Trecho (membro grátis, até 60 s)</p><ul className="mt-1 list-disc space-y-1 pl-5"><li>Um pedaço forte da análise: o veredito e um motivo.</li><li>Vídeo separado, não listado no YouTube.</li><li>Termina convidando para a análise completa.</li></ul></div>
        <div><p className="font-bold">3. Análise de mercado (acesso, 5 a 10 min, horizontal)</p><ul className="mt-1 list-disc space-y-1 pl-5"><li>Tendência, concorrência e preço no Mercado Livre.</li><li>Margem estimada a partir do preço da caixa.</li><li>Riscos, como anunciar e o veredito.</li><li>Sem promessa de ganho.</li></ul></div>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Ritmo combinado para o começo: 4 descobertas por semana.</p>
    </details>
  );
}

export default async function Descobertas() {
  const session = await requireRole("NEXTLEVEL_MASTER");
  const d = await estudioData(session.actor);
  const db = await getDb();
  const [stats, semana, produtos] = await Promise.all([brasDiscoveryStats(db, session.actor), brasWeekPlan(db, session.actor), listAllBrasProducts(db, session.actor)]);
  const now = new Date().toISOString();
  const balcao = BRAS_PANELS.find((p) => p.key === "balcao")!;
  return (
    <>
      <EstudioHeader title="Descobertas" description="Cada descoberta tem três camadas: o Shorts público, o veredito e o trecho para o membro, e a análise completa para quem tem acesso. Mais a oferta da caixa." {...d} />
      <WeekPlan {...semana} now={now} />
      <Roteiro />
      <VideosManager stats={stats} now={now} baseUrl={brandByCode("BRAS_DIGITAL").baseUrl.replace(/\/$/, "")} videos={d.videos.map((v) => ({ id: v.id, youtubeId: v.youtubeId, title: v.title, summary: v.summary, active: v.active, publishAt: v.publishAt ? new Date(v.publishAt).toISOString() : null, discovery: { trendSignal: v.trendSignal, verdict: v.verdict, score: v.score, teaserYoutubeId: v.teaserYoutubeId, analysisYoutubeId: v.analysisYoutubeId, analysis: v.analysis } }))} offers={Object.fromEntries(d.offers.map((o) => [o.videoId, { importerId: o.importerId, priceBoxCents: o.priceBoxCents, unitsPerBox: o.unitsPerBox, boxesAvailable: o.boxesAvailable, productId: o.productId }]))} products={produtos.map((p) => ({ id: p.id, importerId: p.importerId, title: p.title, sku: p.sku, stockBoxes: p.stockBoxes, priceBoxCents: p.priceTiers[0]?.priceBoxCents ?? 0, unitsPerBox: p.unitsPerBox }))} importers={d.importers.map((i) => ({ id: i.id, name: i.name, notes: i.notes, active: i.active }))} />
      {canOpenBrasPanelPreview(session.actor) ? <p className="mt-8 text-sm text-muted-foreground">Prévia da próxima área: <Link className="font-semibold text-link underline" href={balcao.path}>{balcao.name}</Link> ({balcao.audience}).</p> : null}
    </>
  );
}
