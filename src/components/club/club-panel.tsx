import { Award, CheckCircle2, Circle, Gift, Target, TrendingUp, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatBRL } from "@/lib/money";
import { CLUB_LEVEL_LABEL, type clubPanel } from "@/lib/domain/club/pontos";
import { CancelVoucherButton, InviteLink, RedeemForm } from "./club-forms";

type Panel = Awaited<ReturnType<typeof clubPanel>>;
const KIND = { EARN: "Ganhou", REDEEM: "Vale", EXPIRE: "Venceu", REVERSE: "Vale cancelado", ADJUST: "Ajuste" } as const;
const fmt = (n: number) => n.toLocaleString("pt-BR");

/**
 * "Indique e ganhe" (D115): o mesmo painel em todos os papéis. Saldo e quanto vale, convites, funil das indicações,
 * missões do mês, nível, conquistas e vales. Recompensa sempre por meta atingida, nunca por sorteio.
 */
export function ClubPanel({ data, inviteUrl, inviteMessage, referSlot }: { data: Panel; inviteUrl: string; inviteMessage: string; referSlot?: React.ReactNode }) {
  const steps = [
    { key: "CONVIDADO", label: "Convidados" }, { key: "CADASTROU", label: "Cadastraram" }, { key: "ATIVOU", label: "Ativaram" }, { key: "RECORRENTE", label: "Recorrentes" },
  ] as const;
  return (
    <div className="space-y-6">
      <section aria-labelledby="cl-saldo" className="grid gap-3 md:grid-cols-3">
        <div className="ds-card p-4 md:col-span-2">
          <h2 id="cl-saldo" className="text-sm font-semibold text-muted-foreground">Seus pontos</h2>
          <p className="mt-1 text-4xl font-black tabular-nums">{fmt(data.balance.available)}</p>
          <p className="text-sm">Valem <b>{formatBRL(data.valueCents)}</b> de desconto · {data.rules.pointsPerReal} pontos = R$ 1,00</p>
          <p className="mt-1 text-sm text-muted-foreground">{data.pending ? `${fmt(data.pending)} pontos a caminho (indicações ainda não ativadas)` : "Indique e acompanhe aqui os pontos a caminho."}{data.balance.expiringSoon ? ` · ${fmt(data.balance.expiringSoon)} vencem em 30 dias` : ""}{data.balance.inReview ? ` · ${fmt(data.balance.inReview)} em revisão` : ""}</p>
          <div className="mt-4"><RedeemForm available={data.balance.available} minRedeem={data.rules.minRedeem} pointsPerReal={data.rules.pointsPerReal} /></div>
        </div>
        <div className="ds-card p-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground"><TrendingUp className="size-4" aria-hidden />Seu nível</h2>
          <p className="mt-1 text-3xl font-black">{CLUB_LEVEL_LABEL[data.level.level]}</p>
          {data.level.next ? <p className="mt-1 text-sm text-muted-foreground">Para {data.level.next.label}: {data.level.next.missing}.</p> : <p className="mt-1 text-sm text-muted-foreground">Nível mais alto do Club.</p>}
        </div>
      </section>

      <section aria-labelledby="cl-conv" className="ds-card p-4">
        <h2 id="cl-conv" className="mb-1 flex items-center gap-2 text-base font-semibold"><Users className="size-5 text-[var(--brand-primary)]" aria-hidden />Convide e ganhe</h2>
        <p className="mb-3 text-sm text-muted-foreground">Os pontos ficam disponíveis quando o indicado faz a primeira compra paga, coleta ou viagem pelo sistema. Por indicado ativado: cliente {fmt(data.rules.referral.CLIENTE)}, transportadora ou ônibus {fmt(data.rules.referral.TRANSPORTADORA)}, importadora {fmt(data.rules.referral.IMPORTADORA)} pontos.</p>
        <div className="grid gap-6 lg:grid-cols-2">
          <div><h3 className="mb-2 text-sm font-semibold">Seu link para convidar clientes</h3><InviteLink url={inviteUrl} message={inviteMessage} /></div>
          {referSlot ? <div>{referSlot}</div> : null}
        </div>
      </section>

      <section aria-labelledby="cl-funil" className="ds-card p-4">
        <h2 id="cl-funil" className="mb-3 text-base font-semibold">Suas indicações</h2>
        <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4">{steps.map((s) => (
          <li key={s.key} className="rounded-lg bg-surface-muted p-3 text-center"><p className="text-2xl font-black tabular-nums">{data.funnel[s.key]}</p><p className="text-xs text-muted-foreground">{s.label}</p></li>
        ))}</ol>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="cl-mis" className="ds-card p-4">
          <h2 id="cl-mis" className="mb-3 flex items-center gap-2 text-base font-semibold"><Target className="size-5 text-[var(--brand-primary)]" aria-hidden />Missões do mês</h2>
          <ul className="space-y-3">{data.missions.map((m) => (
            <li key={m.key} className="text-sm">
              <p className="flex items-center justify-between gap-2"><span className="flex items-center gap-2">{m.done ? <CheckCircle2 className="size-4 text-success" aria-hidden /> : <Circle className="size-4 text-muted-foreground" aria-hidden />}{m.title}</span><b className="tabular-nums">+{fmt(m.points)}</b></p>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-muted" role="progressbar" aria-label={m.title} aria-valuemin={0} aria-valuemax={m.target} aria-valuenow={m.value}><div className="h-full bg-[var(--brand-primary)]" style={{ width: `${Math.round((m.value / m.target) * 100)}%` }} /></div>
              <p className="text-xs text-muted-foreground">{m.value} de {m.target}{m.done ? " · pontos creditados" : ""}</p>
            </li>
          ))}</ul>
        </section>
        <section aria-labelledby="cl-con" className="ds-card p-4">
          <h2 id="cl-con" className="mb-3 flex items-center gap-2 text-base font-semibold"><Award className="size-5 text-[var(--brand-primary)]" aria-hidden />Conquistas</h2>
          <ul className="grid grid-cols-2 gap-2">{data.badges.map((b) => (
            <li key={b.key} className={`rounded-lg border p-3 text-sm ${b.earned ? "border-[var(--brand-primary)] bg-[var(--brand-primary)]/5 font-semibold" : "border-dashed border-border text-muted-foreground"}`}>{b.earned ? <Award className="mr-1 inline size-4 align-[-3px] text-[var(--brand-primary)]" aria-hidden /> : null}{b.label}<span className="sr-only">{b.earned ? " (conquistada)" : " (ainda não)"}</span></li>
          ))}</ul>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="cl-vales" className="ds-card p-4">
          <h2 id="cl-vales" className="mb-3 flex items-center gap-2 text-base font-semibold"><Gift className="size-5 text-[var(--brand-primary)]" aria-hidden />Seus vales</h2>
          {data.vouchers.length ? <ul className="space-y-2 text-sm">{data.vouchers.map((v) => (
            <li key={v.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3">
              <span><b className="font-mono">{v.code}</b> · {formatBRL(v.valueCents)}<span className="block text-xs text-muted-foreground">{v.status === "ATIVO" ? `Vale até ${new Date(v.expiresAt).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}` : v.status === "USADO" ? `Usado${v.usedBy ? ` (${v.usedBy})` : ""}` : "Cancelado"}</span></span>
              {v.status === "ATIVO" ? <CancelVoucherButton id={v.id} /> : <Badge tone={v.status === "USADO" ? "success" : "neutral"}>{v.status === "USADO" ? "Usado" : "Cancelado"}</Badge>}
            </li>
          ))}</ul> : <p className="text-sm text-muted-foreground">Nenhum vale ainda.</p>}
        </section>
        <section aria-labelledby="cl-hist" className="ds-card p-4">
          <h2 id="cl-hist" className="mb-3 text-base font-semibold">Extrato de pontos</h2>
          {data.history.length ? <ul className="space-y-1 text-sm">{data.history.map((h) => (
            <li key={h.id} className="flex justify-between gap-2 border-b border-border py-1 last:border-0"><span>{KIND[h.kind]}{h.note ? ` · ${h.note}` : ""}{h.status === "REVISAO" ? " (em revisão)" : h.status === "RECUSADO" ? " (recusado)" : ""}</span><b className={`tabular-nums ${h.points < 0 ? "text-danger" : "text-success"}`}>{h.points > 0 ? "+" : ""}{fmt(h.points)}</b></li>
          ))}</ul> : <p className="text-sm text-muted-foreground">Sem lançamentos ainda.</p>}
        </section>
      </div>
      <p className="text-xs text-muted-foreground">Pontos não são dinheiro: não se sacam nem se transferem, valem só como desconto dentro do Brás Digital Club e vencem em {data.rules.expiryMonths} meses. Sem sorteio: a recompensa é sempre por meta atingida.</p>
    </div>
  );
}
