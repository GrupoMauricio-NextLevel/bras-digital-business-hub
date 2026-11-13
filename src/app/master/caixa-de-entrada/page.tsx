import Link from "next/link";
import { Inbox, Mail, Paperclip, Search } from "lucide-react";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { caixa, lerMensagem, podeUsarCaixa } from "@/lib/domain/caixa-entrada";
import { caixaConfigurada, ErroCaixa } from "@/lib/integrations/hostinger-mail";
import { CONTATOS } from "@/lib/contatos";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { Badge } from "@/components/ui/badge";
import { AcoesMensagem, Escrever, RespostaForm, SalvarInteressado } from "./forms";

export const dynamic = "force-dynamic";
export const metadata = { title: "Caixa de entrada" };

const NOME_PASTA: Record<string, string> = { INBOX: "Entrada", "INBOX.Sent": "Enviados", "INBOX.Drafts": "Rascunhos", "INBOX.Junk": "Spam", "INBOX.Trash": "Lixeira" };
const POR_USO: Record<string, string> = { "\\Sent": "Enviados", "\\Drafts": "Rascunhos", "\\Junk": "Spam", "\\Trash": "Lixeira", "\\Archive": "Arquivo" };
const nomePasta = (p: { path: string; name: string; specialUse?: string | null }) => NOME_PASTA[p.path] ?? (p.specialUse ? POR_USO[p.specialUse] : undefined) ?? p.name;
const quando = (iso: string) => { const d = new Date(iso); const hoje = new Date(); const mesmoDia = d.toDateString() === hoje.toDateString(); return new Intl.DateTimeFormat("pt-BR", mesmoDia ? { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" } : { day: "2-digit", month: "short", timeZone: "America/Sao_Paulo" }).format(d); };
const TIPO: Record<string, { rotulo: string; tom: "success" | "info" | "warning" | "neutral" }> = { LOJISTA: { rotulo: "Lojista", tom: "success" }, EQUIPE_LOJA: { rotulo: "Equipe de loja", tom: "success" }, PARCEIRO: { rotulo: "Parceiro", tom: "info" }, INTERESSADO: { rotulo: "Interessado", tom: "warning" }, MASTER: { rotulo: "Equipe NextLevel", tom: "neutral" }, OUTRO: { rotulo: "Conta", tom: "neutral" } };
const DESTINO: Record<string, string> = { contato: "contato@", suporte: "suporte@", financeiro: "financeiro@", comercial: "comercial@", parceiros: "parceiros@" };

/** Caixa de entrada (D296): a caixa da Hostinger dentro do Master, com quem é cada remetente no sistema. */
export default async function CaixaPage({ searchParams }: { searchParams: Promise<{ pasta?: string; uid?: string; q?: string; page?: string; novo?: string }> }) {
  const session = await requireRole("NEXTLEVEL_MASTER");
  const sp = await searchParams;
  if (!podeUsarCaixa(session.actor)) return <EmptyState icon={Inbox} title="Só o dono abre a caixa de entrada" description="A caixa tem mensagens de todos os clientes." />;
  if (!caixaConfigurada()) return (
    <>
      <PageHeader eyebrow="Escritório" title="Caixa de entrada" />
      <EmptyState icon={Mail} title="Ligue a caixa da Hostinger" description="Na Hostinger, em E-mails → Correio Agêntico → Acesso à API, crie um token e cole no Render como HOSTINGER_MAIL_TOKEN." />
    </>
  );
  const db = await getDb();
  const pasta = sp.pasta || "INBOX";
  const page = Math.max(1, Number(sp.page) || 1);
  const uid = Number(sp.uid) || 0;
  const url = (p: Record<string, string | number | undefined>) => { const q = new URLSearchParams(); const v = { pasta, ...p }; for (const [k, x] of Object.entries(v)) if (x !== undefined && x !== "" && !(k === "pasta" && x === "INBOX")) q.set(k, String(x)); const s = q.toString(); return `/master/caixa-de-entrada${s ? `?${s}` : ""}`; };
  let dados: Awaited<ReturnType<typeof caixa>>; let aberta: Awaited<ReturnType<typeof lerMensagem>> | null = null;
  try {
    dados = await caixa(db, session.actor, pasta, page, sp.q?.trim() || undefined);
    if (uid) aberta = await lerMensagem(db, session.actor, pasta, uid).catch(() => null);
  } catch (e) {
    return <><PageHeader eyebrow="Escritório" title="Caixa de entrada" /><EmptyState icon={Mail} title="Não deu para abrir a caixa agora" description={e instanceof ErroCaixa ? e.message : "Tente de novo em instantes."} /></>;
  }
  const destinos = dados.pastas.filter((p) => p.path !== pasta).map((p) => ({ path: p.path, nome: nomePasta(p) }));
  return (
    <>
      <PageHeader eyebrow="Escritório" title="Caixa de entrada" description={<>Os e-mails de {Object.values(DESTINO).join(", ")} chegam aqui. Responda sem sair do Master.</>} actions={<Escrever />} />
      <div className="grid gap-4 lg:grid-cols-[200px_minmax(0,1fr)]">
        <nav aria-label="Pastas" className="flex gap-1 overflow-x-auto lg:flex-col">
          {dados.pastas.map((p) => (
            <Link key={p.path} href={url({ pasta: p.path, page: undefined, uid: undefined, q: undefined })} aria-current={p.path === pasta ? "page" : undefined} className={`flex shrink-0 items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm ${p.path === pasta ? "bg-[var(--brand-signal)] font-semibold text-[var(--brand-on-signal)]" : "hover:bg-surface-muted"}`}>
              <span>{nomePasta(p)}</span>{p.unreadCount ? <span className="rounded-full bg-danger px-1.5 text-xs font-bold text-white">{p.unreadCount}</span> : null}
            </Link>
          ))}
        </nav>
        <div className={`grid gap-4 ${aberta ? "xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]" : ""}`}>
          <section aria-label="Mensagens" className="ds-card min-w-0 p-0">
            <form action="/master/caixa-de-entrada" className="flex gap-2 border-b p-3">
              <input type="hidden" name="pasta" value={pasta} />
              <label className="relative flex-1"><span className="sr-only">Buscar</span><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden /><input name="q" defaultValue={sp.q ?? ""} placeholder="Buscar por assunto, remetente ou texto" className="h-10 w-full rounded-lg border bg-surface pl-9 pr-3 text-sm" /></label>
            </form>
            {dados.data.length === 0 ? <div className="p-6"><EmptyState icon={Inbox} title={sp.q ? "Nada encontrado" : "Pasta vazia"} description={sp.q ? "Tente outra palavra." : "Quando chegar um e-mail, ele aparece aqui."} /></div> : (
              <ul className="divide-y">
                {dados.data.map((m) => {
                  const de = m.from[0]; const quem = de ? dados.remetentes.get(de.address.toLowerCase()) : undefined;
                  return (
                    <li key={m.uid}>
                      <Link href={url({ uid: m.uid, q: sp.q, page })} aria-current={m.uid === uid ? "true" : undefined} className={`block px-4 py-3 hover:bg-surface-muted ${m.uid === uid ? "bg-surface-muted" : ""}`}>
                        <div className="flex items-baseline justify-between gap-3">
                          <p className={`truncate text-sm ${m.unseen ? "font-bold" : ""}`}>{de?.name || de?.address || "(sem remetente)"}</p>
                          <span className="shrink-0 text-xs text-muted-foreground">{quando(m.date)}</span>
                        </div>
                        <p className={`truncate text-sm ${m.unseen ? "font-semibold" : "text-muted-foreground"}`}>{m.subject || "(sem assunto)"}</p>
                        <p className="mt-1 flex flex-wrap items-center gap-1.5">{quem ? <Badge tone={TIPO[quem.tipo]!.tom}>{TIPO[quem.tipo]!.rotulo}</Badge> : null}{m.attachments.some((a) => !a.inline) ? <Paperclip className="size-3.5 text-muted-foreground" aria-label="Tem anexo" /> : null}{m.flags.includes("\\Answered") ? <span className="text-xs text-muted-foreground">Respondido</span> : null}</p>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
            {!sp.q && dados.pagination.totalPages > 1 ? <p className="flex justify-between border-t p-3 text-sm">{page > 1 ? <Link className="underline" href={url({ page: page - 1 })}>← Mais novos</Link> : <span />}<span className="text-muted-foreground">{page} de {dados.pagination.totalPages}</span>{page < dados.pagination.totalPages ? <Link className="underline" href={url({ page: page + 1 })}>Mais antigos →</Link> : <span />}</p> : null}
          </section>
          {aberta ? (
            <article aria-labelledby="msg-t" className="ds-card min-w-0 p-5">
              <h2 id="msg-t" className="text-lg font-bold">{aberta.m.subject || "(sem assunto)"}</h2>
              <div className="mt-2 grid gap-1 text-sm">
                {aberta.m.from.map((a) => { const quem = aberta.remetentes.get(a.address.toLowerCase()); return <p key={a.address}><b>{a.name || a.address}</b> &lt;{a.address}&gt; {quem ? <>{" "}<Badge tone={TIPO[quem.tipo]!.tom}>{TIPO[quem.tipo]!.rotulo}</Badge>{quem.detalhe ? <span className="text-muted-foreground"> · {quem.detalhe}</span> : null}{quem.href ? <> · <Link className="underline" href={quem.href}>abrir no Master</Link></> : null}</> : <><span className="text-muted-foreground"> · ainda não está no sistema </span><SalvarInteressado email={a.address} nome={a.name || undefined} assunto={aberta.m.subject ?? undefined} /></>}</p>; })}
                <p className="text-muted-foreground">Para {aberta.m.to.map((a) => a.address).join(", ")}{aberta.destino ? <> · chegou em <b>{DESTINO[aberta.destino]}</b></> : null} · {new Date(aberta.m.date).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</p>
              </div>
              <AcoesMensagem pasta={pasta} uid={aberta.m.uid} destinos={destinos} />
              <div className="mt-4 max-h-[60vh] overflow-y-auto whitespace-pre-wrap break-words rounded-lg bg-surface-muted p-4 text-sm leading-relaxed">{aberta.corpo.text?.trim() || "(Mensagem só com conteúdo formatado; veja abaixo.)"}</div>
              {!aberta.corpo.text?.trim() && aberta.corpo.html ? <iframe title="Mensagem formatada" sandbox="" srcDoc={aberta.corpo.html} className="mt-3 h-[60vh] w-full rounded-lg border bg-white" /> : null}
              {aberta.m.attachments.filter((a) => !a.inline).length ? <ul className="mt-3 flex flex-wrap gap-2">{aberta.m.attachments.filter((a) => !a.inline).map((a) => <li key={a.id}><a className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm hover:bg-surface-muted" href={`/master/caixa-de-entrada/anexo?pasta=${encodeURIComponent(pasta)}&uid=${aberta!.m.uid}&id=${encodeURIComponent(a.id)}&nome=${encodeURIComponent(a.filename ?? "anexo")}`}><Paperclip className="size-4" aria-hidden />{a.filename ?? "anexo"} <span className="text-xs text-muted-foreground">({Math.ceil(a.sizeBytes / 1024)} KB)</span></a></li>)}</ul> : null}
              <RespostaForm pasta={pasta} uid={aberta.m.uid} para={aberta.m.from.map((a) => a.address)} assunto={/^re:/i.test(aberta.m.subject ?? "") ? aberta.m.subject! : `Re: ${aberta.m.subject ?? ""}`} saindoDe={CONTATOS.contato} />
            </article>
          ) : null}
        </div>
      </div>
    </>
  );
}
