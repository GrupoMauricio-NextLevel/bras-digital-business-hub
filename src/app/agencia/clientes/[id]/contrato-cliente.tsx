"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cancelarContratoAgenciaAction, enviarContratoAction, previaContratoAction } from "@/app/actions/agencias";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TextoDoContrato } from "@/components/agencia/texto-contrato";
import type { Secao } from "@/lib/contratos/loja-pronta-express";

const campo = "mt-1 w-full rounded-md border border-border bg-surface px-3 text-sm";

/** Gerar o contrato pelo modelo (D321): opções, prévia com o texto exato e envio ao portal do cliente. */
export function GerarContrato({ clienteId, hoje }: { clienteId: string; hoje: string }) {
  const router = useRouter();
  const [aberto, setAberto] = React.useState(false);
  const [o, setO] = React.useState({ inicio: hoje, vigenciaMeses: 12, avisoPrevioDias: 30, rodadasAjuste: 2, prazoAprovacaoDias: 3, extras: "" });
  const [previa, setPrevia] = React.useState<{ secoes: Secao[]; pendencias: string[] } | null>(null);
  const [pending, start] = React.useTransition();
  if (!aberto) return <Button variant="secondary" onClick={() => setAberto(true)}>Gerar contrato</Button>;
  const num = (k: "vigenciaMeses" | "avisoPrevioDias" | "rodadasAjuste" | "prazoAprovacaoDias", rotulo: string) => <label className="text-sm font-medium">{rotulo}<Input type="number" min={0} value={o[k]} onChange={(e) => { setO({ ...o, [k]: Number(e.target.value) }); setPrevia(null); }} className="mt-1" /></label>;
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium">Início<Input type="date" value={o.inicio} onChange={(e) => { setO({ ...o, inicio: e.target.value }); setPrevia(null); }} className="mt-1" /></label>
        {num("vigenciaMeses", "Vigência (meses)")}
        {num("avisoPrevioDias", "Aviso prévio (dias)")}
        {num("rodadasAjuste", "Rodadas de ajuste por conteúdo")}
        {num("prazoAprovacaoDias", "Prazo do cliente para aprovar (dias úteis)")}
      </div>
      <label className="block text-sm font-medium">Combinados adicionais (opcional)<textarea rows={3} maxLength={4000} value={o.extras} onChange={(e) => { setO({ ...o, extras: e.target.value }); setPrevia(null); }} className={`${campo} py-2`} /></label>
      <p className="text-xs text-muted-foreground">É um modelo de referência em linguagem simples. Antes do primeiro envio, revise com o advogado da agência.</p>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" loading={pending} onClick={() => start(async () => { const r = await previaContratoAction(clienteId, o); if (r.ok) setPrevia(r.data); else toast.error(r.error); })}>Ver prévia</Button>
        <Button loading={pending} disabled={!previa || previa.pendencias.length > 0} onClick={() => start(async () => { const r = await enviarContratoAction(clienteId, o); if (r.ok) { toast.success(`Contrato ${r.data.numero} enviado. O cliente aceita pelo portal.`); setAberto(false); setPrevia(null); router.refresh(); } else toast.error(r.error); })}>Enviar ao cliente</Button>
        <Button variant="ghost" onClick={() => { setAberto(false); setPrevia(null); }}>Fechar</Button>
      </div>
      {previa ? previa.pendencias.length ? (
        <div role="alert" className="rounded-xl border border-warning/40 bg-warning-soft p-3 text-sm"><b>Falta preencher antes de enviar:</b><ul className="mt-1 list-disc pl-5">{previa.pendencias.map((p) => <li key={p}>{p}</li>)}</ul></div>
      ) : <div className="max-h-[480px] overflow-y-auto rounded-xl border border-border p-4" tabIndex={0} aria-label="Prévia do contrato"><TextoDoContrato secoes={previa.secoes} /></div> : null}
    </div>
  );
}

export function CancelarContrato({ id }: { id: string }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  return <Button size="sm" variant="ghost" loading={pending} onClick={() => { if (!confirm("Cancelar este contrato? O cliente deixa de vê-lo no portal.")) return; start(async () => { const r = await cancelarContratoAgenciaAction(id); if (r.ok) { toast.success("Contrato cancelado."); router.refresh(); } else toast.error(r.error); }); }}>Cancelar</Button>;
}
