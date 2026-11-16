import QRCode from "qrcode";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { HOLDING_CODE, brandByCode, type BrandCode } from "@/lib/brand";
import { groupSiteUrl } from "@/lib/host-routing";
import { negocioAberto } from "@/lib/negocios";
import { FONTES_PADRAO, MEIOS_PADRAO, listarLinks } from "@/lib/domain/trafego/links";
import { ROTULO_CANAL, ehCanalPago } from "@/lib/trafego/canal";
import { diaDeBrasilia } from "@/lib/domain/visitas";
import { CopiarLink, FormNovoLink, LigarLink } from "./links-client";
import { AbasTrafego } from "../abas";

export const dynamic = "force-dynamic";
export const metadata = { title: "Links rastreados · Tráfego" };

const PROXIMAS = [
  { t: "Origem dos leads", d: "Canal, campanha e peça de cada lead no Comercial, e o botão Fechou/Perdeu (fase TR3)." },
  { t: "Campanhas", d: "Gasto da Meta e do Google lado a lado com contas e pagantes do CRM (fases TR4 a TR6)." },
  { t: "Reels", d: "Agenda, publicação e \"comente LOJA\" no direct com link rastreado (fase TR7)." },
];

/** Tráfego e campanhas → Links rastreados (TR1, D290). */
export default async function TrafegoPage() {
  const s = await requireRole("NEXTLEVEL_MASTER");
  const db = await getDb();
  const links = await listarLinks(db, s.actor);
  const baseDe = (code: BrandCode) => (code === HOLDING_CODE ? groupSiteUrl() : brandByCode(code).baseUrl).replace(/\/$/, "");
  const marcas = (["NEXTLEVEL_COMMERCE", HOLDING_CODE, "SUPERDROP", "BRAS_DIGITAL", "NEXTLEVEL_CARGAS"] as BrandCode[])
    .filter((c) => c === "NEXTLEVEL_COMMERCE" || c === HOLDING_CODE || negocioAberto(c))
    .map((c) => ({ code: c, nome: c === HOLDING_CODE ? "Grupo NextLevel (Soluções)" : brandByCode(c).name, base: baseDe(c) }));
  const linhas = await Promise.all(links.map(async (l) => {
    const curta = `${baseDe(l.brand)}/l/${l.codigo}`;
    return { ...l, curta, qr: await QRCode.toString(curta, { type: "svg", margin: 1, width: 160, color: { dark: "#1c1917", light: "#ffffff" } }) };
  }));
  const total7 = links.reduce((a, l) => a + l.cliques7, 0);
  return (
    <>
      <PageHeader eyebrow="Crescimento" title="Tráfego e campanhas" description="De onde vem cada visita: anúncio da Meta, do Google, Instagram, busca, IA, WhatsApp ou indicação. Comece pelos links rastreados." />
      <AbasTrafego ativa="links" />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
        <FormNovoLink marcas={marcas} fontes={FONTES_PADRAO} meios={MEIOS_PADRAO} mesAtual={diaDeBrasilia().slice(0, 7)} />
        <section className="ds-card min-w-0 text-sm" aria-labelledby="links-t">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="links-t" className="text-lg font-bold">Links rastreados</h2>
            <p className="text-muted-foreground">{links.length} {links.length === 1 ? "link" : "links"} · {total7} {total7 === 1 ? "clique" : "cliques"} nos últimos 7 dias</p>
          </div>
          {linhas.length === 0 ? (
            <p className="mt-4 rounded-xl bg-surface-muted px-4 py-6 text-center text-muted-foreground">Nenhum link ainda. Crie o primeiro para a bio do Instagram (origem instagram, meio bio).</p>
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {linhas.map((l) => (
                <li key={l.id} className="grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="break-all font-mono font-semibold">/l/{l.codigo}</p>
                      <Badge tone={ehCanalPago(l.canal) ? "info" : "neutral"}>{ROTULO_CANAL[l.canal]}</Badge>
                      {!l.ativo ? <Badge tone="warning">Desligado</Badge> : null}
                    </div>
                    <p className="mt-1 break-all text-muted-foreground">Leva a <span className="font-medium text-foreground">{l.destino}</span> · {l.utmSource} / {l.utmMedium} / {l.utmCampaign}{l.utmContent ? ` / ${l.utmContent}` : ""}{l.utmTerm ? ` / ${l.utmTerm}` : ""}</p>
                    {l.nota ? <p className="mt-1 text-muted-foreground">{l.nota}</p> : null}
                    {l.avisos.length ? <p className="mt-1 text-xs text-[color:var(--ds-warn,#a16207)]">Fora do padrão de nomes: {l.avisos.join(" ")}</p> : null}
                    <dl className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
                      <div><dt className="inline text-muted-foreground">7 dias: </dt><dd className="inline font-semibold tabular-nums">{l.cliques7}</dd></div>
                      <div><dt className="inline text-muted-foreground">30 dias: </dt><dd className="inline font-semibold tabular-nums">{l.cliques30}</dd></div>
                      <div><dt className="inline text-muted-foreground">Desde o início: </dt><dd className="inline font-semibold tabular-nums">{l.cliquesTotal}</dd></div>
                    </dl>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <CopiarLink url={l.curta} />
                      <LigarLink id={l.id} ativo={l.ativo} />
                    </div>
                  </div>
                  <details className="self-start">
                    <summary className="cursor-pointer text-link">QR code</summary>
                    <div className="mt-2 w-40" role="img" aria-label={`QR code do link ${l.curta}`} dangerouslySetInnerHTML={{ __html: l.qr }} />
                  </details>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      <section className="mt-6" aria-labelledby="proximas-t">
        <h2 id="proximas-t" className="text-lg font-bold">O que entra nas próximas fases</h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PROXIMAS.map((p) => <li key={p.t} className="ds-card text-sm"><p className="font-semibold">{p.t}</p><p className="mt-1 text-muted-foreground">{p.d}</p></li>)}
        </ul>
      </section>
    </>
  );
}
