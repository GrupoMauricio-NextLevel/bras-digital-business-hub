import { Users } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { partnerReferrals, STAGE_LABEL, type StageKey } from "@/lib/domain/partners";
import { formatBRL } from "@/lib/money";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
const TONE: Record<StageKey, "neutral" | "info" | "success" | "danger" | "outline"> = { SIGNUP: "neutral", TRIAL: "info", PAID: "success", BLOCKED: "danger", CANCELED: "outline" };

export default async function PartnerReferrals() {
  const session = await requireRole("AFFILIATE");
  const rows = await partnerReferrals(await getDb(), session.actor);
  return (
    <>
      <PageHeader title="Indicados" description="Por privacidade, o nome da loja aparece parcialmente e você não vê dados pessoais do cliente." />
      {rows.length === 0 ? <EmptyState icon={Users} title="Nenhum indicado ainda" description="Divulgue o seu link ou cupom. Quem se cadastrar aparece aqui." /> : (
        <Card><Table>
          <THead><TR><TH>Loja</TH><TH>Origem</TH><TH>Etapa</TH><TH>Cadastro</TH><TH className="text-right">Comissão gerada</TH></TR></THead>
          <TBody>{rows.map((r) => (
            <TR key={r.storeId}><TD className="font-mono text-sm">{r.nameMasked}</TD><TD>{r.via === "COUPON" ? "Cupom" : "Link"}</TD><TD><Badge tone={TONE[r.stage]}>{STAGE_LABEL[r.stage]}</Badge>{r.flagged ? <span className="ml-2 text-xs text-warning">em revisão</span> : null}</TD><TD>{r.at ? formatDate(r.at) : "—"}</TD><TD className="text-right tabular-nums">{r.flagged ? "—" : formatBRL(r.commissionCents)}</TD></TR>
          ))}</TBody>
        </Table></Card>
      )}
    </>
  );
}
