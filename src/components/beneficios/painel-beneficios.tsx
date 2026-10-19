import Link from "next/link";
import { CheckCircle2, Circle, Gift, Hourglass, PartyPopper, Calculator, Wallet } from "lucide-react";
import { formatBRL } from "@/lib/money";
import type { BenefitsPanel } from "@/lib/domain/beneficios/painel";

/**
 * Kit de benefícios dos painéis (D128, fase P5V): Pontos do Club (só Brás e Cargas), Trilha de marcos, Medidor do teste, Simulador do
 * plano e Comemoração. Só exibe o que o agregador entrega (o componente não decide regra). Todo ponto aparece também
 * em reais; nenhum texto promete ganho.
 */
const pts = (n: number) => n.toLocaleString("pt-BR");
const pct = (bps: number) => `${(bps / 100).toLocaleString("pt-BR")}%`;

export function CarteiraGrupo({ w }: { w: NonNullable<BenefitsPanel["wallet"]> }) {
  return (
    <section aria-labelledby="bn-cart" className="ds-card p-4">
      <h2 id="bn-cart" className="mb-1 flex items-center gap-2 text-sm font-semibold"><Wallet className="size-4 text-[var(--brand-primary)]" aria-hidden />Pontos do Brás Digital Club</h2>
      <p className="text-2xl font-bold tabular-nums">{pts(w.points)} <span className="text-sm font-medium text-muted-foreground">pontos</span></p>
      <p className="text-sm text-muted-foreground">valem {formatBRL(w.valueCents)} em serviços do grupo{w.expiringSoon ? ` · ${pts(w.expiringSoon)} vencem em breve` : ""}</p>
      {w.href ? <Link href={w.href} className="mt-2 inline-block text-sm font-semibold text-link underline">Ver como usar</Link> : null}
    </section>
  );
}

export function TrilhaMarcos({ t }: { t: BenefitsPanel["trail"] }) {
  const total = t.steps.length || 1;
  return (
    <section aria-labelledby="bn-trilha" className="ds-card p-4">
      <h2 id="bn-trilha" className="mb-1 text-sm font-semibold">{t.title}</h2>
      <p className="mb-2 text-sm text-muted-foreground">{t.done} de {t.steps.length} concluídos</p>
      <div className="mb-3 h-2 rounded-full bg-muted" role="progressbar" aria-valuemin={0} aria-valuemax={t.steps.length} aria-valuenow={t.done} aria-label="Passos concluídos"><div className="h-full rounded-full bg-[var(--brand-primary)]" style={{ width: `${(t.done / total) * 100}%` }} /></div>
      <ol className="space-y-1.5 text-sm">
        {t.steps.map((s) => (
          <li key={s.key} className="flex items-center gap-2">
            {s.done ? <CheckCircle2 className="size-4 shrink-0 text-success" aria-hidden /> : <Circle className="size-4 shrink-0 text-muted-foreground" aria-hidden />}
            {s.done || !s.href ? <span className={s.done ? "text-muted-foreground line-through" : ""}>{s.label}<span className="sr-only">{s.done ? " (feito)" : ""}</span></span> : <Link href={s.href} className={t.next?.key === s.key ? "font-semibold text-link underline" : "underline"}>{s.label}</Link>}
          </li>
        ))}
      </ol>
    </section>
  );
}

export function MedidorTeste({ t }: { t: NonNullable<BenefitsPanel["trial"]> }) {
  return (
    <section aria-labelledby="bn-teste" className="ds-card p-4">
      <h2 id="bn-teste" className="mb-1 flex items-center gap-2 text-sm font-semibold"><Hourglass className="size-4 text-[var(--brand-primary)]" aria-hidden />Teste do plano completo</h2>
      <p className="text-2xl font-bold tabular-nums">{t.daysLeft} <span className="text-sm font-medium text-muted-foreground">{t.daysLeft === 1 ? "dia restante" : "dias restantes"}</span></p>
      <p className="mb-2 text-sm text-muted-foreground">Depois, a loja continua no plano grátis, sem bloquear.{t.gainedDays ? ` Você já ganhou +${t.gainedDays} dias.` : ""}</p>
      <ul className="space-y-1 text-sm">
        {t.milestones.map((m) => <li key={m.label} className="flex items-center gap-2">{m.done ? <CheckCircle2 className="size-4 text-success" aria-hidden /> : <Gift className="size-4 text-[var(--brand-primary)]" aria-hidden />}<span>{m.label}: +{m.days} dias{m.done ? " (ganho)" : ""}</span></li>)}
      </ul>
      <p className="mt-2 text-xs text-muted-foreground">Teste de até {t.capDays} dias somando as conquistas.</p>
    </section>
  );
}

export function SimuladorPlano({ s }: { s: NonNullable<BenefitsPanel["simulator"]> }) {
  const current = s.options.find((o) => o.current);
  return (
    <section aria-labelledby="bn-sim" className="ds-card p-4">
      <h2 id="bn-sim" className="mb-1 flex items-center gap-2 text-sm font-semibold"><Calculator className="size-4 text-[var(--brand-primary)]" aria-hidden />Quanto cada plano custaria para você</h2>
      <p className="mb-2 text-sm text-muted-foreground">Com as suas vendas dos últimos 30 dias: <b className="text-foreground">{formatBRL(s.salesCents)}</b></p>
      <ul className="space-y-1.5 text-sm">
        {s.options.map((o) => (
          <li key={o.name} className={`flex flex-wrap items-baseline justify-between gap-2 rounded-md px-2 py-1 ${o.name === s.best.name ? "bg-success-soft" : ""}`}>
            <span>{o.name}{o.current ? " (o seu)" : ""} <span className="text-xs text-muted-foreground">{o.monthlyCents ? formatBRL(o.monthlyCents) : "grátis"} + {pct(o.feeBps)}</span></span>
            <span className="font-semibold tabular-nums">{formatBRL(o.totalCents)}/mês</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-sm">{s.savingsCents > 0 && current ? <>Com esse volume, o <b>{s.best.name}</b> sairia <b>{formatBRL(s.savingsCents)}</b> mais barato por mês.</> : "Com esse volume, o seu plano é o que sai mais em conta."}</p>
    </section>
  );
}

export function Comemoracao({ steps }: { steps: BenefitsPanel["celebrate"] }) {
  if (!steps.length) return null;
  return (
    <p role="status" className="flex items-center gap-2 rounded-lg bg-success-soft px-4 py-3 text-sm text-success">
      <PartyPopper className="size-4 shrink-0" aria-hidden /><span><b>Conquista!</b> {steps.map((s) => s.label).join(" · ")}</span>
    </p>
  );
}

/** Bloco completo para o topo dos painéis. */
export function PainelBeneficios({ data }: { data: BenefitsPanel }) {
  return (
    <div className="mb-6 space-y-3" data-beneficios>
      <Comemoracao steps={data.celebrate} />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {data.wallet ? <CarteiraGrupo w={data.wallet} /> : null}
        <TrilhaMarcos t={data.trail} />
        {data.trial ? <MedidorTeste t={data.trial} /> : null}
        {data.simulator ? <SimuladorPlano s={data.simulator} /> : null}
      </div>
    </div>
  );
}
