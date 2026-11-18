import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { PageHeader } from "@/components/app/page-header";
import { TOM_SITUACAO, TextoDoContrato } from "@/components/agencia/texto-contrato";
import { MODELO_ROTULO, detalheDoContrato, mensagemDoContrato } from "@/lib/agencias/contratos";
import { hojeEmSaoPaulo } from "@/lib/agencias/clientes";
import { MEIOS_PAGAMENTO, type MeioPagamento } from "@/lib/contratos/projeto-constantes";
import { NotFoundError } from "@/lib/domain/errors";
import { formatBRL } from "@/lib/money";
import { AcoesDoContrato, BaixaDaParcela } from "../contratos-cliente";

export const dynamic = "force-dynamic";
export const metadata = { title: "Contrato" };

const dm = (iso: string) => iso.slice(0, 10).split("-").reverse().join("/");
const dataHora = (iso: string) => new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" });

/** Um contrato da agência (D342): situação, parcelas com "Recebi por fora", prova do aceite, texto congelado e ações. */
export default async function ContratoPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("AGENCY");
  const db = await getDb();
  const { id } = await params;
  const hoje = hojeEmSaoPaulo();
  const d = await detalheDoContrato(db, session.actor, id, hoje).catch((e) => { if (e instanceof NotFoundError) notFound(); throw e; });
  const c = d.contrato;
  const pct = d.pagamento.totalCents ? Math.round((d.pagamento.pagoCents / d.pagamento.totalCents) * 100) : 0;
  const card = "ds-card p-5 sm:p-6";
  return (
    <div className="mx-auto max-w-[1240px] space-y-5">
      <PageHeader backHref="/agencia/contratos" eyebrow={`Contrato ${c.numero}`} title={d.cliente.nome} description={`${MODELO_ROTULO[c.modelo]}${c.aditivoDeId ? " · aditivo" : ""}${c.origem === "MASTER" ? " · trazido do Master, com o aceite original" : ""}`}
        badge={<span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${TOM_SITUACAO[d.situacao.tom]}`}>{d.situacao.rotulo}</span>} />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
        <div className="space-y-5">
          {d.pagamento.totalCents ? (
            <section className={card} aria-labelledby="pg">
              <div className="flex flex-wrap items-baseline justify-between gap-2"><h2 id="pg" className="text-base font-semibold">Pagamento</h2><span className="text-sm tabular-nums"><b>{formatBRL(d.pagamento.pagoCents)}</b> <span className="text-muted-foreground">de {formatBRL(d.pagamento.totalCents)}</span></span></div>
              <span className="mt-2 block h-2 overflow-hidden rounded-full bg-surface-muted" aria-hidden><span className="block h-full rounded-full bg-success" style={{ width: `${pct}%` }} /></span>
              <p className="mt-1 text-xs text-muted-foreground">{d.pagamento.quitado ? "Tudo pago." : `${pct}% pago · faltam ${formatBRL(d.pagamento.faltaCents)}`}</p>
              <ul className="mt-3 divide-y divide-border">
                {d.parcelas.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3 text-sm">
                    <span className="min-w-0 flex-1 basis-56">
                      <b className="block">{p.descricao.split(" · ").pop()}</b>
                      <span className="text-xs text-muted-foreground">{p.situacao === "PAGA" ? `Pago em ${p.pagoEm ? dm(p.pagoEm) : "—"}${p.pagoMeio ? ` · ${MEIOS_PAGAMENTO[p.pagoMeio as MeioPagamento] ?? p.pagoMeio}` : ""}${p.registradoNoMaster ? " · registrado no caixa do Master" : ""}` : p.situacao === "CANCELADA" ? "Cancelada" : `Vence em ${dm(p.vencimento)}${p.atrasada ? " · em atraso" : ""}`}</span>
                    </span>
                    <span className="font-semibold tabular-nums">{formatBRL(p.valorCents)}</span>
                    {p.situacao === "PAGA" ? <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2.5 py-1 text-xs font-semibold text-success"><CheckCircle2 className="size-3.5" aria-hidden /> Paga</span>
                      : p.situacao === "ABERTA" ? <BaixaDaParcela id={p.id} hoje={hoje} /> : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          <section className={card} aria-labelledby="txt">
            <h2 id="txt" className="text-base font-semibold">{c.titulo}</h2>
            <p className="mb-3 mt-1 text-xs text-muted-foreground">Texto congelado no envio. É exatamente o que o cliente {c.status === "ENVIADO" ? "vai ler e aceitar" : "leu e aceitou"}.</p>
            <div className="max-h-[70vh] overflow-y-auto rounded-xl border border-border p-4" tabIndex={0} aria-label="Texto do contrato"><TextoDoContrato secoes={d.texto} /></div>
          </section>
        </div>
        <div className="space-y-5">
          <section className={card} aria-labelledby="acoes">
            <h2 id="acoes" className="mb-3 text-base font-semibold">Ações</h2>
            <AcoesDoContrato id={c.id} status={c.status} link={d.linkPortal} whatsapp={d.cliente.whatsapp} mensagem={mensagemDoContrato(c, d.cliente, d.agencia.nome, d.linkPortal)} />
            {c.status === "ACEITO" ? <Link href={`/agencia/contratos/novo?cliente=${d.cliente.id}`} className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-link underline underline-offset-4">Fazer um aditivo</Link> : null}
          </section>
          <section className={card} aria-labelledby="prova">
            <h2 id="prova" className="mb-2 flex items-center gap-2 text-base font-semibold"><ShieldCheck className="size-4 text-[var(--ds-link)]" aria-hidden /> Registro</h2>
            <dl className="space-y-2 text-sm">
              <div><dt className="text-muted-foreground">Enviado (assinatura da agência)</dt><dd className="font-medium">{dataHora(c.enviadoEm)}</dd></div>
              {c.aceitoEm ? <div><dt className="text-muted-foreground">Aceito pelo cliente</dt><dd className="font-medium">{c.aceitoNome} · {dataHora(c.aceitoEm)}{c.origem === "MASTER" ? " · no painel da loja" : " · no portal"}</dd><dd className="text-xs text-muted-foreground">{[c.aceitoEmail, c.aceitoIp ? `rede ${c.aceitoIp}` : null].filter(Boolean).join(" · ")}</dd></div> : <div><dt className="text-muted-foreground">Aceite</dt><dd className="font-medium">Aguardando o cliente no portal</dd></div>}
              {c.emailAceiteEnviadoEm ? <div><dt className="text-muted-foreground">Cópia assinada por e-mail</dt><dd className="font-medium">{dataHora(c.emailAceiteEnviadoEm)}</dd></div> : null}
              {c.encerradoEm ? <div><dt className="text-muted-foreground">Encerrado</dt><dd className="font-medium">{dataHora(c.encerradoEm)} · {c.encerradoMotivo}</dd></div> : null}
              {d.substitui ? <div><dt className="text-muted-foreground">Substitui</dt><dd><Link className="font-semibold text-link underline" href={`/agencia/contratos/${d.substitui.id}`}>{d.substitui.numero}</Link></dd></div> : null}
              {d.aditivos.length ? <div><dt className="text-muted-foreground">Aditivos</dt><dd className="flex flex-wrap gap-2">{d.aditivos.map((a) => <Link key={a.id} className="font-semibold text-link underline" href={`/agencia/contratos/${a.id}`}>{a.numero}</Link>)}</dd></div> : null}
              <div><dt className="text-muted-foreground">Impressão digital</dt><dd className="break-all font-mono text-xs">{c.hash}</dd><dd className={`text-xs ${d.integro ? "text-success" : "text-danger"}`}>{d.integro ? "Texto conferido: igual ao enviado." : "Atenção: o texto não confere com a impressão digital."}</dd></div>
            </dl>
          </section>
          <section className={card} aria-labelledby="cli">
            <h2 id="cli" className="mb-2 text-base font-semibold">Cliente</h2>
            <p className="text-sm">{[d.cliente.contatoNome, d.cliente.email].filter(Boolean).join(" · ") || "Sem contato cadastrado"}</p>
            <Link href={`/agencia/clientes/${d.cliente.id}`} className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-link underline underline-offset-4">Abrir a ficha e editar os dados</Link>
          </section>
        </div>
      </div>
    </div>
  );
}
