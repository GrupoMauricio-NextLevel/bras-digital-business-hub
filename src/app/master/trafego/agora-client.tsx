"use client";
import * as React from "react";
import { FileText, MessageCircle, UserPlus } from "lucide-react";
import { agoraNoSiteAction } from "@/app/actions/trafego";
import type { AgoraNoSite } from "@/lib/domain/trafego/coletor";
import { ROTULO_CANAL, ehCanalPago, type Canal } from "@/lib/trafego/canal";
import { Badge } from "@/components/ui/badge";

const hora = (iso: string) => new Date(iso).toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" });
const APARELHO: Record<string, string> = { MOBILE: "Celular", DESKTOP: "Computador", TABLET: "Tablet" };
const MARCA: Record<string, string> = { NEXTLEVEL_COMMERCE: "Commerce", NEXTLEVEL: "Grupo", SUPERDROP: "SuperDrop", BRAS_DIGITAL: "Brás", NEXTLEVEL_CARGAS: "Cargas", CREATORS_HUB: "Creators", CHINA_HUB: "China" };
const MARCO: Record<AgoraNoSite["marcos"][number]["tipo"], { rotulo: string; icone: React.ReactNode }> = {
  CLIQUE_WHATSAPP: { rotulo: "Clicou no WhatsApp", icone: <MessageCircle className="size-4" aria-hidden /> },
  INICIO_CADASTRO: { rotulo: "Foi para o cadastro", icone: <UserPlus className="size-4" aria-hidden /> },
  LEAD: { rotulo: "Deixou o contato", icone: <FileText className="size-4" aria-hidden /> },
};

