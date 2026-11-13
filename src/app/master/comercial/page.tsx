import Link from "next/link";
import { Flame, MessageCircle } from "lucide-react";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { ETAPAS, funilComercial, type Pessoa } from "@/lib/domain/comercial";
import { PageHeader } from "@/components/app/page-header";
import { LinkTabs } from "@/components/app/link-tabs";
import { EmptyState } from "@/components/app/empty-state";
import { AoVivo } from "@/components/master/ao-vivo";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ROTULO_CANAL, ehCanalPago, type Canal } from "@/lib/trafego/canal";
import { ROTULO_VIA } from "@/lib/domain/trafego/origem-contato";

export const dynamic = "force-dynamic";

const Chamas = ({ n }: { n: 1 | 2 | 3 }) => <span role="img" className="inline-flex" title={["Frio", "Morno", "Quente"][n - 1]} aria-label={`Temperatura: ${["fria", "morna", "quente"][n - 1]}`}>{[1, 2, 3].map((i) => <Flame key={i} className={`size-3.5 ${i <= n ? "text-[var(--ds-danger)]" : "text-[var(--ds-line)]"}`} aria-hidden />)}</span>;

function Cartao({ p }: { p: Pessoa }) {
  return (
    <li className="rounded-xl border border-border bg-surface p-3 text-sm shadow-xs">
      <div className="flex items-start justify-between gap-2">
        <Link href={`/master/comercial/${encodeURIComponent(p.chave)}`} className="min-w-0 font-bold hover:underline"><span className="block truncate">{p.nome}</span></Link>
        <Chamas n={p.temperatura} />
      </div>
      {p.empresa && p.empresa !== p.nome ? <p className="truncate text-xs text-muted-foreground">{p.empresa}</p> : null}
      <p className="mt-1 line-clamp-2 text-xs">{p.detalhe}</p>
      {p.fonte ? <p className="mt-1.5 flex min-w-0 flex-wrap items-center gap-1"><Badge tone={ehCanalPago(p.fonte.canal) ? "info" : "neutral"} className="max-w-full whitespace-normal text-left">{p.fonte.rotulo}</Badge>{p.fonte.campanha ? <span className="break-all text-[11px] text-muted-foreground">{p.fonte.campanha}</span> : null}{p.fonte.cidade ? <span className="text-[11px] text-muted-foreground">· {p.fonte.cidade}{p.fonte.uf ? `/${p.fonte.uf}` : ""}</span> : null}</p> : null}
      <p className="mt-1.5 text-[11px] text-muted-foreground">{p.fonte ? ROTULO_VIA[p.fonte.via] : p.origem} · desde {formatDate(p.desde)}</p>
      {p.proximaAcao ? <p className="mt-1.5 rounded-md bg-[var(--ds-soft)] px-2 py-1 text-xs"><b>Próximo:</b> {p.proximaAcao}{p.prazo ? ` · até ${formatDate(p.prazo)}` : ""}</p> : null}
      <div className="mt-2 flex items-center gap-2">
        {p.whatsappHref ? <a href={p.whatsappHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--ds-link)]"><MessageCircle className="size-3.5" aria-hidden />WhatsApp</a> : null}
        <span className="ml-auto text-[11px] text-muted-foreground">{p.responsavel ?? "sem responsável"}</span>
      </div>
    </li>
  );
}

