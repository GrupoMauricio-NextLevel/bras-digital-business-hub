import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { listFinancialAudit } from "@/lib/domain/fin-audit";
import { PageHeader } from "@/components/app/page-header";
import { DataTable } from "@/components/app/data-table";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import { FinNav } from "../fin-nav";

export const dynamic = "force-dynamic";
const brief = (v: Record<string, unknown> | null) => (v ? JSON.stringify(v).slice(0, 180) : "");

export default async function AuditoriaFinanceira() {
  const s = await requireRole("NEXTLEVEL_MASTER");
  const rows = await listFinancialAudit(await getDb(), s.actor, { limit: 300 });
  return (
    <>
      <PageHeader eyebrow="Financeiro corporativo NextLevel" title="Auditoria financeira" description="Trilha só de inserção: o banco recusa alterar ou apagar registros. Preço, oferta, comissão, pedido, pagamento, reembolso, assinatura e tabela do SuperDrop. Segredos nunca entram." />
      <FinNav active="auditoria" />
      <DataTable rows={rows} rowKey={(r) => r.id} empty={<p className="text-sm text-muted-foreground">Nenhum registro ainda.</p>} columns={[
        { key: "a", header: "Ação", primary: true, cell: (r) => <div><div className="font-semibold">{r.action}</div><div className="text-xs text-muted-foreground">{r.entityType}{r.entityId ? ` · ${r.entityId}` : ""}</div></div> },
        { key: "d", header: "Domínio", cell: (r) => <Badge tone={r.domain === "nextlevel_corporate_finance" ? "info" : "neutral"}>{r.domain === "nextlevel_corporate_finance" ? "Corporativo" : "Operacional"}</Badge> },
        { key: "w", header: "Quem", cell: (r) => <span className="text-xs">{r.actorRole ?? "SISTEMA"}</span> },
        { key: "c", header: "Mudança", mobile: false, cell: (r) => <span className="break-all font-mono text-[11px]">{brief(r.after)}{r.reason ? ` · ${r.reason}` : ""}</span> },
        { key: "t", header: "Quando", cell: (r) => formatDateTime(r.createdAt) },
      ]} />
    </>
  );
}
