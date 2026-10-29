import { FaixaEquipePainel } from "@/components/portal/equipe/blocos";
import Link from "next/link";
import { Coins, Link2, MousePointerClick, Target, Users, Wallet } from "lucide-react";
import { PageHeader, SectionTitle } from "@/components/app/page-header";
import { MetricCard, MetricGrid } from "@/components/app/metric-card";
import { EmptyState } from "@/components/app/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { partnerDashboard } from "@/lib/domain/partners";
import { getBaseUrl } from "@/lib/base-url";
import { getBrand } from "@/lib/brand-server";
import { textoConvite } from "@/lib/parceiros/convite";
import { formatBRL } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { CopyButton, WhatsAppShare } from "./partner-client";
import { PainelParceiroEc } from "./painel-ec";
import { painelParceiroEc } from "@/lib/domain/parceiros-ec";
import { commercePlansView } from "@/lib/domain/commerce-plans";

export const dynamic = "force-dynamic";

export default async function PartnerHome() {
  const session = await requireRole("AFFILIATE");
  const base = await getBaseUrl();
  const marca = await getBrand();
  // Parceiro da E-commerce (D220): painel próprio do programa (indicador ou agência), com as regras do catálogo.
  if (marca.code === "NEXTLEVEL_COMMERCE") {
    const db = await getDb();
    const [pe, pv] = await Promise.all([painelParceiroEc(db, session.actor), commercePlansView(db)]);
    const aPartir = Math.min(...pv.plans.filter((p) => !p.quote && p.monthlyCents).map((p) => p.monthlyCents!));
    const linkEc = `${base}/r/${pe.parceiro.code.toLowerCase()}`;
    return <PainelParceiroEc d={pe} link={linkEc} convite={`Conheça a ${marca.name}: loja virtual com taxa zero da plataforma nas vendas pelo Mercado Pago e mensalidade a partir de ${formatBRL(aPartir)}. Teste aqui: ${linkEc}`} />;
  }
  const d = await partnerDashboard(await getDb(), session.actor);
  const link = `${base}/r/${d.partner.code.toLowerCase()}`;
  const goal = d.settings.monthlyGoal;
  const pct = Math.min(100, Math.round((d.funnel.activations / Math.max(d.tier.next ? d.funnel.activations + d.tier.next.needed : d.funnel.activations || 1, 1)) * 100));
  const max = Math.max(1, ...d.daily.map((x) => x.cents));
  return (
    <>
      <PageHeader title={`Olá, ${d.partner.displayName.split(" ")[0]}`} description={`Seu escritório virtual · competência ${d.period}`} />
      <FaixaEquipePainel nome="eq-reuniao-criativa" titulo="A equipe NextLevel está com você" texto="Materiais, links e dúvidas do programa: fale com a equipe pelo WhatsApp (11) 94086-2144 ou sac@nextlevelgroup.com.br." />
      <MetricGrid className="lg:grid-cols-5">
        <MetricCard label="Cliques" value={d.funnel.clicks} icon={MousePointerClick} hint="No mês" />
        <MetricCard label="Cadastros" value={d.funnel.signups} icon={Users} hint={`${d.funnel.trials} em teste`} />
        <MetricCard label="Ativações" value={d.funnel.activations} icon={Target} tone={d.goalMet ? "success" : "warning"} hint={`Meta do mês: ${goal}`} />
        <MetricCard label="Comissão do mês" value={formatBRL(d.monthCommissionCents)} icon={Coins} tone="info" hint="Provisória até o fechamento" />
        <MetricCard label="Saldo disponível" value={formatBRL(d.balances.availableCents)} icon={Wallet} tone="success" hint={`${formatBRL(d.balances.pendingCents)} em garantia`} href="/partner/finance" />
      </MetricGrid>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2"><CardContent className="space-y-4 pt-5">
          <div>
            <h2 className="text-base font-semibold">Sua faixa de comissão: {d.tier.bps ? `${d.tier.bps / 100}%` : "ainda sem ativações"}</h2>
            <p className="text-sm text-muted-foreground">{d.tier.next ? `Faltam ${d.tier.next.needed} ativação(ões) para chegar a ${d.tier.next.bps / 100}% sobre o setup.` : "Você está na faixa máxima do mês."} A faixa vale pelas ativações do mês civil e é ajustada no fechamento.</p>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-surface-muted" role="progressbar" aria-label="Progresso para a próxima faixa" aria-valuemin={0} aria-valuemax={100} aria-valuenow={d.tier.next ? pct : 100}><div className="h-full rounded-full bg-accent" style={{ width: `${d.tier.next ? pct : 100}%` }} /></div>
          <div className={`rounded-lg border p-3 text-sm ${d.goalMet ? "border-success/40 bg-success-soft text-success" : "border-warning/40 bg-warning-soft text-warning"}`}>
            {d.goalMet ? <>Meta do mês cumprida: seu cadastro segue <b>gratuito</b>.</> : <><b>Falta {goal - d.funnel.activations} ativação(ões) até {formatDate(d.monthEnd)}</b> para manter o cadastro gratuito. Sem ativação, o cadastro fica inativo e reativar custa {formatBRL(d.settings.inactiveFeeCents)}/mês. Você continua recebendo as mensalidades dos seus indicados.</>}
          </div>
        </CardContent></Card>

        <Card><CardContent className="space-y-3 pt-5">
          <h2 className="flex items-center gap-2 text-base font-semibold"><Link2 className="size-4" aria-hidden /> Seu link principal</h2>
          <code className="block break-all rounded bg-surface-muted p-2 text-xs" data-testid="partner-main-link">{link}</code>
          <div className="flex flex-wrap gap-2"><CopyButton text={link} label="Copiar link" /><WhatsAppShare text={textoConvite(marca, link)} /></div>
          <Link href="/partner/links" className="text-sm font-medium text-accent-foreground hover:underline">Criar links por campanha e ver o QR code</Link>
        </CardContent></Card>
      </div>

      <div className="mt-8">
        <SectionTitle title="Comissões por dia" description="Lançamentos do mês (setup, manutenção e ajustes)." />
        {d.daily.length === 0 ? <EmptyState compact icon={Coins} title="Sem comissões neste mês ainda" description="Assim que um indicado pagar a ativação, o lançamento aparece aqui." /> : (
          <Card><CardContent className="pt-5"><ul className="space-y-1.5" aria-label="Comissões por dia">{d.daily.map((x) => (
            <li key={x.day} className="flex items-center gap-3 text-sm"><span className="w-20 shrink-0 text-muted-foreground tabular-nums">{formatDate(x.day)}</span><span className="h-2.5 rounded bg-accent" style={{ width: `${Math.max(2, Math.round((Math.max(x.cents, 0) / max) * 100))}%` }} /><span className="tabular-nums">{formatBRL(x.cents)}</span></li>
          ))}</ul></CardContent></Card>
        )}
      </div>
    </>
  );
}
