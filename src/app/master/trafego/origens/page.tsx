import Link from "next/link";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { origensPorCanal } from "@/lib/domain/trafego/coletor";
import { clientesPorConteudo, robosNoSite } from "@/lib/domain/trafego/conteudo";
import { GRUPO_CONHECEU } from "@/lib/trafego/conheceu";
import { formatBRL } from "@/lib/money";
import { ROTULO_CANAL, ehCanalPago } from "@/lib/trafego/canal";
import { AbasTrafego } from "../abas";

export const dynamic = "force-dynamic";
export const metadata = { title: "Origens · Tráfego" };

const PERIODOS = [7, 30, 90] as const;
const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 1000) / 10}%` : "—");
function variacao(atual: number, anterior: number) {
  if (!anterior) return atual ? "novo" : "—";
  const v = Math.round(((atual - anterior) / anterior) * 100);
  return `${v > 0 ? "+" : ""}${v}%`;
}

/** Tráfego e campanhas → Origens (TR2, D291): visitas, WhatsApp, cadastro e leads por canal e por campanha. */
export default async function OrigensPage({ searchParams }: { searchParams: Promise<{ dias?: string }> }) {
  const s = await requireRole("NEXTLEVEL_MASTER");
  const pedido = Number((await searchParams).dias);
  const dias = (PERIODOS as readonly number[]).includes(pedido) ? (pedido as 7 | 30 | 90) : 30;
  const db = await getDb();
  const [o, conteudo, robos] = await Promise.all([origensPorCanal(db, s.actor, dias), clientesPorConteudo(db, s.actor, dias), robosNoSite(db, s.actor, dias)]);
  const th = "px-3 py-2 text-left font-semibold";
  const td = "px-3 py-2 tabular-nums";
  return (
    <>
      <PageHeader eyebrow="Crescimento" title="Tráfego e campanhas" description="De onde vieram as visitas no período e quantas viraram clique no WhatsApp, ida ao cadastro ou contato deixado." />
      <AbasTrafego ativa="origens" />
      <nav aria-label="Período" className="mb-4 flex flex-wrap gap-2">
        {PERIODOS.map((p) => <Link key={p} href={`/master/trafego/origens?dias=${p}`} aria-current={p === dias ? "page" : undefined} className={`ds-btn ds-btn--sm ${p === dias ? "" : "ds-btn--ghost"}`}>Últimos {p} dias</Link>)}
      </nav>
      <section className="ds-card min-w-0 text-sm" aria-labelledby="canais-t">
        <h2 id="canais-t" className="text-lg font-bold">Por canal</h2>
        <p className="mt-1 text-muted-foreground">{o.total.sessoes} {o.total.sessoes === 1 ? "visita" : "visitas"} ({variacao(o.total.sessoes, o.total.anteriores)} contra os {dias} dias anteriores) · {o.total.leads} {o.total.leads === 1 ? "contato" : "contatos"} deixados.</p>
        {o.linhas.length === 0 ? <p className="mt-4 rounded-xl bg-surface-muted px-4 py-6 text-center text-muted-foreground">Ainda não há visitas medidas neste período.</p> : (
          <div className="mt-4 overflow-x-auto" tabIndex={0} role="region" aria-label="Tabela de canais (role para os lados)">
            <table className="w-full min-w-[44rem] border-collapse">
              <caption className="sr-only">Visitas e resultados por canal nos últimos {dias} dias</caption>
              <thead className="border-b border-border text-muted-foreground"><tr><th scope="col" className={th}>Canal</th><th scope="col" className={th}>Visitas</th><th scope="col" className={th}>Antes</th><th scope="col" className={th}>Páginas por visita</th><th scope="col" className={th}>WhatsApp</th><th scope="col" className={th}>Cadastro</th><th scope="col" className={th}>Contatos</th><th scope="col" className={th}>% contato</th></tr></thead>
              <tbody className="divide-y divide-border">
                {o.linhas.map((l) => (
                  <tr key={l.canal}>
                    <th scope="row" className="px-3 py-2 text-left font-normal"><Badge tone={ehCanalPago(l.canal) ? "info" : "neutral"}>{ROTULO_CANAL[l.canal] ?? l.canal}</Badge></th>
                    <td className={`${td} font-semibold`}>{l.sessoes}</td>
                    <td className={`${td} text-muted-foreground`}>{variacao(l.sessoes, l.anteriores)}</td>
                    <td className={td}>{l.sessoes ? (l.paginas / l.sessoes).toFixed(1).replace(".", ",") : "—"}</td>
                    <td className={td}>{l.whatsapp}</td>
                    <td className={td}>{l.cadastros}</td>
                    <td className={`${td} font-semibold`}>{l.leads}</td>
                    <td className={td}>{pct(l.leads, l.sessoes)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <section className="ds-card mt-6 min-w-0 text-sm" aria-labelledby="campanhas-t">
        <h2 id="campanhas-t" className="text-lg font-bold">Campanhas que mais trouxeram visitas</h2>
        <p className="mt-1 text-muted-foreground">Pela etiqueta utm_campaign dos links. Use os links rastreados para que toda campanha apareça aqui.</p>
        {o.campanhas.length === 0 ? <p className="mt-4 text-muted-foreground">Nenhuma visita com campanha no período.</p> : (
          <ul className="mt-3 divide-y divide-border">
            {o.campanhas.map((c) => (
              <li key={`${c.canal}-${c.campanha}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2">
                <span className="min-w-0 break-all font-semibold">{c.campanha}</span>
                <Badge tone={ehCanalPago(c.canal) ? "info" : "neutral"}>{ROTULO_CANAL[c.canal] ?? c.canal}</Badge>
                <span className="text-muted-foreground">{c.sessoes} {c.sessoes === 1 ? "visita" : "visitas"} · {c.whatsapp} WhatsApp · {c.cadastros} cadastro · <b className="text-foreground">{c.leads} {c.leads === 1 ? "contato" : "contatos"}</b></span>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="ds-card mt-6 min-w-0 text-sm" aria-labelledby="cidades-t">
        <h2 id="cidades-t" className="text-lg font-bold">De quais cidades</h2>
        <p className="mt-1 text-muted-foreground">Cidade aproximada pela conexão de internet. No celular, às vezes aparece a cidade da central da operadora.</p>
        {o.cidades.length === 0 ? <p className="mt-4 text-muted-foreground">Ainda não há visitas medidas neste período.</p> : (
          <ul className="mt-3 grid gap-x-6 sm:grid-cols-2">
            {o.cidades.map((c) => (
              <li key={c.local} className="flex items-baseline justify-between gap-3 border-b border-border py-2">
                <span className="min-w-0 break-words">{c.local}</span>
                <span className="shrink-0 tabular-nums text-muted-foreground"><b className="text-foreground">{c.sessoes}</b> {c.sessoes === 1 ? "visita" : "visitas"} · {c.leads} {c.leads === 1 ? "contato" : "contatos"}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
      {/* D303: o que cada página trouxe de cliente, o "Como nos conheceu?" e os robôs de busca e de IA. */}
      <section className="ds-card mt-6 min-w-0 text-sm" aria-labelledby="paginas-t">
        <h2 id="paginas-t" className="text-lg font-bold">Páginas que trouxeram clientes</h2>
        <p className="mt-1 text-muted-foreground">Página por onde a pessoa entrou no site da primeira vez, para cada contato deixado ou loja criada nos últimos {dias} dias. Pagantes e mensalidades são de hoje; &quot;Fechado no Comercial&quot; é o valor marcado em Fechou negócio.</p>
        {conteudo.paginas.length === 0 ? <p className="mt-4 rounded-xl bg-surface-muted px-4 py-6 text-center text-muted-foreground">Nenhum contato com origem registrada neste período.</p> : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[40rem] border-collapse">
              <caption className="sr-only">Contatos, lojas, pagantes e valores por página de entrada nos últimos {dias} dias</caption>
              <thead className="border-b border-border text-muted-foreground"><tr><th scope="col" className={th}>Página de entrada</th><th scope="col" className={th}>Contatos</th><th scope="col" className={th}>Lojas criadas</th><th scope="col" className={th}>Pagantes</th><th scope="col" className={th}>Mensalidades</th><th scope="col" className={th}>Fechado no Comercial</th></tr></thead>
              <tbody className="divide-y divide-border">
                {conteudo.paginas.slice(0, 25).map((p) => (
                  <tr key={p.pagina}>
                    <th scope="row" className="max-w-[18rem] break-all px-3 py-2 text-left font-medium">{p.pagina}</th>
                    <td className={td}>{p.contatos}</td>
                    <td className={td}>{p.contas}</td>
                    <td className={`${td} font-semibold`}>{p.pagantes}</td>
                    <td className={td}>{p.mensalCents ? `${formatBRL(p.mensalCents)}/mês` : "—"}</td>
                    <td className={td}>{p.fechadoCents ? formatBRL(p.fechadoCents) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <section className="ds-card mt-6 min-w-0 text-sm" aria-labelledby="conheceu-t">
        <h2 id="conheceu-t" className="text-lg font-bold">Como disseram que conheceram a NextLevel</h2>
        <p className="mt-1 text-muted-foreground">Resposta (opcional) no cadastro da loja e no &quot;Quero minha loja&quot;. É o jeito de medir quem chega por uma inteligência artificial sem deixar rastro.</p>
        {conteudo.conheceu.respostas.length === 0 ? <p className="mt-4 text-muted-foreground">Ninguém respondeu neste período{conteudo.conheceu.semResposta ? ` (${conteudo.conheceu.semResposta} ${conteudo.conheceu.semResposta === 1 ? "contato" : "contatos"} sem resposta)` : ""}.</p> : (
          <>
            <ul className="mt-3 grid gap-x-6 sm:grid-cols-2">
              {conteudo.conheceu.respostas.map((r) => (
                <li key={r.chave} className="flex items-baseline justify-between gap-3 border-b border-border py-2">
                  <span className="min-w-0 break-words">{r.rotulo} {r.grupo === "ia" ? <Badge tone="info">IA</Badge> : null}</span>
                  <span className="shrink-0 tabular-nums text-muted-foreground"><b className="text-foreground">{r.contatos}</b> {r.contatos === 1 ? "contato" : "contatos"} · {r.pagantes} {r.pagantes === 1 ? "pagante" : "pagantes"}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-muted-foreground">Grupos: {Object.values(GRUPO_CONHECEU).join(", ")}. Sem resposta: {conteudo.conheceu.semResposta}.</p>
          </>
        )}
      </section>
      <section className="ds-card mt-6 min-w-0 text-sm" aria-labelledby="robos-t">
        <h2 id="robos-t" className="text-lg font-bold">Robôs de busca e de IA que leram o site</h2>
        <p className="mt-1 text-muted-foreground">Visitas dos robôs do Google, Bing, ChatGPT, Claude, Perplexity e outros às páginas públicas nos últimos {dias} dias, e as páginas que cada um mais leu. Mostra se as páginas novas estão sendo lidas.</p>
        {robos.length === 0 ? <p className="mt-4 text-muted-foreground">Nenhuma visita de robô registrada ainda neste período.</p> : (
          <ul className="mt-3 divide-y divide-border">
            {robos.map((r) => (
              <li key={r.robo} className="py-2">
                <p className="flex flex-wrap items-baseline justify-between gap-2"><span className="font-semibold">{r.robo}</span><span className="tabular-nums text-muted-foreground"><b className="text-foreground">{r.visitas}</b> {r.visitas === 1 ? "visita" : "visitas"}</span></p>
                <p className="mt-0.5 break-all text-xs text-muted-foreground">{r.paginas.map((p) => `${p.caminho} (${p.visitas})`).join(" · ")}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
      <p className="mt-4 text-xs text-muted-foreground">Localização por IP: <a href="https://db-ip.com" className="underline" target="_blank" rel="noreferrer">DB-IP</a> (licença CC BY 4.0); o IP não é guardado. Visitas de quem recusou a medição no aviso de cookies e de robôs não entram. O detalhe fica 90 dias; depois, só o resumo por dia.</p>
    </>
  );
}
