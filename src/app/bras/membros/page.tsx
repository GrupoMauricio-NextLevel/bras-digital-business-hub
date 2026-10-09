import { requireRole } from "@/lib/require-session";
import { BRAS_TERMS_VERSION, EMPTY_BRAS_ACTIVITY, brasMembersActivity, formatCnpj } from "@/lib/domain/bras/membros";
import { BRAS_LEVELS, BRAS_LEVEL_LABEL, brasClientLevel, brasJourneyMoment, brasMaxScore, brasProfileLabels, getBrasClassification } from "@/lib/domain/bras/perfil";
import { brasMemberPlans } from "@/lib/domain/bras/suporte";
import { getDb } from "@/db/client";
import { MembersTable } from "../estudio-client";
import { EstudioHeader } from "../header";
import { estudioData } from "../data";

export const dynamic = "force-dynamic";

export default async function Membros() {
  const session = await requireRole("NEXTLEVEL_MASTER");
  const db = await getDb();
  const d = await estudioData(session.actor);
  const c = await getBrasClassification(db);
  const [act, plans] = await Promise.all([brasMembersActivity(db, session.actor, c.behavior.windowDays), brasMemberPlans(db, session.actor)]);
  const max = brasMaxScore(c);
  const nivel = (m: (typeof d.members)[number]) => {
    const a = act[m.id] ?? EMPTY_BRAS_ACTIVITY;
    const l = brasClientLevel(m, a.paidWindowCents, c);
    return { ...l, score: m.profileScore, maxScore: max, moment: brasJourneyMoment({ ...a, lastSeenAt: m.lastSeenAt ? new Date(m.lastSeenAt).toISOString() : null }, c), plan: plans[m.id] ?? "GRATIS", overrideReason: m.levelOverrideReason, answers: brasProfileLabels(m.profile) };
  };
  const rows = d.members.map((m) => ({ m, level: nivel(m) }));
  const contagem = BRAS_LEVELS.map((l) => ({ l, n: rows.filter((r) => r.level.level === l).length }));
  const titulo = new Map(d.videos.map((v) => [v.id, v.title]));
  const origem = (m: (typeof d.members)[number]) => m.sourceVideoId ? `Descoberta: ${titulo.get(m.sourceVideoId) ?? "removida"}` : m.source && m.source !== "direto" ? `Origem: ${m.source}` : "";
  return (
    <>
      <EstudioHeader title="Membros" description="Lojistas cadastrados com CNPJ. Entram liberados; bloqueie quem não for lojista." {...d} />
      <ul aria-label="Membros por nível" className="mb-4 flex flex-wrap gap-2 text-sm">
        {contagem.map(({ l, n }) => <li key={l} className="rounded-full border border-border bg-surface px-3 py-1"><b className="tabular-nums">{n}</b> {BRAS_LEVEL_LABEL[l]}</li>)}
        <li className="px-1 py-1 text-muted-foreground"><a href="/bras/regras?aba=classificacao" className="text-link underline">Como o nível é calculado</a></li>
      </ul>
      <MembersTable members={rows.map(({ m, level }) => ({ id: m.id, companyName: m.companyName, cnpj: formatCnpj(m.cnpj), name: m.name, email: m.email, whatsapp: m.whatsapp, status: m.status, blockedReason: m.blockedReason, createdAt: m.createdAt, requests: act[m.id]?.requests ?? 0, paidCents: act[m.id]?.paidCents ?? 0, lastRequestAt: act[m.id]?.lastRequestAt ?? null, origin: origem(m), termsOk: m.termsVersion === BRAS_TERMS_VERSION, lastSeenAt: m.lastSeenAt ? new Date(m.lastSeenAt).toISOString() : null, level }))} />
    </>
  );
}
