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

export const dynamic = "force-dynamic";

const Chamas = ({ n }: { n: 1 | 2 | 3 }) => <span className="inline-flex" title={["Frio", "Morno", "Quente"][n - 1]} aria-label={`Temperatura: ${["fria", "morna", "quente"][n - 1]}`}>{[1, 2, 3].map((i) => <Flame key={i} className={`size-3.5 ${i <= n ? "text-[var(--ds-danger)]" : "text-[var(--ds-line)]"}`} aria-hidden />)}</span>;

function Cartao({ p }: { p: Pessoa }) {
  return (
    <li className="rounded-xl border border-border bg-surface p-3 text-sm shadow-xs">
      <div className="flex items-start justify-between gap-2">
        <Link href={`/master/comercial/${encodeURIComponent(p.chave)}`} className="min-w-0 font-bold hover:underline"><span className="block truncate">{p.nome}</span></Link>
        <Chamas n={p.temperatura} />
      </div>
      {p.empresa && p.empresa !== p.nome ? <p className="truncate text-xs text-muted-foreground">{p.empresa}</p> : null}
      <p className="mt-1 line-clamp-2 text-xs">{p.detalhe}</p>
      <p className="mt-1.5 text-[11px] text-muted-foreground">{p.origem} · desde {formatDate(p.desde)}</p>
      {p.proximaAcao ? <p className="mt-1.5 rounded-md bg-[var(--ds-soft)] px-2 py-1 text-xs"><b>Próximo:</b> {p.proximaAcao}{p.prazo ? ` · até ${formatDate(p.prazo)}` : ""}</p> : null}
      <div className="mt-2 flex items-center gap-2">
        {p.whatsappHref ? <a href={p.whatsappHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--ds-link)]"><MessageCircle className="size-3.5" aria-hidden />WhatsApp</a> : null}
        <span className="ml-auto text-[11px] text-muted-foreground">{p.responsavel ?? "sem responsável"}</span>
      </div>
    </li>
  );
}

/** Comercial (D202): o funil único do contato ao pagante, em quadro (etapas) ou lista (mais quentes primeiro). */
export default async function ComercialPage({ searchParams }: { searchParams: Promise<{ ver?: string }> }) {
  const s = await requireRole("NEXTLEVEL_MASTER");
  const ver = (await searchParams).ver === "lista" ? "lista" : "quadro";
  const pessoas = await funilComercial(await getDb(), s.actor);
  return (
    <>
      <PageHeader eyebrow="NextLevel Commerce" title="Comercial" description="Todo mundo que pode virar cliente, numa fila só: quem conversou, quem deixou contato e quem criou a loja. A etapa anda sozinha com o que a pessoa faz no sistema." actions={<AoVivo segundos={30} />} />
      <LinkTabs label="Ver como" active={ver} items={[{ key: "quadro", label: "Quadro por etapa", href: "/master/comercial" }, { key: "lista", label: "Lista (mais quentes primeiro)", href: "/master/comercial?ver=lista" }, { key: "ajustes", label: "Meta e mensagens", href: "/master/comercial/ajustes" }]} />
      {pessoas.length === 0 ? <EmptyState title="Ninguém no funil ainda" description="Quem conversar com o Maurício e deixar o WhatsApp, preencher o formulário ou criar uma loja aparece aqui." /> : ver === "quadro" ? (
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
