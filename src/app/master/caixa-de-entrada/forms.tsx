"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FolderInput, UserPlus, MailOpen, PenSquare, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { salvarInteressadoAction, escreverAction, marcarAction, moverAction, responderAction } from "@/app/actions/caixa-entrada";

const lista = (s: string) => s.split(/[,;\s]+/).map((x) => x.trim()).filter(Boolean);

export function AcoesMensagem({ pasta, uid, destinos }: { pasta: string; uid: number; destinos: { path: string; nome: string }[] }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [destino, setDestino] = React.useState("");
  const rodar = (fn: () => Promise<{ ok: boolean; error?: string }>, ok: string, voltar = false) => start(async () => { const r = await fn(); if (r.ok) { toast.success(ok); if (voltar) router.push(`/master/caixa-de-entrada${pasta !== "INBOX" ? `?pasta=${encodeURIComponent(pasta)}` : ""}`); router.refresh(); } else toast.error(r.error ?? "Não deu certo."); });
  return (
    <div className="mt-3 flex flex-wrap items-end gap-2">
      <label className="grid gap-1 text-xs font-medium">Mover para
        <Select value={destino} onChange={(e) => setDestino(e.target.value)} className="h-9"><option value="">Escolha a pasta</option>{destinos.map((d) => <option key={d.path} value={d.path}>{d.nome}</option>)}</Select>
      </label>
      <Button size="sm" variant="secondary" disabled={!destino || pending} onClick={() => rodar(() => moverAction(pasta, uid, destino), "Mensagem movida.", true)}><FolderInput /> Mover</Button>
      <Button size="sm" variant="ghost" disabled={pending} onClick={() => rodar(() => marcarAction(pasta, uid, false), "Marcada como não lida.", true)}><MailOpen /> Marcar como não lida</Button>
    </div>
  );
}

export function RespostaForm({ pasta, uid, para, assunto, saindoDe }: { pasta: string; uid: number; para: string[]; assunto: string; saindoDe: string }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [v, setV] = React.useState({ para: para.join(", "), cc: "", assunto, texto: "" });
  return (
    <form className="mt-5 grid gap-2 border-t pt-4" aria-label="Responder" onSubmit={(e) => { e.preventDefault(); start(async () => {
      const r = await responderAction({ pasta, uid, para: lista(v.para), cc: lista(v.cc), assunto: v.assunto, texto: v.texto });
      if (r.ok) { toast.success("Resposta enviada."); setV({ ...v, texto: "" }); router.refresh(); } else toast.error(r.error ?? "Não foi possível enviar.");
    }); }}>
      <h3 className="text-sm font-semibold">Responder</h3>
      <label className="grid gap-1 text-xs font-medium">Para<Input value={v.para} onChange={(e) => setV({ ...v, para: e.target.value })} /></label>
      <label className="grid gap-1 text-xs font-medium">Cópia (opcional)<Input value={v.cc} onChange={(e) => setV({ ...v, cc: e.target.value })} placeholder="separe por vírgula" /></label>
      <label className="grid gap-1 text-xs font-medium">Assunto<Input value={v.assunto} onChange={(e) => setV({ ...v, assunto: e.target.value })} /></label>
      <label className="grid gap-1 text-xs font-medium">Mensagem<Textarea rows={7} value={v.texto} onChange={(e) => setV({ ...v, texto: e.target.value })} required /></label>
      <p className="text-xs text-muted-foreground">Sai da sua caixa da Hostinger, na mesma conversa. As respostas do cliente voltam para cá ({saindoDe}).</p>
      <div><Button type="submit" loading={pending} disabled={!v.texto.trim()}><Send /> Enviar resposta</Button></div>
    </form>
  );
}

export function Escrever() {
  const router = useRouter();
  const [aberto, setAberto] = React.useState(false);
  const [pending, start] = React.useTransition();
  const [v, setV] = React.useState({ para: "", assunto: "", texto: "" });
  if (!aberto) return <Button onClick={() => setAberto(true)}><PenSquare /> Escrever</Button>;
  return (
    <div role="dialog" aria-label="Novo e-mail" className="fixed inset-x-3 bottom-3 z-50 grid max-w-xl gap-2 rounded-2xl border bg-surface p-4 shadow-[var(--ds-shadow-lg)] sm:left-auto sm:right-6 sm:w-[32rem]">
      <div className="flex items-center justify-between"><p className="font-semibold">Novo e-mail</p><Button size="icon-sm" variant="ghost" aria-label="Fechar" onClick={() => setAberto(false)}><X /></Button></div>
      <form className="grid gap-2" onSubmit={(e) => { e.preventDefault(); start(async () => {
        const r = await escreverAction({ para: lista(v.para), assunto: v.assunto, texto: v.texto });
        if (r.ok) { toast.success("E-mail enviado."); setV({ para: "", assunto: "", texto: "" }); setAberto(false); router.refresh(); } else toast.error(r.error ?? "Não foi possível enviar.");
      }); }}>
        <label className="grid gap-1 text-xs font-medium">Para<Input value={v.para} onChange={(e) => setV({ ...v, para: e.target.value })} placeholder="email@cliente.com.br" required /></label>
        <label className="grid gap-1 text-xs font-medium">Assunto<Input value={v.assunto} onChange={(e) => setV({ ...v, assunto: e.target.value })} required /></label>
        <label className="grid gap-1 text-xs font-medium">Mensagem<Textarea rows={8} value={v.texto} onChange={(e) => setV({ ...v, texto: e.target.value })} required /></label>
        <div><Button type="submit" loading={pending}><Send /> Enviar</Button></div>
      </form>
    </div>
  );
}

export function SalvarInteressado({ email, nome, assunto }: { email: string; nome?: string; assunto?: string }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  return <Button size="sm" variant="secondary" disabled={pending} onClick={() => start(async () => { const r = await salvarInteressadoAction(email, nome, assunto); if (r.ok) { toast.success("Salvo como interessado no CRM."); router.refresh(); } else toast.error(r.error ?? "Não deu certo."); })}><UserPlus /> Salvar no CRM</Button>;
}
