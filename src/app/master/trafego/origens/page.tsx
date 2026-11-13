import Link from "next/link";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { origensPorCanal } from "@/lib/domain/trafego/coletor";
import { ROTULO_CANAL, ehCanalPago } from "@/lib/trafego/canal";
import { AbasTrafego } from "../abas";

export const dynamic = "force-dynamic";

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
  const o = await origensPorCanal(await getDb(), s.actor, dias);
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
          <div className="mt-4 overflow-x-auto">
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
      <p className="mt-4 text-xs text-muted-foreground">Localização por IP: <a href="https://db-ip.com" className="underline" target="_blank" rel="noreferrer">DB-IP</a> (licença CC BY 4.0); o IP não é guardado. Visitas de quem recusou a medição no aviso de cookies e de robôs não entram. O detalhe fica 90 dias; depois, só o resumo por dia.</p>
    </>
  );
}
