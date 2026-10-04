import { PageHeader } from "@/components/app/page-header";
import { requireStoreAdmin } from "@/lib/require-session";
import { getDb } from "@/db/client";
import { listAudit } from "@/lib/domain/audit";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

const LABEL: Record<string, string> = {
  STORE_DATA_UPDATED: "Dados da loja alterados", LISTING_CREATED: "Produto adicionado à loja", LISTING_UPDATED: "Preço ou situação de produto alterados",
  STORE_PUBLISHED: "Loja publicada", STORE_UNPUBLISHED: "Loja despublicada", SHIPPING_RULES_UPDATED: "Regras de frete alteradas",
  STAFF_INVITED: "Pessoa da equipe convidada", STAFF_REMOVED: "Pessoa da equipe removida", PAYMENT_CONNECTED: "Mercado Pago conectado",
  PAYMENT_DISCONNECTED: "Mercado Pago desconectado", DATA_EXPORT: "Dados exportados", CUSTOMER_ANONYMIZED: "Dados de um cliente excluídos",
};

export default async function AuditPage() {
  const session = await requireStoreAdmin();
  const rows = await listAudit(await getDb(), session.actor, 100);
  return (
    <>
      <PageHeader title="Histórico de mudanças" description="Quem mudou o quê na sua loja. Senhas e chaves nunca aparecem aqui." />
      {rows.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma mudança registrada ainda.</p> : (
        <ul className="divide-y divide-border border border-border bg-surface">
          {rows.map((r) => (
            <li key={r.id} className="px-4 py-3 text-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-2"><span className="font-medium">{LABEL[r.action] ?? r.action}</span><span className="text-xs text-muted-foreground">{formatDateTime(r.createdAt)}</span></div>
              {Object.keys(r.changes).length ? <div className="mt-1 break-words text-xs text-muted-foreground">{Object.entries(r.changes).map(([k, v]) => (v && "to" in v ? `${k}: ${JSON.stringify(v.from)} → ${JSON.stringify(v.to)}` : `${k}: alterado`)).join(" · ")}</div> : null}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
