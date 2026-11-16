import Link from "next/link";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { Badge } from "@/components/ui/badge";
import { ETAPAS_ANUNCIO, mesaDeAnuncios } from "@/lib/domain/anuncios";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mesa de anúncios" };

const brl = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** Mesa de anúncios (D299): pedidos de campanha na Meta dos lojistas, por etapa. */
export default async function MesaAnunciosPage() {
  const s = await requireRole("NEXTLEVEL_MASTER");
  const lista = await mesaDeAnuncios(await getDb(), s.actor);
  const colunas = ETAPAS_ANUNCIO.filter((e) => e.status !== "RASCUNHO");
  const fora = lista.filter((a) => ["PAUSADA", "ENCERRADA", "CANCELADA"].includes(a.status));
  const Cartao = ({ a }: { a: (typeof lista)[number] }) => (
    <li>
      <Link href={`/master/anuncios/${a.id}`} className="block rounded-xl border border-border bg-surface p-3 text-sm shadow-xs hover:border-[var(--ds-primary)]">
        <b className="block break-words">{a.loja}</b>
        <span className="block break-words text-xs text-muted-foreground">{a.nome}</span>
        <span className="mt-1 block text-xs">{typeof a.diagnostico.verbaDiariaCents === "number" ? `${brl(a.diagnostico.verbaDiariaCents)}/dia na Meta` : ""}</span>
        <span className="mt-2 flex flex-wrap gap-1">
          {a.aguardandoResposta ? <Badge tone="danger" dot>Lojista escreveu</Badge> : null}
          {a.pendentesEquipe ? <Badge tone="warning">{a.pendentesEquipe} da equipe</Badge> : null}
          {a.pendentesLojista ? <Badge tone="neutral">{a.pendentesLojista} do lojista</Badge> : null}
        </span>
        <span className="mt-2 block text-[11px] text-muted-foreground">{a.responsavelNome ?? "sem responsável"} · {formatDateTime(a.updatedAt)}</span>
      </Link>
    </li>
  );
  return (
    <>
      <PageHeader eyebrow="Escritório" title="Mesa de anúncios" description="Pedidos de campanha na Meta que os lojistas fizeram pelo painel. Cada um tem uma sala que o lojista acompanha; o que você muda aqui aparece lá e chega por e-mail." />
      {lista.length === 0 ? <EmptyState title="Nenhum pedido ainda" description="Quando um lojista terminar o diagnóstico em Anúncios na Meta, o pedido aparece aqui." /> : (
        <div className="grid gap-3 overflow-x-auto pb-2 [grid-template-columns:repeat(7,minmax(14rem,1fr))]">
          {colunas.map((c) => {
            const col = lista.filter((a) => a.status === c.status);
            return (
              <section key={c.status} aria-label={c.rotulo} className="rounded-2xl border border-border bg-surface-muted/50 p-3">
                <h2 className="mb-3 text-sm font-bold">{c.rotulo} <span className="ml-1 rounded-full bg-surface px-2 py-0.5 text-xs tabular-nums text-muted-foreground">{col.length}</span></h2>
                {col.length ? <ul className="space-y-2">{col.map((a) => <Cartao key={a.id} a={a} />)}</ul> : <p className="rounded-lg border border-dashed border-border p-3 text-center text-xs text-muted-foreground">Ninguém aqui</p>}
              </section>
            );
          })}
        </div>
      )}
      {fora.length ? <section className="mt-6" aria-labelledby="fora-t"><h2 id="fora-t" className="mb-3 text-lg font-bold">Pausadas, encerradas e canceladas</h2><ul className="grid gap-2 md:grid-cols-3">{fora.map((a) => <Cartao key={a.id} a={a} />)}</ul></section> : null}
    </>
  );
}
