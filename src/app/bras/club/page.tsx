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
import { listCounters, monthOf, recentPurchases, settlementReport } from "@/lib/domain/club/balcao";
import { CounterCreateForm, MarkSettledButton, RevokeCounterButton } from "@/components/club/balcao-forms";

export const dynamic = "force-dynamic";

const KIND = { CLIENTE: "Cliente", IMPORTADORA: "Importadora", TRANSPORTADORA: "Transportadora", ONIBUS: "Ônibus", LOJA: "Loja", GUIA: "Guia" } as const;
const STATUS = { CONVIDADO: "Convidado", CADASTROU: "Cadastrou", ATIVOU: "Ativou", RECORRENTE: "Recorrente", RECUSADA: "Recusada", EXPIRADA: "Expirou" } as const;

/** Brás Digital Club no Master (D115): funil de indicações, revisão, vales e regras dos pontos. */
export default async function ClubMaster({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const session = await requireRole("NEXTLEVEL_MASTER");
  const db = await getDb();
  const sp = await searchParams;
  const month = /^\d{4}-\d{2}$/.test(sp.mes ?? "") ? sp.mes! : monthOf(new Date());
  const prev = (() => { const [y, m] = month.split("-").map(Number) as [number, number]; return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`; })();
  const [admin, refs, { version, ...rules }, companies, counters, purchases, settle] = await Promise.all([clubAdmin(db, session.actor), listAllReferrals(db, session.actor), getClubRules(db), getGroupCompanies(db), listCounters(db, session.actor), recentPurchases(db, session.actor), settlementReport(db, session.actor, month)]);
  const companyName = (k: string) => companies.find((c) => c.key === k)?.tradeName || companies.find((c) => c.key === k)?.legalName || k;
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
      <section aria-labelledby="cm-acerto" className="ds-card mb-6 p-4">
        <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="cm-acerto" className="text-base font-semibold">Acerto entre empresas · {month.slice(5)}/{month.slice(0, 4)}</h2>
          <a href={`?mes=${prev}`} className="text-sm font-semibold text-link underline">Mês anterior</a>
        </div>
        <p className="mb-3 text-sm text-muted-foreground">Cada vale é pago pelos pontos de quem os concedeu (a empresa da compra; indicação e missão são do caixa do Club, a NextLevel). Quando o vale é usado em outra empresa, quem concedeu deve a ela. O acerto é feito fora do sistema (nota ou transferência) e marcado aqui. {settle.vouchers} vale(s) usado(s) no mês, {formatBRL(settle.totalCents)}.</p>
        {settle.lines.length ? <ul className="space-y-2 text-sm">{settle.lines.map((l) => (
          <li key={`${l.debtor}-${l.creditor}`} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3">
            <span><b>{l.debtorName}</b> deve à <b>{l.creditorName}</b>: <b className="tabular-nums">{formatBRL(l.amountCents)}</b>{l.settledCents ? <span className="block text-muted-foreground">Acertado {formatBRL(l.settledCents)} · em aberto {formatBRL(l.openCents)}</span> : null}</span>
            {l.openCents > 0 ? <MarkSettledButton month={month} debtor={l.debtor} creditor={l.creditor} label={`${l.debtorName} → ${l.creditorName}, ${formatBRL(l.openCents)}`} /> : <Badge tone="success">Acertado</Badge>}
          </li>
        ))}</ul> : <p className="text-sm text-muted-foreground">Nada a acertar neste mês.</p>}
      </section>
      <section aria-labelledby="cm-balcao" className="ds-card mb-6 p-4">
        <h2 id="cm-balcao" className="mb-1 text-base font-semibold">Balcões do Club nas empresas do grupo</h2>
        <p className="mb-3 text-sm text-muted-foreground">Link sem login para o balcão ler o cartão do cliente, registrar a compra (vira pontos pagos pela empresa) e usar o vale. Hoje pontuam: {rules.purchase.companies.map(companyName).join(", ")} ({rules.purchase.pointsPerReal} pontos por R$ 1,00).</p>
        <CounterCreateForm companies={companies.map((c) => ({ key: c.key, name: c.tradeName || c.legalName }))} />
        {counters.length ? <ul className="mt-4 space-y-1 text-sm">{counters.map((c) => <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-border py-1 last:border-0"><span><b>{c.name}</b> · {companyName(c.company)}{c.lastUsedAt ? ` · último uso ${new Date(c.lastUsedAt).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}` : ""}</span>{c.active ? <RevokeCounterButton id={c.id} name={c.name} /> : <Badge tone="neutral">Desligado</Badge>}</li>)}</ul> : null}
        {purchases.length ? <details className="mt-4"><summary className="cursor-pointer text-sm font-semibold">Compras registradas ({purchases.length})</summary><ul className="mt-2 space-y-1 text-sm">{purchases.map((p) => <li key={p.id} className="flex flex-wrap justify-between gap-2 border-b border-border py-1 last:border-0"><span>{p.name} · {companyName(p.company)}{p.receipt ? ` · cupom ${p.receipt}` : ""}</span><span className="tabular-nums">{formatBRL(p.valueCents)} · +{p.points} pts</span></li>)}</ul></details> : null}
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
