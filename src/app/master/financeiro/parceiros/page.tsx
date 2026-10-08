import Link from "next/link";
import { desc, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { partnerCommissions, partnerLeads, partners } from "@/db/schema";
import { requireRole } from "@/lib/require-session";
import { PARTNER_KIND_LABEL } from "@/lib/domain/corporate-sales";
import { PageHeader } from "@/components/app/page-header";
import { DataTable } from "@/components/app/data-table";
import { formatBRL } from "@/lib/money";
import { PartnerKindControl } from "../catalog-admin";
import { FinNav } from "../fin-nav";

export const dynamic = "force-dynamic";

export default async function ParceirosFinanceiro() {
  await requireRole("NEXTLEVEL_MASTER");
  const db = await getDb();
  const rows = await db.select({ p: partners, pending: sql<number>`coalesce((select sum(amount_cents) from ${partnerCommissions} c where c.partner_id = ${partners.id} and c.status = 'PENDING'),0)::int`, available: sql<number>`coalesce((select sum(amount_cents) from ${partnerCommissions} c where c.partner_id = ${partners.id} and c.status = 'AVAILABLE'),0)::int`, leads: sql<number>`(select count(*) from ${partnerLeads} l where l.partner_id = ${partners.id})::int` }).from(partners).orderBy(desc(partners.createdAt)).limit(300);
  return (
    <>
      <PageHeader eyebrow="Financeiro corporativo NextLevel" title="Parceiros e comissões" description="Tipo de cada parceiro (define a regra de comissão aplicada), comissões em carência e liberadas. Saques e aprovações continuam em Parceiros." actions={<Link href="/master/partners" className="ds-btn ds-btn--secondary">Saques e antifraude</Link>} />
      <FinNav active="parceiros" />
      <DataTable rows={rows} rowKey={(r) => r.p.id} empty={<p className="text-sm text-muted-foreground">Nenhum parceiro cadastrado.</p>} columns={[
        { key: "n", header: "Parceiro", primary: true, cell: (r) => <div><div className="font-semibold">{r.p.displayName}</div><div className="text-xs text-muted-foreground">{r.p.code} · {PARTNER_KIND_LABEL[r.p.kind]} · {r.p.status}</div></div> },
        { key: "c", header: "Em carência / liberada", cell: (r) => <span className="tabular-nums text-sm">{formatBRL(r.pending)} / {formatBRL(r.available)}</span> },
        { key: "l", header: "Leads no CRM", cell: (r) => r.leads },
        { key: "k", header: "Tipo", cell: (r) => <PartnerKindControl partnerId={r.p.id} kind={r.p.kind} /> },
      ]} />
      <p className="mt-4 text-sm text-muted-foreground">White Label (setup de R$ 25.000) é ativado só pelo Master depois de proposta e contrato: veja em Propostas e entregas.</p>
    </>
  );
}
