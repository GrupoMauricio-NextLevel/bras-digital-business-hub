import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { BRAS_CONTENT_STATUSES } from "@/db/schema";
import { BRAS_CONTENT_STATUS_LABEL, BRAS_FORMAT_HINT, BRAS_FORMAT_LABEL, BRAS_HOOKS, brasRecordingDays, listBrasContent } from "@/lib/domain/bras/pauta";
import { EstudioHeader } from "../header";
import { estudioData } from "../data";
import { ContentBoard } from "./pauta-client";

export const dynamic = "force-dynamic";

/** Pauta da máquina de conteúdo (D108): gravações no showroom (XDX a partir de segunda), do roteiro à publicação. */
export default async function Pauta() {
  const session = await requireRole("NEXTLEVEL_MASTER");
  const db = await getDb();
  const [d, items] = await Promise.all([estudioData(session.actor), listBrasContent(db, session.actor)]);
  const dias = brasRecordingDays(items.map((i) => i.c));
  return (
    <>
      <EstudioHeader title="Pauta de conteúdo" description="Cada gravação planejada: formato, importadora, dia, quem grava e o gancho. Kit da gravação em docs/bras/kit-gravacao-xdx.md." {...d} />
      {dias.length ? (
        <section aria-labelledby="pt-dias" className="mb-6">
          <h2 id="pt-dias" className="mb-2 text-base font-semibold">Dias de gravação</h2>
          <ul className="flex flex-wrap gap-2">
            {dias.map((x) => (
              <li key={x.date} className="ds-card p-3 text-sm">
                <p className="font-semibold">{new Date(`${x.date}T12:00:00-03:00`).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" })} · {x.total} peça(s)</p>
                <p className="text-xs text-muted-foreground">{Object.entries(x.formats).map(([f, n]) => `${n} ${BRAS_FORMAT_LABEL[f as keyof typeof BRAS_FORMAT_LABEL]}`).join(" · ")}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <ContentBoard
        statuses={BRAS_CONTENT_STATUSES.map((s) => ({ key: s, label: BRAS_CONTENT_STATUS_LABEL[s] }))}
        formats={Object.entries(BRAS_FORMAT_LABEL).map(([key, label]) => ({ key, label, hint: BRAS_FORMAT_HINT[key as keyof typeof BRAS_FORMAT_HINT] }))}
        hooks={BRAS_HOOKS}
        importers={d.importers.map((i) => ({ id: i.id, name: i.name }))}
        videos={d.videos.map((v) => ({ id: v.id, title: v.title }))}
        items={items.map(({ c, importerName, videoTitle }) => ({ id: c.id, title: c.title, format: c.format, status: c.status, importerId: c.importerId, videoId: c.videoId, recordDate: c.recordDate, owner: c.owner, hook: c.hook, notes: c.notes, importerName, videoTitle }))}
      />
    </>
  );
}
