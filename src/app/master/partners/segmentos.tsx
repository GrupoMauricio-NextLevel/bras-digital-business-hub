"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Megaphone, Save, Trophy, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { FormField } from "@/components/app/form-field";
import type { Filtro } from "@/lib/domain/crm-parceiros";
import { avisarSegmentoAction, criarDesafioAction, encerrarDesafioAction, removerSegmentoAction, salvarSegmentoAction } from "@/app/actions/crm-parceiros";

/** Salvar o filtro atual como segmento, remover segmento e mandar aviso para o segmento (D251). */
export function AcoesDoSegmento({ filtro, total }: { filtro: Filtro; total: number }) {
  const router = useRouter();
  const [modo, setModo] = React.useState<"" | "salvar" | "avisar">("");
  const [nome, setNome] = React.useState("");
  const [titulo, setTitulo] = React.useState("");
  const [texto, setTexto] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const salvar = async () => { setBusy(true); const r = await salvarSegmentoAction(nome, filtro); setBusy(false); if (r.ok) { toast.success("Segmento salvo"); setModo(""); setNome(""); router.refresh(); } else toast.error(r.error); };
  const avisar = async () => { setBusy(true); const r = await avisarSegmentoAction(filtro, titulo, texto); setBusy(false); if (r.ok) { toast.success(`Aviso enviado para ${r.data.enviados} parceiro(s)`); setModo(""); setTitulo(""); setTexto(""); router.refresh(); } else toast.error(r.error); };
  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" onClick={() => setModo(modo === "salvar" ? "" : "salvar")}><Save /> Salvar segmento</Button>
        <Button size="sm" variant="secondary" disabled={!total} onClick={() => setModo(modo === "avisar" ? "" : "avisar")}><Megaphone /> Avisar {total} parceiro{total === 1 ? "" : "s"}</Button>
      </div>
      {modo === "salvar" ? (
        <div className="flex flex-wrap items-end gap-2 rounded-xl border border-border p-3">
          <FormField label="Nome do segmento" htmlFor="seg-nome"><Input id="seg-nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: agências Ouro em SP" /></FormField>
          <Button size="sm" loading={busy} disabled={nome.trim().length < 3} onClick={salvar}>Salvar</Button>
        </div>
      ) : null}
      {modo === "avisar" ? (
        <div className="grid gap-2 rounded-xl border border-border p-3">
          <p className="text-xs text-muted-foreground">O aviso aparece no painel de cada parceiro deste segmento e fica na linha do tempo de cada um.</p>
          <FormField label="Título" htmlFor="av-t"><Input id="av-t" value={titulo} maxLength={80} onChange={(e) => setTitulo(e.target.value)} /></FormField>
          <FormField label="Mensagem" htmlFor="av-m"><Textarea id="av-m" rows={3} value={texto} maxLength={600} onChange={(e) => setTexto(e.target.value)} /></FormField>
          <div><Button size="sm" loading={busy} disabled={titulo.trim().length < 3 || texto.trim().length < 5} onClick={avisar}>Enviar aviso</Button></div>
        </div>
      ) : null}
    </div>
  );
}

export function RemoverSegmento({ id, nome }: { id: string; nome: string }) {
  const router = useRouter();
  return <button type="button" aria-label={`Remover o segmento ${nome}`} className="rounded-full p-0.5 text-muted-foreground hover:text-danger" onClick={async () => { const r = await removerSegmentoAction(id); if (r.ok) router.refresh(); else toast.error(r.error); }}><X className="size-3" aria-hidden /></button>;
}

/** Criar desafio do mês. */
export function NovoDesafio({ periodo }: { periodo: string }) {
  const router = useRouter();
  const [v, setV] = React.useState({ title: "", target: 3, bonusCents: 10_000, period: periodo, kinds: [] as string[] });
  const [busy, setBusy] = React.useState(false);
  const KINDS = [["AFFILIATE", "Criadores"], ["REPRESENTATIVE", "Representantes"], ["AGENCY", "Agências"], ["AGENCY_ELITE", "Agências Elite"]] as const;
  const criar = async () => { setBusy(true); const r = await criarDesafioAction(v); setBusy(false); if (r.ok) { toast.success("Desafio criado"); setV({ ...v, title: "" }); router.refresh(); } else toast.error(r.error); };
  return (
    <div className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-4">
        <FormField label="Nome do desafio" htmlFor="de-t" className="sm:col-span-2"><Input id="de-t" value={v.title} onChange={(e) => setV({ ...v, title: e.target.value })} placeholder="Ex.: 3 lojas na Black" /></FormField>
        <FormField label="Meta (lojas novas no mês)" htmlFor="de-m"><Input id="de-m" type="number" min={1} value={v.target} onChange={(e) => setV({ ...v, target: Number(e.target.value) })} /></FormField>
        <MoneyInput label="Bônus" id="de-b" valueCents={v.bonusCents} onChange={(c: number) => setV({ ...v, bonusCents: c })} />
        <FormField label="Mês" htmlFor="de-p"><Input id="de-p" type="month" value={v.period} onChange={(e) => setV({ ...v, period: e.target.value })} /></FormField>
      </div>
      <fieldset className="flex flex-wrap gap-3 text-sm"><legend className="mb-1 text-sm font-medium">Quem participa (nenhum marcado = todos)</legend>
        {KINDS.map(([k, l]) => <label key={k} className="flex items-center gap-1.5"><input type="checkbox" checked={v.kinds.includes(k)} onChange={(e) => setV({ ...v, kinds: e.target.checked ? [...v.kinds, k] : v.kinds.filter((x) => x !== k) })} />{l}</label>)}
      </fieldset>
      <div><Button size="sm" loading={busy} disabled={v.title.trim().length < 5} onClick={criar}><Trophy /> Criar desafio</Button></div>
    </div>
  );
}

export function EncerrarDesafio({ id }: { id: string }) {
  const router = useRouter();
  return <Button size="sm" variant="ghost" onClick={async () => { const r = await encerrarDesafioAction(id); if (r.ok) { toast.success("Desafio encerrado"); router.refresh(); } else toast.error(r.error); }}>Encerrar</Button>;
}
