"use client";
import { useState, useTransition } from "react";
import { Check, Copy, MessageCircle } from "lucide-react";
import { registrarResultadoAction } from "@/app/actions/business-academia";
import type { EtapaAcademia, Resultado } from "@/lib/domain/business/academia";
import { buttonVariants } from "@/components/ui/button";

/** Botões de um toque da recepção (A1, D307): o que aparece depende da etapa. */
const BOTOES: Record<EtapaAcademia, { r: Resultado; rotulo: string; forte?: boolean }[]> = {
  interessado: [{ r: "perdeu", rotulo: "Desistiu" }],
  marcada: [{ r: "veio", rotulo: "Veio", forte: true }, { r: "nao_veio", rotulo: "Não veio" }],
  confirmar: [{ r: "veio", rotulo: "Veio", forte: true }, { r: "nao_veio", rotulo: "Não veio" }],
  veio: [{ r: "matriculou", rotulo: "Matriculou", forte: true }, { r: "perdeu", rotulo: "Desistiu" }],
  nao_veio: [{ r: "reabrir", rotulo: "Remarcar" }, { r: "perdeu", rotulo: "Desistiu" }],
  matriculou: [{ r: "reabrir", rotulo: "Desfazer" }],
  perdido: [{ r: "reabrir", rotulo: "Reabrir" }],
};

export function AcoesContato({ id, etapa, whatsappHref }: { id: string; etapa: EtapaAcademia; whatsappHref: string | null }) {
  const [pendente, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  return (
    <div className="flex flex-wrap items-center gap-2">
      {whatsappHref ? (
        <a href={whatsappHref} target="_blank" rel="noopener" className={buttonVariants({ variant: "secondary", size: "sm" })}><MessageCircle className="size-4" aria-hidden />WhatsApp</a>
      ) : null}
      {BOTOES[etapa].map((b) => (
        <button
          key={b.r}
          type="button"
          disabled={pendente}
          className={buttonVariants({ variant: b.forte ? "primary" : "secondary", size: "sm" })}
          onClick={() => {
            const motivo = b.r === "perdeu" ? window.prompt("Motivo (opcional): preço, horário, distância, outra academia…") ?? undefined : undefined;
            setErro(null);
            iniciar(async () => { const r = await registrarResultadoAction(id, b.r, { motivo }); if (!r.ok) setErro(r.error); });
          }}
        >
          {b.rotulo}
        </button>
      ))}
      {erro ? <span className="text-sm text-danger" role="alert">{erro}</span> : null}
    </div>
  );
}

export function CopiarLink({ url }: { url: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button type="button" className={`${buttonVariants({ variant: "secondary", size: "sm" })} shrink-0`} onClick={async () => { try { await navigator.clipboard.writeText(url); setOk(true); setTimeout(() => setOk(false), 2000); } catch { window.prompt("Copie o link:", url); } }}>
      {ok ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}{ok ? "Copiado" : "Copiar"}
    </button>
  );
}
