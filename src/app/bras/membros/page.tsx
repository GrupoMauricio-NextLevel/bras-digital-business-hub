import { requireRole } from "@/lib/require-session";
import { BRAS_TERMS_VERSION, brasMembersActivity, formatCnpj } from "@/lib/domain/bras/membros";
import { getDb } from "@/db/client";
import { MembersTable } from "../estudio-client";
import { EstudioHeader } from "../header";
import { estudioData } from "../data";

export const dynamic = "force-dynamic";

export default async function Membros() {
  const session = await requireRole("NEXTLEVEL_MASTER");
  const d = await estudioData(session.actor);
  const act = await brasMembersActivity(await getDb(), session.actor);
  const titulo = new Map(d.videos.map((v) => [v.id, v.title]));
  const origem = (m: (typeof d.members)[number]) => m.sourceVideoId ? `Descoberta: ${titulo.get(m.sourceVideoId) ?? "removida"}` : m.source && m.source !== "direto" ? `Origem: ${m.source}` : "";
  return (
    <>
      <EstudioHeader title="Membros" description="Lojistas cadastrados com CNPJ. Entram liberados; bloqueie quem não for lojista." {...d} />
      <MembersTable members={d.members.map((m) => ({ id: m.id, companyName: m.companyName, cnpj: formatCnpj(m.cnpj), name: m.name, email: m.email, whatsapp: m.whatsapp, status: m.status, blockedReason: m.blockedReason, createdAt: m.createdAt, requests: act[m.id]?.requests ?? 0, paidCents: act[m.id]?.paidCents ?? 0, lastRequestAt: act[m.id]?.lastRequestAt ?? null, origin: origem(m), termsOk: m.termsVersion === BRAS_TERMS_VERSION, lastSeenAt: m.lastSeenAt ? new Date(m.lastSeenAt).toISOString() : null }))} />
    </>
  );
}
