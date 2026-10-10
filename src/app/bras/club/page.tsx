import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { formatBRL } from "@/lib/money";
import { clubAdmin } from "@/lib/domain/club/pontos";
import { listAllReferrals } from "@/lib/domain/club/indicacoes";
import { getClubRules } from "@/lib/domain/club/regras";
import { getGroupCompanies } from "@/lib/domain/grupo";
import { ActivateReferralButton, ClubRulesEditor, ReviewButtons, UseVoucherForm } from "@/components/club/club-forms";

export const dynamic = "force-dynamic";

const KIND = { CLIENTE: "Cliente", IMPORTADORA: "Importadora", TRANSPORTADORA: "Transportadora", ONIBUS: "Ônibus", LOJA: "Loja", GUIA: "Guia" } as const;
const STATUS = { CONVIDADO: "Convidado", CADASTROU: "Cadastrou", ATIVOU: "Ativou", RECORRENTE: "Recorrente", RECUSADA: "Recusada", EXPIRADA: "Expirou" } as const;

/** Brás Digital Club no Master (D115): funil de indicações, revisão, vales e regras dos pontos. */
export default async function ClubMaster() {
  const session = await requireRole("NEXTLEVEL_MASTER");
  const db = await getDb();
  const [admin, refs, { version, ...rules }, companies] = await Promise.all([clubAdmin(db, session.actor), listAllReferrals(db, session.actor), getClubRules(db), getGroupCompanies(db)]);
  return (
    <>
      <PageHeader eyebrow="Estúdio Brás Digital" title="Brás Digital Club" description={`Indicações, pontos e vales de toda a rede. Regras versão ${version}, em rascunho até você decidir.`} />
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="ds-card p-4"><p className="text-sm text-muted-foreground">Pontos emitidos</p><p className="text-2xl font-black tabular-nums">{admin.issuedPoints.toLocaleString("pt-BR")}</p></div>
        <div className="ds-card p-4"><p className="text-sm text-muted-foreground">Pontos em vales</p><p className="text-2xl font-black tabular-nums">{admin.redeemedPoints.toLocaleString("pt-BR")}</p></div>
        <div className="ds-card p-4"><p className="text-sm text-muted-foreground">Indicações</p><p className="text-2xl font-black tabular-nums">{refs.length}</p></div>
      </div>
      {admin.review.length ? (
        <section aria-labelledby="cm-rev" className="ds-card mb-6 p-4">
          <h2 id="cm-rev" className="mb-1 text-base font-semibold">Revisão (acima do teto do mês)</h2>
          <ul className="space-y-2 text-sm">{admin.review.map((r) => <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3"><span><b>{r.name}</b> ({r.email}) · +{r.points} · {r.note}</span><ReviewButtons id={r.id} /></li>)}</ul>
        </section>
      ) : null}
      <section aria-labelledby="cm-vale" className="ds-card mb-6 p-4">
        <h2 id="cm-vale" className="mb-3 text-base font-semibold">Vales</h2>
        <UseVoucherForm companies={companies.map((c) => ({ key: c.key, name: c.tradeName || c.legalName }))} />
        {admin.vouchers.length ? <ul className="mt-4 space-y-1 text-sm">{admin.vouchers.map((v) => <li key={v.id} className="flex flex-wrap justify-between gap-2 border-b border-border py-1 last:border-0"><span><b className="font-mono">{v.code}</b> · {v.name} · {formatBRL(v.valueCents)}</span><Badge tone={v.status === "ATIVO" ? "info" : v.status === "USADO" ? "success" : "neutral"}>{v.status === "ATIVO" ? "Ativo" : v.status === "USADO" ? `Usado${v.usedBy ? ` (${v.usedBy})` : ""}` : "Cancelado"}</Badge></li>)}</ul> : <p className="mt-3 text-sm text-muted-foreground">Nenhum vale gerado ainda.</p>}
      </section>
      <section aria-labelledby="cm-ind" className="ds-card mb-6 p-4">
        <h2 id="cm-ind" className="mb-3 text-base font-semibold">Indicações ({refs.length})</h2>
        {refs.length ? <ul className="space-y-2 text-sm">{refs.slice(0, 100).map((r) => (
          <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3">
            <span><b>{r.name}</b> · {KIND[r.kind]} · {STATUS[r.status]}<span className="block text-muted-foreground">indicado por {r.referrer}{r.city ? ` · ${r.city}/${r.uf}` : ""}</span></span>
            <span className="flex flex-wrap gap-2">{r.status === "CONVIDADO" ? <a href={r.whatsappUrl} target="_blank" rel="noopener noreferrer" className="ds-btn ds-btn--quiet ds-btn--sm">Convidar</a> : null}{r.status === "CONVIDADO" || r.status === "CADASTROU" ? <ActivateReferralButton id={r.id} /> : null}</span>
          </li>
        ))}</ul> : <p className="text-sm text-muted-foreground">Nenhuma indicação ainda.</p>}
      </section>
      <section aria-labelledby="cm-reg" className="ds-card p-4"><h2 id="cm-reg" className="mb-3 text-base font-semibold">Regras dos pontos</h2><ClubRulesEditor rules={rules} /></section>
    </>
  );
}
