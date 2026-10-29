import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { ETAPAS_LOJA, clientesDaLoja, type ClienteLoja } from "@/lib/domain/crm-loja";
import { PageHeader } from "@/components/app/page-header";
import { LinkTabs } from "@/components/app/link-tabs";
import { EmptyState } from "@/components/app/empty-state";
import { AoVivo } from "@/components/master/ao-vivo";
import { formatBRL } from "@/lib/money";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

function Cartao({ p }: { p: ClienteLoja }) {
  return (
    <li className="rounded-xl border border-border bg-surface p-3 text-sm shadow-xs">
      <Link href={`/merchant/crm/${encodeURIComponent(p.chave)}`} className="block truncate font-bold hover:underline">{p.nome}</Link>
      <p className="mt-1 line-clamp-2 text-xs">{p.detalhe}</p>
      <p className="mt-1.5 text-[11px] text-muted-foreground">{p.ultimaCompra ? `Última compra ${formatDate(p.ultimaCompra)}` : `Desde ${formatDate(p.desde)}`}</p>
      {p.proximaAcao ? <p className="mt-1.5 rounded-md bg-[var(--ds-soft)] px-2 py-1 text-xs"><b>Próximo:</b> {p.proximaAcao}{p.prazo ? ` · até ${formatDate(p.prazo)}` : ""}</p> : null}
      <div className="mt-2 flex items-center gap-3">
        {p.whatsappHref ? <a href={p.whatsappHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--ds-link)]"><MessageCircle className="size-3.5" aria-hidden />WhatsApp</a> : null}
        {p.conversaId ? <Link href={`/merchant/atendimento?c=${p.conversaId}`} className="text-xs font-semibold text-[var(--ds-link)]">Conversa</Link> : null}
        {p.gastoCents ? <span className="ml-auto text-xs font-semibold tabular-nums">{formatBRL(p.gastoCents)}</span> : null}
      </div>
    </li>
  );
}

/** Clientes (CRM do lojista, D207): quem conversou, abandonou carrinho e comprou, em etapas que andam sozinhas. */
export default async function CrmLojaPage({ searchParams }: { searchParams: Promise<{ etapa?: string; ver?: string }> }) {
  const s = await requireRole("STORE_OWNER");
  const sp = await searchParams;
  const etapa = ETAPAS_LOJA.find((e) => e.key === sp.etapa)?.key;
  const ver = etapa ? "etapa" : sp.ver === "lista" ? "lista" : "quadro";
  const todos = await clientesDaLoja(await getDb(), s.actor);
  const pessoas = etapa ? todos.filter((p) => p.etapa === etapa) : todos;
  return (
    <>
      <PageHeader eyebrow="Escritório" title="Clientes" description="Todo mundo que passou pela sua loja numa fila só: quem perguntou no “Dúvidas?”, quem deixou o carrinho e quem comprou. A etapa anda sozinha; você anota a próxima ação e chama no WhatsApp com a mensagem pronta." actions={<AoVivo segundos={30} />} />
      <LinkTabs label="Ver como" active={etapa ?? ver} items={[{ key: "quadro", label: "Quadro por etapa", href: "/merchant/crm" }, { key: "lista", label: "Lista", href: "/merchant/crm?ver=lista" }, ...ETAPAS_LOJA.map((e) => ({ key: e.key, label: `${e.rotulo} (${todos.filter((p) => p.etapa === e.key).length})`, href: `/merchant/crm?etapa=${e.key}` }))]} />
      {pessoas.length === 0 ? <EmptyState title={etapa ? "Ninguém nesta etapa" : "Nenhum cliente ainda"} description="Quando alguém perguntar no “Dúvidas?” da loja, deixar produtos no carrinho ou comprar, aparece aqui." /> : ver === "quadro" ? (
        <div className="mt-4 grid gap-3 overflow-x-auto pb-2 [grid-template-columns:repeat(5,minmax(15rem,1fr))]">
          {ETAPAS_LOJA.map((e) => {
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
