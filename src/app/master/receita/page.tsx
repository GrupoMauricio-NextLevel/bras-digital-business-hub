import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { getDb } from "@/db/client";
import { financeInvoices, organizations, stores } from "@/db/schema";
import { requireRole } from "@/lib/require-session";
import { resumoComercial, situacoesComerciais } from "@/lib/domain/situacao-comercial";
import { formatBRL } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { PageHeader, SectionTitle } from "@/components/app/page-header";
import { MetricCard } from "@/components/app/metric-card";
import { DataTable } from "@/components/app/data-table";
import { EmptyState } from "@/components/app/empty-state";
import { Badge } from "@/components/ui/badge";
import { receitaAgora } from "@/lib/domain/master-agora";
import { PrecisaDeVoce } from "@/components/app/precisa-de-voce";

export const dynamic = "force-dynamic";

const COBRANCA: Record<string, string> = { PAID: "Paga", OPEN: "Em aberto", OVERDUE: "Vencida", CANCELED: "Cancelada" };
const TOM = { pagante: "success", teste: "info", aguardando: "warning", vencido: "danger", cancelado: "outline", cortesia: "outline", sem_plano: "outline" } as const;

/** Receita (D204): quanto entra por mês e o que está em risco, com a mesma regra de "quem paga" do Master inteiro. */
export default async function ReceitaPage() {
  await requireRole("NEXTLEVEL_MASTER");
  const db = await getDb();
  const agora = new Date();
  const lojas = await db.select({ id: stores.id, nome: stores.name, slug: stores.slug, paidUntil: stores.paidUntil, trialEndsAt: stores.trialEndsAt, entryOffer: stores.entryOffer })
    .from(stores).innerJoin(organizations, eq(organizations.id, stores.organizationId)).where(and(eq(organizations.brand, "NEXTLEVEL_COMMERCE"), isNull(stores.showcaseTheme)));
  const ids = lojas.map((l) => l.id);
  const [sit, faturas] = await Promise.all([
    situacoesComerciais(db, lojas, agora),
    ids.length ? db.select().from(financeInvoices).where(and(inArray(financeInvoices.storeId, ids), eq(financeInvoices.kind, "STORE_PLAN"))).orderBy(desc(financeInvoices.createdAt)) : Promise.resolve([]),
  ]);
  const ultima = new Map<string, (typeof faturas)[number]>();
  for (const f of faturas) if (f.storeId && !ultima.has(f.storeId)) ultima.set(f.storeId, f);
  const r = resumoComercial(sit.values());
  const mes = agora.toISOString().slice(0, 7);
  const recebidoMes = faturas.filter((f) => f.status === "PAID" && f.paidAt?.slice(0, 7) === mes).reduce((s, f) => s + f.amountCents, 0);
  const linhas = lojas.map((l) => ({ ...l, s: sit.get(l.id)!, f: ultima.get(l.id) ?? null })).sort((a, b) => ["vencido", "aguardando", "teste", "pagante", "cortesia", "sem_plano", "cancelado"].indexOf(a.s.pagamento) - ["vencido", "aguardando", "teste", "pagante", "cortesia", "sem_plano", "cancelado"].indexOf(b.s.pagamento));
  return (
    <>
      <PageHeader eyebrow="NextLevel Commerce" title="Receita" description="Quanto entra por mês com os planos e o que está em risco. Cada número usa a mesma regra de quem paga do Master inteiro." />
      <PrecisaDeVoce itens={receitaAgora(linhas)} vazio="Nenhuma cobrança em risco agora." descricao="Planos vencidos, pagamentos pendentes, testes acabando e renovações da semana. Cada um abre a ficha com o WhatsApp pronto." />
      <section className="ds-kpis mb-6" aria-label="Receita">
        <MetricCard label="Receita mensal" value={formatBRL(r.mrrCents)} hint="planos ativos (anual ÷ 12)" />
        <MetricCard label="Recebido no mês" value={formatBRL(recebidoMes)} hint="cobranças de plano pagas" />
        <MetricCard label="Pagantes" value={r.pagantes} hint={`${r.teste} em teste${r.cortesia ? ` · ${r.cortesia} cortesia` : ""}`} />
        <MetricCard label="Em risco" value={r.vencidos + r.aguardando} hint={`${r.vencidos} vencido(s) · ${r.aguardando} aguardando`} tone={r.vencidos ? "danger" : "neutral"} />
        <MetricCard label="Canceladas" value={r.cancelados} hint="desde o início" />
      </section>
      <SectionTitle title="Assinaturas das lojas" description="Primeiro o que precisa de ação: vencidas e aguardando pagamento." />
      <DataTable rows={linhas} rowKey={(x) => x.id}
        empty={<EmptyState title="Nenhuma loja ainda" description="As assinaturas aparecem aqui quando as primeiras lojas forem criadas." />}
        columns={[
          { key: "loja", header: "Loja", primary: true, cell: (x) => <div><div className="font-bold">{x.nome}</div><div className="text-xs text-muted-foreground">/{x.slug}</div></div> },
          { key: "sit", header: "Situação", cell: (x) => <Badge tone={TOM[x.s.pagamento]}>{x.s.rotulo}</Badge> },
          { key: "plano", header: "Plano", cell: (x) => x.s.plano ? `${x.s.plano} · ${x.s.ciclo === "ANNUAL" ? "anual" : "mensal"}` : "—" },
          { key: "valor", header: "Por mês", className: "text-right", cell: (x) => <span className="tabular-nums">{x.s.valorCents ? formatBRL(x.s.valorCents) : "—"}</span> },
          { key: "vence", header: "Vence / renova", cell: (x) => x.s.venceEm ? `${formatDate(x.s.venceEm)}${x.s.diasParaVencer !== null && x.s.diasParaVencer >= 0 ? ` (${x.s.diasParaVencer} dia(s))` : ""}` : "—" },
          { key: "cob", header: "Última cobrança", mobile: false, cell: (x) => x.f ? <span className="text-xs">{formatBRL(x.f.amountCents)} · {COBRANCA[x.f.status] ?? x.f.status}</span> : <span className="text-xs text-muted-foreground">nenhuma</span> },
        ]} />
      <nav className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Mais sobre receita">
        {([["Detalhe dos contratos", "/master/financeiro/assinaturas"], ["O que cada plano libera", "/commerce/plans"], ["Serviços da Loja NextLevel", "/master/services"], ["Financeiro completo", "/master/financeiro"]] as const).map(([t, h]) => (
          <Link key={h} href={h} className="ds-card flex items-center justify-between font-semibold hover:border-primary">{t}<ArrowRight className="size-4" aria-hidden /></Link>
        ))}
      </nav>
    </>
  );
}
