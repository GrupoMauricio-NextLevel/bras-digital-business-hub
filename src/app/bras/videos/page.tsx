import Link from "next/link";
import { requireRole } from "@/lib/require-session";
import { BRAS_PANELS, canOpenBrasPanelPreview } from "@/lib/bras/panels";
import { VideosManager } from "../estudio-client";
import { EstudioHeader } from "../header";
import { estudioData } from "../data";

export const dynamic = "force-dynamic";

export default async function Videos() {
  const session = await requireRole("NEXTLEVEL_MASTER");
  const d = await estudioData(session.actor);
  const balcao = BRAS_PANELS.find((p) => p.key === "balcao")!;
  return (
    <>
      <EstudioHeader title="Vídeos e ofertas" description="Os vídeos da página pública e do Meu Brás, na ordem desta lista, com o preço da caixa que só o membro vê." {...d} />
      <VideosManager videos={d.videos.map((v) => ({ id: v.id, youtubeId: v.youtubeId, title: v.title, summary: v.summary, active: v.active }))} offers={Object.fromEntries(d.offers.map((o) => [o.videoId, { importerId: o.importerId, priceBoxCents: o.priceBoxCents, unitsPerBox: o.unitsPerBox, boxesAvailable: o.boxesAvailable }]))} importers={d.importers.map((i) => ({ id: i.id, name: i.name, notes: i.notes, active: i.active }))} />
      {canOpenBrasPanelPreview(session.actor) ? <p className="mt-8 text-sm text-muted-foreground">Prévia da próxima área: <Link className="font-semibold text-link underline" href={balcao.path}>{balcao.name}</Link> ({balcao.audience}).</p> : null}
    </>
  );
}
