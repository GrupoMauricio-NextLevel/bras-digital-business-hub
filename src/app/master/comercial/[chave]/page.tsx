import Link from "next/link";
import { ExternalLink, MessageCircle } from "lucide-react";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { ETAPAS, fichaCliente } from "@/lib/domain/comercial";
import { PageHeader } from "@/components/app/page-header";
import { formatDateTime } from "@/lib/utils";
import { FormAcompanhamento } from "./form";

export const dynamic = "force-dynamic";

/** Ficha 360 do cliente (D202): quem é, em que etapa está, o que aconteceu e o que fazer a seguir. */
export default async function FichaPage({ params }: { params: Promise<{ chave: string }> }) {
  const s = await requireRole("NEXTLEVEL_MASTER");
  const chave = decodeURIComponent((await params).chave);
  const { pessoa: p, linha, notas } = await fichaCliente(await getDb(), s.actor, chave);
  const etapa = ETAPAS.find((e) => e.key === p.etapa)!;
  return (
    <>
      <PageHeader backHref="/master/comercial" eyebrow={`Comercial · ${etapa.rotulo}`} title={p.nome} description={[p.empresa, p.origem].filter(Boolean).join(" · ")} />
      <div className="ds-grid ds-grid--main">
        <section className="ds-card" aria-labelledby="linha-t">
          <h2 id="linha-t" className="mb-3 text-lg font-bold">Linha do tempo</h2>
          {linha.length ? (
            <ol className="space-y-3">
              {linha.map((e, i) => (
                <li key={i} className="border-l-2 border-border pl-3 text-sm">
                  <p className="text-xs text-muted-foreground">{formatDateTime(e.em)} · {e.tipo === "conversa" ? e.autor : e.tipo === "loja" ? "Loja" : e.tipo === "nota" ? `Nota${e.autor ? ` de ${e.autor}` : ""}` : "Sistema"}</p>
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
              {([["E-mail", p.email], ["WhatsApp", p.whatsapp], ["Situação", p.situacao ? `${p.situacao.rotulo}${p.situacao.plano ? ` · ${p.situacao.plano}` : ""}` : "Ainda sem loja"], ["Etapa", `${etapa.rotulo}: ${etapa.dica}`], ["Detalhe", p.detalhe], ["Responsável", p.responsavel ?? "ninguém ainda"]] as const).map(([k, v]) => (
                <div key={k} className="flex gap-2"><dt className="w-24 shrink-0 text-muted-foreground">{k}</dt><dd className="min-w-0 break-words font-medium">{v || "—"}</dd></div>
              ))}
            </dl>
            <div className="mt-4 flex flex-wrap gap-2">
              {p.whatsappHref ? <a href={p.whatsappHref} target="_blank" rel="noreferrer" className="ds-btn ds-btn--sm"><MessageCircle className="size-4" aria-hidden />WhatsApp</a> : null}
              {p.conversaId ? <Link href={`/master/ia?c=${p.conversaId}`} className="ds-btn ds-btn--sm ds-btn--secondary">Abrir conversa</Link> : null}
              {p.storeId ? <Link href={`/master/clientes?q=${encodeURIComponent(p.email ?? p.empresa ?? "")}`} className="ds-btn ds-btn--sm ds-btn--secondary"><ExternalLink className="size-4" aria-hidden />Ver como lojista</Link> : null}
            </div>
          </section>
          <FormAcompanhamento chave={p.chave} proximaAcao={p.proximaAcao ?? ""} prazo={p.prazo?.slice(0, 10) ?? ""} notas={notas} perdido={p.etapa === "perdido"} temResponsavel={!!p.responsavel} />
        </aside>
      </div>
    </>
  );
}
