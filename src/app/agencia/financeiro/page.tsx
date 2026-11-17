import { AlarmClock, CheckCircle2, HandCoins, Wallet } from "lucide-react";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { Kpi } from "@/components/commerce/commerce-home";
import { escopoDaAgencia, pode } from "@/lib/agencias/acesso";
import { financeiroDaAgencia } from "@/lib/agencias/cobranca";
import { listarClientes } from "@/lib/agencias/clientes";
import { mesRotulo, mesValido } from "@/lib/agencias/fluxo";
import { formatBRL } from "@/lib/money";
import { AcoesDaCobranca, ConferirPagamentos, ContaMercadoPago, GerarCobrancas, NovaAvulsa } from "./financeiro-cliente";

export const dynamic = "force-dynamic";
export const metadata = { title: "Financeiro" };

const dm = (iso: string) => iso.split("-").reverse().join("/");
const TOM = { ABERTA: "bg-accent-soft text-[var(--ds-link)]", ATRASADA: "bg-danger-soft text-danger", PAGA: "bg-success-soft text-success", CANCELADA: "bg-surface-muted text-muted-foreground" } as const;
const ROTULO = { ABERTA: "Em aberto", ATRASADA: "Atrasada", PAGA: "Paga", CANCELADA: "Cancelada" } as const;

/** Financeiro da agência (D318): cobranças do mês pelo contrato, pagas direto na conta Mercado Pago da agência. */
export default async function Financeiro({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const session = await requireRole("AGENCY");
  const db = await getDb();
  const { membro } = await escopoDaAgencia(db, session.actor);
  if (!pode.editarContrato(membro)) return <><PageHeader title="Financeiro" /><EmptyState icon={Wallet} title="O financeiro é do administrador e do financeiro" description="Fale com o administrador da agência se precisar de algo sobre cobranças." /></>;
  const sp = await searchParams;
  const [f, clientes] = await Promise.all([financeiroDaAgencia(db, session.actor, sp.mes && mesValido(sp.mes) ? sp.mes : undefined), listarClientes(db, session.actor, { situacao: "ATIVO" })]);
  const n = f.numeros;
  return (
    <div className="mx-auto max-w-[1240px] space-y-5">
      <PageHeader eyebrow="Cobrança" title={`Financeiro de ${mesRotulo(f.mes)}`} description="As mensalidades saem do contrato de cada cliente. O cliente paga por Pix ou cartão direto na conta Mercado Pago da agência; a baixa é conferida no Mercado Pago."
        actions={<div className="flex flex-wrap items-start gap-2"><GerarCobrancas mes={f.mes} /><NovaAvulsa clientes={clientes.map((c) => ({ id: c.id, nome: c.nome }))} /></div>} />
      <ContaMercadoPago conectada={f.conectada} conta={f.conta} teste={f.teste} pode={f.podeConectar} />
      <section aria-label="Números do mês" className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Kpi i={1} icon={HandCoins} label="Previsto no mês" value={formatBRL(n.previstoCents)} note="mensalidades e avulsas" />
        <Kpi i={2} icon={CheckCircle2} label="Recebido" value={formatBRL(n.recebidoCents)} note={n.previstoCents ? `${Math.round((n.recebidoCents / n.previstoCents) * 100)}% do previsto` : "nada previsto ainda"} />
        <Kpi i={3} icon={Wallet} label="Em aberto" value={formatBRL(n.emAbertoCents)} note="no mês" />
        <Kpi i={4} icon={AlarmClock} label="Em atraso" value={formatBRL(n.atrasadoCents)} note={`${n.inadimplentes} cliente${n.inadimplentes === 1 ? "" : "s"} em atraso`} />
      </section>
      {f.lembrar.length ? (
        <section className="ds-card p-5 sm:p-6" aria-labelledby="fin-lem">
          <h2 id="fin-lem" className="mb-1 text-base font-semibold">Lembrar hoje</h2>
          <p className="mb-3 text-xs text-muted-foreground">Régua de cobrança: 3 dias antes, no dia e 1, 5 e 10 dias depois do vencimento. A mensagem já vem pronta; revise e envie.</p>
          <ul className="divide-y divide-border">{f.lembrar.map((x) => <li key={x.id} className="flex flex-wrap items-center gap-3 py-2.5 text-sm"><span className="min-w-0 flex-1"><b className="block">{x.cliente}</b><span className="text-xs text-muted-foreground">{x.lembrete} · {formatBRL(x.valorCents)} · vence {dm(x.vencimento)}</span></span><AcoesDaCobranca id={x.id} aberta temLink={!!x.checkoutUrl} link={x.checkoutUrl} mensagem={x.mensagem} whatsapp={x.whatsappDigitos} conectada={f.conectada} compacto /></li>)}</ul>
        </section>
      ) : null}
      <section className="ds-card ds-card--flush" aria-labelledby="fin-lista">
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 pt-5"><h2 id="fin-lista" className="text-base font-semibold">Cobranças</h2>{f.conectada ? <ConferirPagamentos /> : null}</div>
        {f.lista.length ? (
          <ul className="mt-3 divide-y divide-border">
            {f.lista.map((x) => (
              <li key={x.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3 text-sm">
                <span className="min-w-0 flex-1 basis-60"><b className="block">{x.cliente}</b><span className="text-xs text-muted-foreground">{x.descricao} · vence {dm(x.vencimento)}{x.pagoComo === "MANUAL" && x.observacao ? ` · ${x.observacao}` : ""}</span></span>
                <span className="font-semibold tabular-nums">{formatBRL(x.valorCents)}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${TOM[x.mostrada]}`}>{ROTULO[x.mostrada]}</span>
                {x.situacao === "ABERTA" ? <AcoesDaCobranca id={x.id} aberta temLink={!!x.checkoutUrl} link={x.checkoutUrl} mensagem={x.mensagem} whatsapp={x.whatsappDigitos} conectada={f.conectada} /> : null}
              </li>
            ))}
          </ul>
        ) : <div className="p-5"><EmptyState icon={HandCoins} title="Nenhuma cobrança neste mês" description="Use &quot;Gerar cobranças do mês&quot;: sai uma mensalidade para cada cliente ativo com valor e vencimento no contrato." /></div>}
      </section>
    </div>
  );
}
