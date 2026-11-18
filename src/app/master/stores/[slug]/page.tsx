import { notFound } from "next/navigation";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { StatusBadge } from "@/components/app/status-badge";
import { requireRole } from "@/lib/require-session";
import { getDb } from "@/db/client";
import { getStoreDiagnostics } from "@/lib/domain/diagnostics";
import { NotFoundError } from "@/lib/domain/errors";
import { formatDateTime } from "@/lib/utils";
import { LiberarTema } from "@/components/master/liberar-tema";
import { temasParaLiberar } from "@/lib/themes/liberar-equipe";
import { hasStorefront } from "@/lib/themes/license";
import { THEME_BY_KEY } from "@/lib/themes/catalog";

export const dynamic = "force-dynamic";

export default async function StoreDiagnosticsPage({ params }: { params: Promise<{ slug: string }> }) {
  const session = await requireRole("NEXTLEVEL_MASTER");
  const { slug } = await params;
  const d = await getStoreDiagnostics(await getDb(), session.actor, slug).catch((e) => { if (e instanceof NotFoundError) return null; throw e; });
  if (!d) notFound();
  const temas = hasStorefront(d.store) ? await temasParaLiberar(await getDb(), d.store.id) : null;
  return (
    <>
      <PageHeader backHref="/master/stores" title={d.store.name} description={`Diagnóstico da loja · ${d.store.slug} · ${d.store.published ? "publicada" : "em rascunho"}`} actions={<StatusBadge value={d.store.status} dot />} />
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="border border-border bg-surface p-4">
          <h2 className="text-sm font-semibold">Pronta para vender?</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {d.readiness.items.map((i) => (
              <li key={i.key} className="flex items-start gap-2">{i.ok ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden /> : <AlertTriangle className={`mt-0.5 size-4 shrink-0 ${i.blocking ? "text-danger" : "text-warning"}`} aria-hidden />}<span><span className="font-medium">{i.label}</span><span className="block text-xs text-muted-foreground">{i.detail}</span></span></li>
            ))}
          </ul>
        </section>
        <section className="border border-border bg-surface p-4">
          <h2 className="text-sm font-semibold">Integrações e acesso</h2>
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
            <dt className="text-muted-foreground">Pagamento</dt><dd>{d.integrations.payment.status}{d.integrations.payment.provider ? ` · ${d.integrations.payment.provider}` : ""}{d.integrations.payment.status === "CONNECTED" && !d.integrations.payment.hasToken ? " · sem credencial gravada" : ""}</dd>
            <dt className="text-muted-foreground">Frete</dt><dd>{d.integrations.shipping.status}{d.integrations.shipping.provider ? ` · ${d.integrations.shipping.provider}` : ""}{d.integrations.shipping.hasOwnRules ? " · regras próprias" : " · taxa padrão"}</dd>
            <dt className="text-muted-foreground">Domínio</dt><dd>{d.integrations.domain.status}{d.integrations.domain.custom ? ` · ${d.integrations.domain.custom}` : ""}</dd>
            <dt className="text-muted-foreground">Plano</dt><dd>{d.access.state}{d.access.daysLeft !== null ? ` · ${d.access.daysLeft} dia(s)` : ""}</dd>
            <dt className="text-muted-foreground">Pedidos parados</dt><dd className={d.stalePendingOrders ? "font-medium text-warning" : ""}>{d.stalePendingOrders} sem pagamento há mais de 24 h</dd>
          </dl>
          <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pedidos por estado</h3>
          <p className="mt-1 text-sm">{Object.keys(d.ordersByStatus).length ? Object.entries(d.ordersByStatus).map(([k, v]) => `${k}: ${v}`).join(" · ") : "Nenhum pedido ainda."}</p>
          <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Eventos nos últimos 7 dias</h3>
          <p className="mt-1 text-sm">{Object.keys(d.events7d).length ? Object.entries(d.events7d).map(([k, v]) => `${k}: ${v}`).join(" · ") : "Nenhum."}</p>
        </section>
        {temas ? (
          <section id="temas" className="border border-border bg-surface p-4 lg:col-span-2">
            <h2 className="text-sm font-semibold">Temas e edição avançada</h2>
            <p className="mt-1 text-xs text-muted-foreground">Tema ativo: <span className="font-medium text-foreground">{THEME_BY_KEY[temas.ativo]?.name ?? temas.ativo}</span>{temas.editorCompleto ? " · Edição completa liberada" : ""}. Libere um tema pago sem custo ou registre o pagamento que o cliente fez por fora (entra no caixa), e instale na hora.</p>
            <div className="mt-3 max-w-xl"><LiberarTema via="master" storeId={d.store.id} temas={temas.temas} editorCompleto={temas.editorCompleto} /></div>
          </section>
        ) : null}
        <section className="border border-border bg-surface p-4">
          <h2 className="text-sm font-semibold">Erros ligados a esta loja</h2>
          {d.errors.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">Nenhum erro registrado para esta loja.</p> : (
            <ul className="mt-3 space-y-2 text-sm">{d.errors.map((e) => <li key={e.id}><span className="font-medium">{e.message}</span><span className="block text-xs text-muted-foreground">{e.count}× · {e.context ?? "—"}{e.ref ? ` · código ${e.ref}` : ""} · {formatDateTime(e.lastAt)} · {e.resolved ? "resolvido" : "aberto"}</span></li>)}</ul>
          )}
        </section>
        <section className="border border-border bg-surface p-4">
          <h2 className="text-sm font-semibold">Mudanças recentes</h2>
          {d.audit.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">Nenhuma mudança registrada.</p> : (
            <ul className="mt-3 space-y-1.5 text-sm">{d.audit.map((a, i) => <li key={i}>{a.action}<span className="block text-xs text-muted-foreground">{a.entityType} · {a.actorRole ?? "sistema"} · {formatDateTime(a.createdAt)}</span></li>)}</ul>
          )}
        </section>
      </div>
    </>
  );
}