/** Comercial (D202): o funil único do contato ao pagante, em quadro (etapas) ou lista (mais quentes primeiro). */
export default async function ComercialPage({ searchParams }: { searchParams: Promise<{ ver?: string; canal?: string }> }) {
  const s = await requireRole("NEXTLEVEL_MASTER");
  const sp = await searchParams;
  const ver = sp.ver === "lista" ? "lista" : "quadro";
  const todas = await funilComercial(await getDb(), s.actor);
  // Filtro por canal (TR3, D293): "sem" = origem ainda não registrada.
  const canal = sp.canal && (sp.canal === "sem" || sp.canal in ROTULO_CANAL) ? sp.canal : null;
  const pessoas = canal ? todas.filter((p) => (canal === "sem" ? !p.fonte : p.fonte?.canal === canal)) : todas;
  const contagem = new Map<string, number>();
  for (const p of todas) contagem.set(p.fonte?.canal ?? "sem", (contagem.get(p.fonte?.canal ?? "sem") ?? 0) + 1);
  const qs = (c: string | null) => { const q = new URLSearchParams(); if (ver === "lista") q.set("ver", "lista"); if (c) q.set("canal", c); const t = q.toString(); return `/master/comercial${t ? `?${t}` : ""}`; };
  return (
    <>
      <PageHeader eyebrow="NextLevel Commerce" title="Comercial" description="Todo mundo que pode virar cliente, numa fila só: quem conversou, quem deixou contato e quem criou a loja. A etapa anda sozinha com o que a pessoa faz no sistema." actions={<AoVivo segundos={30} />} />
      <LinkTabs label="Ver como" active={ver} items={[{ key: "quadro", label: "Quadro por etapa", href: "/master/comercial" }, { key: "lista", label: "Lista (mais quentes primeiro)", href: "/master/comercial?ver=lista" }, { key: "ajustes", label: "Meta e mensagens", href: "/master/comercial/ajustes" }]} />
      {todas.length ? (
        <nav aria-label="Filtrar por canal de origem" className="mt-3 flex flex-wrap gap-2 text-xs">
          <Link href={qs(null)} aria-current={!canal ? "page" : undefined} className={`rounded-full border px-3 py-1 ${!canal ? "border-[var(--ds-primary)] bg-[var(--ds-soft)] font-semibold" : "border-border"}`}>Todos os canais ({todas.length})</Link>
          {[...contagem].sort((a, b) => b[1] - a[1]).map(([c, n]) => (
            <Link key={c} href={qs(c)} aria-current={canal === c ? "page" : undefined} className={`rounded-full border px-3 py-1 ${canal === c ? "border-[var(--ds-primary)] bg-[var(--ds-soft)] font-semibold" : "border-border"}`}>{c === "sem" ? "Origem não registrada" : ROTULO_CANAL[c as Canal]} ({n})</Link>
          ))}
        </nav>
      ) : null}
      {pessoas.length === 0 && todas.length ? <p className="mt-4 text-sm text-muted-foreground">Ninguém com essa origem. <Link href={qs(null)} className="text-link underline">Ver todos</Link></p> : null}
      {todas.length === 0 ? <EmptyState title="Ninguém no funil ainda" description="Quem conversar com o Maurício e deixar o WhatsApp, preencher o formulário ou criar uma loja aparece aqui." /> : ver === "quadro" ? (
        <div className="mt-4 grid gap-3 overflow-x-auto pb-2 [grid-template-columns:repeat(7,minmax(15rem,1fr))]">
          {ETAPAS.map((e) => {
            const col = pessoas.filter((p) => p.etapa === e.key);
            return (
              <section key={e.key} aria-label={e.rotulo} className="rounded-2xl border border-border bg-surface-muted/50 p-3">
                <header className="mb-3"><h2 className="text-sm font-bold">{e.rotulo} <span className="ml-1 rounded-full bg-surface px-2 py-0.5 text-xs tabular-nums text-muted-foreground">{col.length}</span></h2><p className="text-xs text-muted-foreground">{e.dica}</p></header>
                {col.length ? <ul className="space-y-2">{col.map((p) => <Cartao key={p.chave} p={p} />)}</ul> : <p className="rounded-lg border border-dashed border-border p-3 text-center text-xs text-muted-foreground">Ninguém aqui</p>}
              </section>
            );
          })}
        </div>
      ) : (
        <ul className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">{pessoas.map((p) => <Cartao key={p.chave} p={p} />)}</ul>
      )}
    </>
  );
}