function Barras({ titulo, itens, rotulo, vazio }: { titulo: string; itens: { chave: string; total: number }[]; rotulo: (k: string) => string; vazio: string }) {
  const max = Math.max(1, ...itens.map((i) => i.total));
  return (
    <section className="ds-card min-w-0 text-sm" aria-label={titulo}>
      <h2 className="text-base font-bold">{titulo}</h2>
      {itens.length === 0 ? <p className="mt-3 text-muted-foreground">{vazio}</p> : (
        <ul className="mt-3 space-y-2">
          {itens.map((i) => (
            <li key={i.chave}>
              <div className="flex items-baseline justify-between gap-3"><span className="min-w-0 truncate">{rotulo(i.chave)}</span><span className="font-semibold tabular-nums">{i.total}</span></div>
              <div className="mt-1 h-2 rounded-full bg-surface-muted" aria-hidden><div className="h-2 rounded-full bg-[color:var(--ds-primary)]" style={{ width: `${Math.max(4, (i.total / max) * 100)}%` }} /></div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** "Agora no site" (TR2, D291): pede de novo a cada 10 s só enquanto a aba está visível. */
export function AgoraAoVivo({ inicial }: { inicial: AgoraNoSite }) {
  const [d, setD] = React.useState(inicial);
  const [erro, setErro] = React.useState(false);
  React.useEffect(() => {
    const tick = async () => {
      if (document.visibilityState !== "visible") return;
      const r = await agoraNoSiteAction();
      if (r.ok) { setD(r.data); setErro(false); } else setErro(true);
    };
    const t = window.setInterval(() => { void tick(); }, 10_000);
    return () => window.clearInterval(t);
  }, []);
  const stats = [
    { rotulo: "Visitas hoje", valor: d.hoje.sessoes },
    { rotulo: "Cliques no WhatsApp hoje", valor: d.hoje.whatsapp },
    { rotulo: "Foram ao cadastro hoje", valor: d.hoje.cadastros },
    { rotulo: "Deixaram contato hoje", valor: d.hoje.leads },
  ];
  return (
    <div className="space-y-6">
      <section className="ds-card flex flex-wrap items-center justify-between gap-4" aria-live="polite" aria-label="Pessoas no site agora">
        <div>
          <p className="text-sm font-semibold text-muted-foreground"><span className="mr-2 inline-block size-2.5 animate-pulse rounded-full bg-[color:var(--ds-ok,#16a34a)] motion-reduce:animate-none" aria-hidden />Agora no site (últimos 5 minutos)</p>
          <p className="mt-1 text-5xl font-extrabold tabular-nums">{d.agora}<span className="ml-2 text-lg font-semibold text-muted-foreground">{d.agora === 1 ? "pessoa" : "pessoas"}</span></p>
        </div>
        <p className="text-xs text-muted-foreground">{erro ? "Não consegui atualizar agora; tento de novo em 10 s." : `Atualiza a cada 10 s · última às ${new Date(d.em).toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo" })}`}</p>
      </section>
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => <div key={s.rotulo} className="ds-card"><dt className="text-sm text-muted-foreground">{s.rotulo}</dt><dd className="mt-1 text-3xl font-bold tabular-nums">{s.valor}</dd></div>)}
      </dl>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Barras titulo="De onde vieram" itens={d.porCanal} rotulo={(k) => ROTULO_CANAL[k as Canal] ?? k} vazio="Ninguém no site agora." />
        <Barras titulo="Em qual página estão" itens={d.porPagina} rotulo={(k) => k} vazio="Ninguém no site agora." />
        <Barras titulo="Aparelho" itens={d.porAparelho} rotulo={(k) => APARELHO[k] ?? k} vazio="Ninguém no site agora." />
        <Barras titulo="Site" itens={d.porMarca} rotulo={(k) => MARCA[k] ?? k} vazio="Ninguém no site agora." />
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
        <section className="ds-card min-w-0 text-sm" aria-labelledby="entradas-t">
          <h2 id="entradas-t" className="text-base font-bold">Entradas na última hora</h2>
          {d.entradas.length === 0 ? <p className="mt-3 text-muted-foreground">Nenhuma visita na última hora.</p> : (
            <ul className="mt-3 divide-y divide-border">
              {d.entradas.map((e) => (
                <li key={e.id} className="py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold tabular-nums">{hora(e.quando)}</span>
                    <Badge tone={ehCanalPago(e.canal) ? "info" : "neutral"}>{ROTULO_CANAL[e.canal] ?? e.canal}</Badge>
                    {e.ativa ? <Badge tone="success" dot>No site</Badge> : null}
                    {e.whatsapp ? <Badge tone="outline" icon={<MessageCircle />}>WhatsApp</Badge> : null}
                    {e.cadastro ? <Badge tone="outline" icon={<UserPlus />}>Cadastro</Badge> : null}
                    {e.lead ? <Badge tone="success" icon={<FileText />}>Lead</Badge> : null}
                  </div>
                  <p className="mt-1 break-words text-muted-foreground">
                    {MARCA[e.brand] ?? e.brand} · {APARELHO[e.aparelho] ?? e.aparelho} · entrou em <span className="font-medium text-foreground">{e.entrada}</span>{e.atual !== e.entrada ? <> · agora em <span className="font-medium text-foreground">{e.atual}</span></> : null} · {e.paginas} {e.paginas === 1 ? "página" : "páginas"}
                    {e.campanha ? <> · campanha <span className="font-medium text-foreground">{e.campanha}</span>{e.peca ? ` / ${e.peca}` : ""}</> : null}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="ds-card min-w-0 text-sm" aria-labelledby="marcos-t">
          <h2 id="marcos-t" className="text-base font-bold">Momentos importantes (24 h)</h2>
          {d.marcos.length === 0 ? <p className="mt-3 text-muted-foreground">Ainda ninguém clicou no WhatsApp, foi ao cadastro ou deixou contato.</p> : (
            <ul className="mt-3 space-y-3">
              {d.marcos.map((m, i) => (
                <li key={`${m.quando}-${i}`} className="flex gap-3">
                  <span className="mt-0.5 text-link">{MARCO[m.tipo].icone}</span>
                  <span className="min-w-0"><b>{MARCO[m.tipo].rotulo}</b> às {hora(m.quando)}<br /><span className="text-muted-foreground">{ROTULO_CANAL[m.canal] ?? m.canal}{m.campanha ? ` · ${m.campanha}` : ""} · {m.caminho}</span></span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
