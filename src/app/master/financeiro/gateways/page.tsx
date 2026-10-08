import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { paymentEvents } from "@/db/schema";
import { requireRole } from "@/lib/require-session";
import { getNextLevelMp } from "@/lib/domain/nextlevel-billing";
import { listReconciliation } from "@/lib/domain/corporate-checkout";
import { getGatewayRule } from "@/lib/payments/gateway";
import { pagarmeSecret } from "@/lib/payments/pagarme";
import { finFlag } from "@/lib/finance/flags";
import { PageHeader, SectionTitle } from "@/components/app/page-header";
import { DataTable } from "@/components/app/data-table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatBRL } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { GatewayRuleForm, ReconcileButton } from "../catalog-admin";
import { FinNav } from "../fin-nav";

export const dynamic = "force-dynamic";

export default async function GatewaysMaster() {
  const s = await requireRole("NEXTLEVEL_MASTER");
  const db = await getDb();
  const [mp, rule, rec] = await Promise.all([getNextLevelMp(db), getGatewayRule(db), listReconciliation(db, s.actor)]);
  const lastEvent = async (g: "MERCADOPAGO" | "PAGARME") => (await db.select().from(paymentEvents).where(eq(paymentEvents.gateway, g)).orderBy(desc(paymentEvents.receivedAt)).limit(1))[0] ?? null;
  const [mpEv, pgEv] = await Promise.all([lastEvent("MERCADOPAGO"), lastEvent("PAGARME")]);
  const pgKey = !!pagarmeSecret(); const pgFlag = finFlag("FIN_PAGARME"); const pgHook = !!(process.env.PAGARME_WEBHOOK_USER && process.env.PAGARME_WEBHOOK_PASSWORD);
  const pgMode = process.env.PAGARME_SECRET_KEY?.startsWith("sk_test_") ? "teste" : pgKey ? "produção" : null;
  return (
    <>
      <PageHeader eyebrow="Financeiro corporativo NextLevel" title="Gateways e conciliação" description="Contas que recebem as cobranças da NextLevel. Nenhum segredo aparece aqui. Uma cobrança criada num gateway nunca muda para o outro sozinha." />
      <FinNav active="gateways" />
      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <Card><CardContent className="pt-5">
          <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Mercado Pago (padrão)</h2><Badge tone={mp.connected ? "success" : "danger"}>{mp.connected ? "Conectado" : "Não conectado"}</Badge></div>
          <ul className="mt-3 space-y-1 text-sm">
            <li>Conta: {mp.connected ? `${mp.nickname} (${mp.isTest ? "teste" : "produção"})` : "conecte em Financeiro SuperDrop → Regras e preços"}</li>
            <li>Webhook: <code className="text-xs">/api/webhooks/mercadopago-nextlevel</code> (registrado por cobrança)</li>
            <li>Última notificação: {mpEv ? `${formatDate(mpEv.receivedAt)} · ${mpEv.result}` : "nenhuma ainda"}</li>
          </ul>
        </CardContent></Card>
        <Card><CardContent className="pt-5">
          <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Pagar.me (alternativo)</h2><Badge tone={pgKey && pgFlag && pgHook ? "info" : "warning"}>{pgKey && pgFlag && pgHook ? "Configurado, aguardando prova" : "Pendente de configuração"}</Badge></div>
          <ul className="mt-3 space-y-1 text-sm">
            <li>Chave secreta (PAGARME_SECRET_KEY): {pgKey ? `presente (${pgMode})` : "ausente"}</li>
            <li>Liberação (FIN_PAGARME): {pgFlag ? "ligada" : "desligada"}</li>
            <li>Autenticação do webhook (PAGARME_WEBHOOK_USER/PASSWORD): {pgHook ? "presente" : "ausente"}</li>
            <li>Webhook: <code className="text-xs">/api/webhooks/pagarme</code></li>
            <li>Última notificação: {pgEv ? `${formatDate(pgEv.receivedAt)} · ${pgEv.result}` : "nenhuma ainda"}</li>
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">Só vira &quot;ativo em produção&quot; depois de uma cobrança controlada paga, o webhook confirmado e a conciliação batendo.</p>
        </CardContent></Card>
      </div>
      <Card className="mb-6"><CardContent className="pt-5"><SectionTitle title="Regra global" description="Produto com gateway próprio no catálogo usa o dele. Se o Pagar.me não estiver configurado, novas cobranças vão para o Mercado Pago." /><GatewayRuleForm current={rule.default} /></CardContent></Card>
      <SectionTitle title="Conciliação" description="Compara o que o sistema registrou com o que o gateway informa. Divergências não são corrigidas sozinhas." action={<ReconcileButton />} />
      <DataTable rows={rec} rowKey={(r) => r.id} empty={<p className="text-sm text-muted-foreground">Nenhuma conciliação feita ainda.</p>} columns={[
        { key: "t", header: "Cobrança", primary: true, cell: (r) => <span className="font-mono text-xs">{r.transactionId}</span> },
        { key: "g", header: "Gateway", cell: (r) => (r.gateway === "PAGARME" ? "Pagar.me" : "Mercado Pago") },
        { key: "v", header: "Sistema / gateway", cell: (r) => <span className="tabular-nums text-xs">{formatBRL(r.expectedCents)} / {r.gatewayCents === null ? "—" : formatBRL(r.gatewayCents)}</span> },
        { key: "s", header: "Resultado", cell: (r) => <Badge tone={r.status === "MATCHED" ? "success" : r.status === "PENDING" ? "warning" : "danger"}>{r.status}</Badge> },
        { key: "d", header: "Quando", cell: (r) => <span className="text-xs">{formatDate(r.checkedAt)}{r.note ? ` · ${r.note}` : ""}</span> },
      ]} />
    </>
  );
}
