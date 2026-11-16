"use client";
import * as React from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { aceitarPropostaAction, cancelarAnuncioAction, marcarPendenciaAction, mensagemDaEquipeAction, mensagemDoLojistaAction } from "@/app/actions/anuncios";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type Res = { ok: true } | { ok: false; error: string };
function useAcao() {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const rodar = (f: () => Promise<Res>, ok: string, depois?: () => void) => start(async () => { const r = await f(); if (r.ok) { toast.success(ok); depois?.(); router.refresh(); } else toast.error(r.error); });
  return { pending, rodar };
}

/** Marca um passo como feito (o lojista, os dele; a equipe, todos). */
export function MarcarPendencia({ id, chave, feito, rotulo, desabilitado }: { id: string; chave: string; feito: boolean; rotulo: string; desabilitado?: boolean }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  // Marca na hora; se o servidor recusar, volta como estava.
  const [marcado, setMarcado] = React.useState(feito);
  return (
    <input type="checkbox" className="mt-1 size-5 shrink-0 accent-[var(--ds-primary)]" checked={marcado} disabled={pending || desabilitado} aria-label={`${marcado ? "Desmarcar" : "Marcar como feito"}: ${rotulo}`}
      onChange={(e) => { const v = e.target.checked; setMarcado(v); start(async () => { const r = await marcarPendenciaAction(id, chave, v); if (r.ok) { toast.success(v ? "Passo marcado como feito" : "Passo desmarcado"); router.refresh(); } else { setMarcado(!v); toast.error(r.error); } }); }} />
  );
}

export function AceitarProposta({ id }: { id: string }) {
  const { pending, rodar } = useAcao();
  return <button type="button" disabled={pending} className="ds-btn" onClick={() => rodar(() => aceitarPropostaAction(id), "Proposta aceita! A equipe vai combinar o pagamento com você.")}>{pending ? "Aceitando…" : "Aceitar proposta"}</button>;
}

export function CancelarAnuncio({ id }: { id: string }) {
  const { pending, rodar } = useAcao();
  return (
    <ConfirmDialog title="Cancelar esta campanha?" description="A equipe para de trabalhar nela. Para anunciar depois, é só começar um diagnóstico novo." confirmLabel="Cancelar campanha" destructive
      onConfirm={() => rodar(() => cancelarAnuncioAction(id), "Campanha cancelada")}
      trigger={<button type="button" disabled={pending} className="ds-btn ds-btn--quiet ds-btn--sm">Cancelar campanha</button>} />
  );
}

/** Conversa da sala: o lojista fala com a equipe e vice-versa. */
export function NovaMensagem({ id, lado }: { id: string; lado: "LOJISTA" | "EQUIPE" }) {
  const [texto, setTexto] = React.useState("");
  const { pending, rodar } = useAcao();
  return (
    <form className="mt-4 flex items-end gap-2" onSubmit={(e) => { e.preventDefault(); rodar(() => (lado === "LOJISTA" ? mensagemDoLojistaAction(id, texto) : mensagemDaEquipeAction(id, texto)), "Mensagem enviada", () => setTexto("")); }}>
      <div className="min-w-0 flex-1">
        <label htmlFor={`msg-${id}`} className="sr-only">{lado === "LOJISTA" ? "Mensagem para a equipe" : "Mensagem para o lojista"}</label>
        <textarea id={`msg-${id}`} rows={2} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder={lado === "LOJISTA" ? "Escreva para a equipe de anúncios…" : "Escreva para o lojista (ele recebe por e-mail também)…"} className="w-full rounded-xl border border-border bg-surface px-3 py-2" />
      </div>
      <button type="submit" disabled={pending || texto.trim().length < 2} className="ds-btn shrink-0 gap-1"><Send className="size-4" aria-hidden />Enviar</button>
    </form>
  );
}
