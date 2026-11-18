import { notFound } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { fichaDoContato, MOTIVOS_PERDA, SITUACAO_ROTULO } from "@/lib/business/contatos";
import { requireModulo } from "@/lib/business/modulos";
import { ROTULO_CANAL, type Canal } from "@/lib/trafego/canal";
import { formatBRL } from "@/lib/money";
import { NotFoundError } from "@/lib/domain/errors";
import { AndamentoDoContato } from "../contatos-cliente";
import { MauricioNoContato } from "./mauricio-contato";

export const dynamic = "force-dynamic";

const quando = (iso: string | null) => (iso ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(new Date(iso)) : "—");
const VIA = { FORMULARIO: "Formulário do site", WHATSAPP_CONFIRMADO: "Conversa no WhatsApp", MANUAL: "Lançado pela equipe" } as const;

/** Ficha do contato (NB3, D309): dados, de onde veio e o andamento até fechar. */
export default async function FichaDoContato({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("STORE_OWNER");
  const db = await getDb(); const store = session.store!;
  await requireModulo(db, session.actor, "contatos");
  const { id } = await params;
  const c = await fichaDoContato(db, session.actor, store.id, id).catch((e) => { if (e instanceof NotFoundError) notFound(); throw e; });
  const primeiro = c.nome.split(" ")[0] ?? c.nome;
  const wa = c.whatsapp ? `https://wa.me/${c.whatsapp.length <= 11 ? `55${c.whatsapp}` : c.whatsapp}?text=${encodeURIComponent(`Olá, ${primeiro}! Aqui é da ${store.name}. Recebemos o seu pedido${c.servicoNome ? ` de ${c.servicoNome}` : ""} pelo site.`)}` : null;
  const origem: [string, string | null][] = [
    ["Como chegou", VIA[c.via]], ["Canal", ROTULO_CANAL[c.canal as Canal] ?? c.canal], ["Campanha", c.utmCampaign], ["Peça", c.utmContent], ["Site de origem", c.origemSite],
    ["Clique de anúncio", Object.keys(c.clickIds).length ? Object.keys(c.clickIds).join(", ") : null], ["Página", c.pagina],
  ];
  return (
    <>
      <PageHeader backHref="/merchant/contatos" eyebrow={SITUACAO_ROTULO[c.situacao]} title={c.nome} description={`Chegou em ${quando(c.createdAt)}${c.primeiraRespostaEm ? ` · primeira resposta em ${quando(c.primeiraRespostaEm)}` : " · ainda sem resposta"}`}
        actions={wa ? <a href={wa} target="_blank" rel="noreferrer" className={buttonVariants()}><MessageCircle aria-hidden />Responder no WhatsApp</a> : c.email ? <a href={`mailto:${c.email}`} className={buttonVariants()}>Responder por e-mail</a> : null} />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Card><CardContent className="py-5">
          <h2 className="mb-3 text-base font-semibold">Andamento</h2>
          <AndamentoDoContato id={c.id} situacao={c.situacao} valorCents={c.valorCents} motivoPerda={c.motivoPerda} notas={c.notas} temResponsavel={!!c.responsavelId} motivos={MOTIVOS_PERDA} />
        </CardContent></Card>
        <div className="space-y-4">
          <Card><CardContent className="py-5"><MauricioNoContato id={c.id} whatsapp={c.whatsapp} /></CardContent></Card>
          <Card><CardContent className="space-y-2 py-5 text-sm">
            <h2 className="text-base font-semibold">Pedido</h2>
            <p><span className="text-muted-foreground">Serviço:</span> {c.servicoNome ?? "não informado"}</p>
            {c.mensagem ? <p className="whitespace-pre-wrap rounded-lg bg-surface-muted p-3">{c.mensagem}</p> : null}
            <p><span className="text-muted-foreground">WhatsApp:</span> {c.whatsapp ?? "—"}</p>
            <p><span className="text-muted-foreground">E-mail:</span> {c.email ?? "—"}</p>
            <p><span className="text-muted-foreground">Responsável:</span> {c.responsavelNome ?? "ninguém ainda"}</p>
            {c.situacao === "GANHO" && c.valorCents ? <p><span className="text-muted-foreground">Fechado em:</span> {formatBRL(c.valorCents)}</p> : null}
            {c.situacao === "PERDIDO" && c.motivoPerda ? <p><span className="text-muted-foreground">Motivo:</span> {c.motivoPerda}</p> : null}
          </CardContent></Card>
          <Card><CardContent className="py-5 text-sm">
            <h2 className="mb-2 text-base font-semibold">De onde veio</h2>
            <dl className="space-y-1.5">{origem.filter(([, v]) => v).map(([k, v]) => <div key={k} className="flex gap-3"><dt className="w-32 shrink-0 text-muted-foreground">{k}</dt><dd className="min-w-0 break-words">{v}</dd></div>)}</dl>
          </CardContent></Card>
        </div>
      </div>
    </>
  );
}
