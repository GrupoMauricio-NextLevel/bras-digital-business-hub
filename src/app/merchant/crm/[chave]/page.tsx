import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { ETAPAS_LOJA, fichaClienteLoja } from "@/lib/domain/crm-loja";
import { NotFoundError } from "@/lib/domain/errors";
import { PageHeader } from "@/components/app/page-header";
import { formatBRL } from "@/lib/money";
import { formatDateTime } from "@/lib/utils";
import { FormAcompanhamentoLoja } from "./form";

export const dynamic = "force-dynamic";

/** Ficha do cliente da loja (D207): quem é, o que aconteceu e o que fazer a seguir. */
export default async function FichaClienteLojaPage({ params }: { params: Promise<{ chave: string }> }) {
  const s = await requireRole("STORE_OWNER");
  const chave = decodeURIComponent((await params).chave);
  const ficha = await fichaClienteLoja(await getDb(), s.actor, chave).catch((e) => { if (e instanceof NotFoundError) return null; throw e; });
  if (!ficha) notFound();
  const { cliente: p, linha, notas } = ficha;
  const etapa = ETAPAS_LOJA.find((e) => e.key === p.etapa)!;
  return (
    <>
      <PageHeader backHref="/merchant/crm" eyebrow={`Clientes · ${etapa.rotulo}`} title={p.nome} description={etapa.dica} />
      <div className="ds-grid ds-grid--main">
        <section className="ds-card" aria-labelledby="linha-t">
          <h2 id="linha-t" className="mb-3 text-lg font-bold">Linha do tempo</h2>
          {linha.length ? (
            <ol className="space-y-3">
              {linha.map((e, i) => (
                <li key={i} className="border-l-2 border-border pl-3 text-sm">
                  <p className="text-xs text-muted-foreground">{formatDateTime(e.em)}{e.autor ? ` · ${e.autor}` : ""}</p>
                  <p className="whitespace-pre-line">{e.texto}</p>
                </li>
              ))}
            </ol>
          ) : <p className="text-sm text-muted-foreground">Ainda não há histórico.</p>}
        </section>
        <aside className="grid content-start gap-4">
          <section className="ds-card text-sm" aria-labelledby="contato-t">
            <h2 id="contato-t" className="mb-2 text-lg font-bold">Contato</h2>
            <dl className="space-y-1.5">
              {([["E-mail", p.email], ["WhatsApp", p.whatsapp], ["Pedidos", String(p.pedidos)], ["Total gasto", formatBRL(p.gastoCents)], ["Etapa", etapa.rotulo]] as const).map(([k, v]) => (
                <div key={k} className="flex gap-2"><dt className="w-24 shrink-0 text-muted-foreground">{k}</dt><dd className="min-w-0 break-words font-medium">{v || "—"}</dd></div>
              ))}
            </dl>
            <div className="mt-4 flex flex-wrap gap-2">
              {p.whatsappHref ? <a href={p.whatsappHref} target="_blank" rel="noreferrer" className="ds-btn ds-btn--sm"><MessageCircle className="size-4" aria-hidden />WhatsApp</a> : null}
              {p.conversaId ? <Link href={`/merchant/atendimento?c=${p.conversaId}`} className="ds-btn ds-btn--sm ds-btn--secondary">Abrir conversa</Link> : null}
              {p.customerId ? <Link href={`/merchant/customers/${p.customerId}`} className="ds-btn ds-btn--sm ds-btn--secondary">Cadastro do cliente</Link> : null}
            </div>
          </section>
          <FormAcompanhamentoLoja chave={p.chave} proximaAcao={p.proximaAcao ?? ""} prazo={p.prazo?.slice(0, 10) ?? ""} notas={notas} />
        </aside>
      </div>
    </>
  );
}
