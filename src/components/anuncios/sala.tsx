import { Check, Clock, Eye, MessageCircle, MousePointerClick, ShoppingBag, Users, Wallet } from "lucide-react";
import { ETAPAS_ANUNCIO, resumoDiagnostico, type Diagnostico, type Sala } from "@/lib/domain/anuncios";
import { formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { AceitarProposta, CancelarAnuncio, MarcarPendencia, NovaMensagem } from "./sala-acoes";

const brl = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const num = (n: number) => n.toLocaleString("pt-BR");
const data = (d: string) => d.split("-").reverse().join("/");
const QUEM = { VOCE: "Com você", EQUIPE: "Com a equipe NextLevel", META: "Com a Meta" } as const;

/** Etapas da campanha, da esquerda para a direita (no celular, em lista). */
export function Etapas({ status }: { status: Sala["anuncio"]["status"] }) {
  const i = ETAPAS_ANUNCIO.findIndex((e) => e.status === status);
  const fora = i < 0; // pausada, encerrada, cancelada
  return (
    <>
    {/* Celular: barra compacta; a lista completa aparece a partir de telas médias. */}
    {!fora ? (
      <div className="sm:hidden" aria-hidden>
        <div className="flex gap-1">{ETAPAS_ANUNCIO.map((e, n) => <span key={e.status} className={`h-1.5 flex-1 rounded-full ${n <= i ? "bg-[color:var(--ds-primary)]" : "bg-surface-muted"}`} />)}</div>
        <p className="mt-2 text-sm font-semibold">Etapa {i + 1} de {ETAPAS_ANUNCIO.length}: {ETAPAS_ANUNCIO[i]!.rotulo}</p>
      </div>
    ) : null}
    <ol className="sr-only sm:not-sr-only sm:grid sm:gap-2 sm:grid-cols-4 lg:grid-cols-8" aria-label="Etapas da campanha">
      {ETAPAS_ANUNCIO.map((e, n) => {
        const feito = !fora && n < i; const atual = !fora && n === i;
        return (
          <li key={e.status} aria-current={atual ? "step" : undefined} className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs ${atual ? "border-[var(--ds-primary)] bg-[var(--ds-soft)] font-semibold" : feito ? "border-border text-foreground" : "border-dashed border-border text-muted-foreground"}`}>
            <span className={`grid size-5 shrink-0 place-items-center rounded-full ${feito ? "bg-[color:var(--ds-primary)] text-white" : atual ? "border-2 border-[var(--ds-primary)]" : "border border-border"}`} aria-hidden>{feito ? <Check className="size-3" /> : null}</span>
            <span className="min-w-0">{e.rotulo}<span className="sr-only">{feito ? " (feito)" : atual ? " (agora)" : ""}</span></span>
          </li>
        );
      })}
    </ol>
    </>
  );
}

/**
 * Sala da campanha (D299): o lojista (e a equipe, no Master) veem a mesma coisa: em que etapa está, o que falta de cada
 * lado, a proposta, os números e a conversa. `lado` só muda quem pode marcar o quê e quem escreve.
 */
export function SalaDaCampanha({ s, lado, nomesProdutos = [] }: { s: Sala; lado: "LOJISTA" | "EQUIPE"; nomesProdutos?: string[] }) {
  const a = s.anuncio;
  const etapa = ETAPAS_ANUNCIO.find((e) => e.status === a.status);
  const abertas = a.pendencias.filter((p) => !p.feitoEm);
  const temNumeros = s.resultados.length > 0 || a.status === "NO_AR" || s.vendas.pedidos > 0 || !!s.metaAuto?.dias;
  // Com a sala ligada à conta do lojista (TR6, D302), os números vêm sozinhos da Meta; senão, os lançados pela equipe.
  const auto = s.metaAuto && s.metaAuto.dias > 0 ? s.metaAuto : null;
  const blocos = auto
    ? ([[Wallet, "Investido na Meta", brl(auto.gastoCents)], [Eye, "Vezes que o anúncio apareceu", num(auto.impressoes)], [MousePointerClick, "Cliques no link", num(auto.cliques)], [MessageCircle, "Conversas", num(auto.conversas)], [ShoppingBag, "Vendas na loja", `${s.vendas.pedidos} · ${brl(s.vendas.totalCents)}`]] as const)
    : ([[Wallet, "Investido na Meta", brl(s.totais.gastoCents)], [Users, "Pessoas alcançadas", num(s.totais.alcance)], [MousePointerClick, "Cliques", num(s.totais.cliques)], [MessageCircle, "Conversas", num(s.totais.conversas)], [ShoppingBag, "Vendas na loja", `${s.vendas.pedidos} · ${brl(s.vendas.totalCents)}`]] as const);
  const podeCancelar = lado === "LOJISTA" && !["NO_AR", "PAUSADA", "ENCERRADA", "CANCELADA"].includes(a.status);
  return (
    <div className="grid gap-6">
      <Etapas status={a.status} />

      <section className="ds-card" aria-labelledby="agora-t">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={a.status === "NO_AR" ? "success" : a.status === "CANCELADA" || a.status === "ENCERRADA" ? "neutral" : "info"} dot>{s.rotuloStatus}</Badge>
          {etapa ? <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Clock className="size-3.5" aria-hidden />{QUEM[etapa.quem]}</span> : null}
        </div>
        <h2 id="agora-t" className="mt-2 text-xl font-bold">{etapa?.titulo ?? s.rotuloStatus}</h2>
        <p className="mt-1 text-muted-foreground">{etapa?.agora ?? (a.status === "PAUSADA" ? "A campanha está pausada. Fale com a equipe pela conversa para voltar." : a.status === "ENCERRADA" ? "Campanha encerrada. Os números ficam aqui para consulta." : "Campanha cancelada.")}</p>
        <p className="mt-3 text-sm">{a.responsavelNome ? <>Seu especialista: <b>{a.responsavelNome}</b></> : "Um especialista da equipe vai assumir esta campanha."}</p>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
        <div className="grid min-w-0 content-start gap-6">
          {s.proposta ? (
            <section className="ds-card" aria-labelledby="prop-t">
              <h2 id="prop-t" className="text-lg font-bold">Proposta da equipe</h2>
              <ul className="mt-3 divide-y divide-border text-sm">
                {s.proposta.itens.map((it, i) => <li key={i} className="flex justify-between gap-3 py-2"><span>{it.description}</span><span className="tabular-nums">{brl(it.amountCents)}</span></li>)}
                {s.proposta.descontoCents ? <li className="flex justify-between gap-3 py-2 text-muted-foreground"><span>Desconto</span><span className="tabular-nums">−{brl(s.proposta.descontoCents)}</span></li> : null}
                <li className="flex justify-between gap-3 py-2 font-bold"><span>Total</span><span className="tabular-nums">{brl(s.proposta.totalCents)}</span></li>
              </ul>
              <p className="mt-2 text-xs text-muted-foreground">A verba dos anúncios não entra aqui: ela vai direto para a Meta, na sua conta de anúncios.{s.proposta.validaAte ? ` Válida até ${formatDateTime(s.proposta.validaAte)}.` : ""}</p>
              {s.proposta.termos ? <p className="mt-2 whitespace-pre-line text-sm">{s.proposta.termos}</p> : null}
              <div className="mt-4">{s.proposta.status === "SENT" ? (lado === "LOJISTA" ? <AceitarProposta id={a.id} /> : <p className="text-sm text-muted-foreground">Aguardando o aceite do lojista.</p>) : <Badge tone="success" icon={<Check />}>Aceita{s.proposta.aceitaEm ? ` em ${formatDateTime(s.proposta.aceitaEm)}` : ""}</Badge>}</div>
            </section>
          ) : null}

          {temNumeros ? (
            <section className="ds-card" aria-labelledby="num-t">
              <h2 id="num-t" className="text-lg font-bold">Números da campanha</h2>
              <dl className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-5">
                {blocos.map(([I, t, v]) => (
                  <div key={t} className="rounded-xl bg-surface-muted p-3"><dt className="flex items-center gap-1 text-xs text-muted-foreground"><I className="size-3.5" aria-hidden />{t}</dt><dd className="mt-1 text-lg font-bold tabular-nums">{v}</dd></div>
                ))}
              </dl>
              <p className="mt-2 text-xs text-muted-foreground">{auto ? <>Números lidos direto da sua conta de anúncios na Meta ({auto.dias} {auto.dias === 1 ? "dia" : "dias"}){auto.em ? `, atualizados em ${formatDateTime(auto.em)}` : ""}; a Meta ainda ajusta os últimos dias.</> : "Investido, alcance, cliques e conversas: números do Gerenciador de Anúncios, lançados pela equipe."} Vendas na loja: pedidos pagos com a etiqueta desta campanha, contados sozinhos.</p>
              {s.resultados.length ? (
                <ul className="mt-4 divide-y divide-border text-sm">
                  {s.resultados.map((r) => <li key={r.id} className="py-2"><b>{data(r.de)} a {data(r.ate)}</b>: {brl(r.gastoCents)} · {num(r.alcance)} pessoas · {num(r.cliques)} cliques{r.conversas ? ` · ${num(r.conversas)} conversas` : ""}{r.comentario ? <span className="block text-muted-foreground">{r.comentario}</span> : null}</li>)}
                </ul>
              ) : auto ? null : <p className="mt-3 text-sm text-muted-foreground">Os primeiros números chegam depois dos primeiros dias no ar.</p>}
            </section>
          ) : null}

          <section className="ds-card min-w-0" aria-labelledby="conv-t">
            <h2 id="conv-t" className="text-lg font-bold">Conversa com {lado === "LOJISTA" ? "a equipe" : "o lojista"}</h2>
            {s.eventos.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">Ainda não há mensagens.</p> : (
              <ol className="mt-4 space-y-3">
                {s.eventos.map((e) => {
                  const meu = e.autor === lado; const sist = e.autor === "SISTEMA" || e.tipo !== "MENSAGEM";
                  return (
                    <li key={e.id} className={sist ? "text-center" : meu ? "flex justify-end" : "flex justify-start"}>
                      {sist ? (
                        <p className="mx-auto inline-block max-w-full rounded-full bg-surface-muted px-3 py-1 text-xs text-muted-foreground">{e.autorNome ? <b className="text-foreground">{e.autorNome}: </b> : null}{e.texto} · {formatDateTime(e.criadoEm)}</p>
                      ) : (
                        <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${meu ? "rounded-br-sm bg-[color:var(--ds-primary)] text-white" : "rounded-bl-sm bg-surface-muted"}`}>
                          <p className={`text-xs ${meu ? "text-white/80" : "text-muted-foreground"}`}>{e.autorNome ?? (e.autor === "EQUIPE" ? "Equipe NextLevel" : "Lojista")} · {formatDateTime(e.criadoEm)}</p>
                          <p className="whitespace-pre-line break-words">{e.texto}</p>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>
            )}
            {a.status !== "CANCELADA" ? <NovaMensagem id={a.id} lado={lado} /> : null}
          </section>
        </div>

        <aside className="grid min-w-0 content-start gap-6">
          <section className="ds-card" aria-labelledby="pend-t">
            <h2 id="pend-t" className="text-lg font-bold">O que falta</h2>
            {a.pendencias.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">Os passos aparecem aqui depois do diagnóstico.</p> : (
              <ul className="mt-3 space-y-3">
                {a.pendencias.map((p) => {
                  const pode = lado === "EQUIPE" || (p.quem === "LOJISTA" && p.chave !== "aceite");
                  return (
                    <li key={p.chave} className="flex gap-3">
                      {pode ? <MarcarPendencia id={a.id} chave={p.chave} feito={!!p.feitoEm} rotulo={p.rotulo} /> : <span className={`mt-1 grid size-5 shrink-0 place-items-center rounded ${p.feitoEm ? "bg-[color:var(--ds-primary)] text-white" : "border border-border"}`} aria-hidden>{p.feitoEm ? <Check className="size-3.5" /> : null}</span>}
                      <span className="min-w-0 text-sm">
                        <span className={`font-semibold ${p.feitoEm ? "text-muted-foreground line-through" : ""}`}>{p.rotulo}</span>
                        <span className="ml-1 text-xs text-muted-foreground">({p.quem === "LOJISTA" ? (lado === "LOJISTA" ? "você" : "lojista") : "equipe"}{p.feitoEm ? ", feito" : ""})</span>
                        {p.dica && !p.feitoEm ? <span className="block text-muted-foreground">{p.dica}</span> : null}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
            {abertas.length === 0 && a.pendencias.length ? <p className="mt-3 text-sm font-semibold">Tudo em dia por aqui.</p> : null}
          </section>
          <section className="ds-card text-sm" aria-labelledby="diag-t">
            <h2 id="diag-t" className="text-lg font-bold">O diagnóstico</h2>
            <ul className="mt-2 space-y-1 text-muted-foreground">{resumoDiagnostico(a.diagnostico as Diagnostico, nomesProdutos).map((l) => <li key={l}>{l}</li>)}</ul>
            {lado === "EQUIPE" && s.linkAnuncio ? <p className="mt-3 break-all rounded-xl bg-surface-muted px-3 py-2 text-xs"><b className="text-foreground">Link para os anúncios</b> (as vendas com ele aparecem sozinhas): {s.linkAnuncio}</p> : null}
            {lado === "LOJISTA" ? <p className="mt-3 inline-flex items-center gap-1 text-xs text-muted-foreground"><Eye className="size-3.5" aria-hidden />Etiqueta da campanha: {a.utmCampaign}</p> : null}
          </section>
          {podeCancelar ? <div><CancelarAnuncio id={a.id} /></div> : null}
        </aside>
      </div>
    </div>
  );
}
