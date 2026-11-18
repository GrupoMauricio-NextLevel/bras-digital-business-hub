"use client";
import * as React from "react";
import { toast } from "sonner";
import { Copy, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sugestaoDoContatoAction } from "@/app/actions/contatos";

type Sugestao = { resumo: string; proximaAcao: string; resposta: string; origem: "ia" | "regras" };

/** Maurício no contato (D337): resumo, próxima ação e resposta para copiar. Nada é enviado sozinho. */
export function MauricioNoContato({ id, whatsapp }: { id: string; whatsapp: string | null }) {
  const [s, setS] = React.useState<Sugestao | null>(null);
  const [pending, start] = React.useTransition();
  const pedir = () => start(async () => { const r = await sugestaoDoContatoAction(id); if (r.ok) setS(r.data); else toast.error(r.error); });
  const copiar = async () => { if (!s) return; try { await navigator.clipboard.writeText(s.resposta); toast.success("Resposta copiada"); } catch { toast.error("Não deu para copiar; selecione o texto."); } };
  const wa = s && whatsapp ? `https://wa.me/${whatsapp.length <= 11 ? `55${whatsapp}` : whatsapp}?text=${encodeURIComponent(s.resposta)}` : null;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-base font-semibold"><Sparkles className="size-4 text-[var(--ds-link)]" aria-hidden />Pede pro Maurício</h2>
        <Button size="sm" variant={s ? "secondary" : "primary"} loading={pending} onClick={pedir}>{s ? "Pedir de novo" : "Resumo e resposta"}</Button>
      </div>
      {!s ? <p className="text-sm text-muted-foreground">O Maurício lê o pedido, diz o que fazer agora e escreve uma resposta para você copiar. Nada é enviado sozinho.</p> : (
        <div className="space-y-3 text-sm" aria-live="polite">
          <div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Resumo</p><p className="mt-1">{s.resumo}</p></div>
          <div className="rounded-lg border border-[var(--ds-link)]/30 bg-[var(--ds-link)]/5 p-3"><p className="text-xs font-semibold uppercase tracking-wide text-[var(--ds-link)]">Próxima ação</p><p className="mt-1 font-medium">{s.proximaAcao}</p></div>
          <div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Resposta sugerida</p><p className="mt-1 whitespace-pre-wrap rounded-lg bg-surface-muted p-3">{s.resposta}</p>
            <div className="mt-2 flex flex-wrap gap-2"><Button size="sm" variant="secondary" onClick={copiar}><Copy aria-hidden />Copiar</Button>{wa ? <a href={wa} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center rounded-md border border-border px-3 text-sm font-medium hover:bg-surface-muted">Abrir no WhatsApp</a> : null}</div>
          </div>
          <p className="text-xs text-muted-foreground">{s.origem === "ia" ? "Escrito pela IA do seu plano (conta na cota do mês). Confira antes de enviar." : "Sugestão automática pelas regras do painel. Com a IA do plano ligada, o Maurício escreve sob medida."}</p>
        </div>
      )}
    </div>
  );
}
