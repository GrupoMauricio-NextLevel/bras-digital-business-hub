import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { formatCnpj } from "@/lib/domain/bras/membros";
import { getBrasAnalysisSettings, listBrasGrants } from "@/lib/domain/bras/descobertas";
import { EstudioHeader } from "../header";
import { estudioData } from "../data";
import { AccessSettings, GrantsManager } from "./acesso-client";

export const dynamic = "force-dynamic";

const vigente = (iso: string) => new Date(iso).getTime() >= Date.now();

/** Acesso à análise (D95): aberta no lançamento; depois, assinatura (liberada aqui) ou volume de compra. Só o Master. */
export default async function Acesso() {
  const session = await requireRole("NEXTLEVEL_MASTER");
  const db = await getDb();
  const [d, settings, grants] = await Promise.all([estudioData(session.actor), getBrasAnalysisSettings(db), listBrasGrants(db, session.actor)]);
  return (
    <>
      <EstudioHeader title="Acesso à análise" description="Quem vê a análise completa. Comprar é sempre grátis: o que se cobra é a análise." {...d} />
      <div className="grid gap-6 xl:grid-cols-[26rem_1fr]">
        <AccessSettings settings={settings} />
        <GrantsManager
          members={d.members.filter((m) => m.status === "ACTIVE").map((m) => ({ id: m.id, label: `${m.companyName} · ${formatCnpj(m.cnpj)}` }))}
          grants={grants.map(({ g, companyName, email }) => ({ id: g.id, companyName, email, kind: g.kind, validUntil: g.validUntil, note: g.note, active: !g.revokedAt && vigente(g.validUntil), revoked: !!g.revokedAt }))}
        />
      </div>
    </>
  );
}
