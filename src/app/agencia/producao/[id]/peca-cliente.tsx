"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, RotateCcw } from "lucide-react";
import { atualizarPecaAction, avancarPecaAction, comentarPecaAction, pedirAjusteAction, transferirPecaAction } from "@/app/actions/agencias";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const campo = "mt-1 h-10 w-full rounded-md border border-border bg-surface px-3 text-sm";
type Opcao = { v: string; l: string };
function useAcao() {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const rodar = (fn: () => Promise<{ ok: true } | { ok: false; error: string }>, ok: string) => start(async () => { const r = await fn(); if (r.ok) { toast.success(ok); router.refresh(); } else toast.error(r.error); });
  return { pending, rodar };
}

/** Concluir a etapa (a peça vai sozinha para a próxima pessoa), mudar a situação, pedir ajuste e, para o gestor, transferir, prazo e prioridade. */
export function AcoesDaPeca(p: { id: string; etapa: string; situacao: string; situacoes: Opcao[]; proxima: string | null; requisito: string | null; podeAjuste: boolean; podeGerir: boolean; responsavelId: string | null; prazo: string | null; prioridade: "NORMAL" | "ALTA" | "URGENTE"; pessoas: { id: string; nome: string }[] }) {
  const { pending, rodar } = useAcao();
  const [motivo, setMotivo] = React.useState("");
  const [resp, setResp] = React.useState(p.responsavelId ?? "");
  const [prazo, setPrazo] = React.useState(p.prazo ?? "");
  const [prio, setPrio] = React.useState(p.prioridade);
  return (
    <div className="space-y-4">
      {p.proxima ? (
        <div>
          <Button loading={pending} disabled={!!p.requisito} onClick={() => rodar(() => avancarPecaAction(p.id), `Etapa concluída: seguiu para ${p.proxima}.`)}>Concluir e mandar para {p.proxima}<ArrowRight aria-hidden /></Button>
          {p.requisito ? <p className="mt-1.5 text-xs text-warning">{p.requisito}</p> : null}
        </div>
      ) : <p className="text-sm text-success">Peça concluída.</p>}
      {p.situacoes.length > 1 ? (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Situação na etapa">
          {p.situacoes.map((s) => <Button key={s.v} size="sm" variant={s.v === p.situacao ? "primary" : "secondary"} disabled={pending || s.v === p.situacao} onClick={() => rodar(() => atualizarPecaAction(p.id, { situacao: s.v }), `Situação: ${s.l}.`)}>{s.l}</Button>)}
        </div>
      ) : null}
      {p.podeAjuste ? (
        <fieldset className="rounded-xl border border-border p-3">
          <legend className="px-1 text-sm font-semibold">Pedir ajuste (volta para a edição)</legend>
          <label className="sr-only" htmlFor={`aj-${p.id}`}>O que precisa mudar</label>
          <textarea id={`aj-${p.id}`} value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={2} maxLength={2000} placeholder="O que precisa mudar" className={`${campo} h-auto py-2`} />
          <Button className="mt-2" size="sm" variant="secondary" disabled={motivo.trim().length < 3} loading={pending} onClick={() => rodar(() => pedirAjusteAction(p.id, motivo), "Ajuste pedido: voltou para a edição.")}><RotateCcw aria-hidden />Pedir ajuste</Button>
        </fieldset>
      ) : null}
      {p.podeGerir ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-sm font-medium">Responsável<select value={resp} onChange={(e) => setResp(e.target.value)} className={campo}><option value="" disabled>Escolha</option>{p.pessoas.map((x) => <option key={x.id} value={x.id}>{x.nome}</option>)}</select>
            {resp && resp !== p.responsavelId ? <Button className="mt-2" size="sm" loading={pending} onClick={() => rodar(() => transferirPecaAction(p.id, resp), "Peça transferida.")}>Transferir</Button> : null}</label>
          <label className="text-sm font-medium">Prazo da etapa<Input type="date" value={prazo} onChange={(e) => setPrazo(e.target.value)} className="mt-1" />
            {prazo !== (p.prazo ?? "") ? <Button className="mt-2" size="sm" loading={pending} onClick={() => rodar(() => atualizarPecaAction(p.id, { prazo: prazo || null }), "Prazo atualizado.")}>Salvar prazo</Button> : null}</label>
          <label className="text-sm font-medium">Prioridade<select value={prio} onChange={(e) => setPrio(e.target.value as typeof prio)} className={campo}><option value="NORMAL">Normal</option><option value="ALTA">Alta</option><option value="URGENTE">Urgente</option></select>
            {prio !== p.prioridade ? <Button className="mt-2" size="sm" loading={pending} onClick={() => rodar(() => atualizarPecaAction(p.id, { prioridade: prio }), "Prioridade atualizada.")}>Salvar</Button> : null}</label>
        </div>
      ) : null}
    </div>
  );
}

type Campos = { objetivo: string | null; roteiro: string | null; referencias: string | null; legenda: string | null; linkBrutos: string | null; linkVersao: string | null; linkPublicacao: string | null; publicarEm: string | null };
const paraLocal = (iso: string | null) => (iso ? new Date(new Date(iso).getTime() - 3 * 3_600_000).toISOString().slice(0, 16) : "");

/** Campos de cada departamento: roteiro e referências, links (brutos, versão, publicação), legenda e data de publicação. */
export function CamposDaPeca({ id, etapa, pode, inicial }: { id: string; etapa: string; pode: boolean; inicial: Campos }) {
  const { pending, rodar } = useAcao();
  if (!pode) {
    return <dl className="space-y-3 text-sm">{([["Objetivo", inicial.objetivo], ["Roteiro", inicial.roteiro], ["Referências", inicial.referencias], ["Legenda", inicial.legenda]] as const).map(([l, v]) => <div key={l}><dt className="text-xs font-semibold text-muted-foreground">{l}</dt><dd className="whitespace-pre-line">{v || "—"}</dd></div>)}</dl>;
  }
  return (
    <form aria-label="Conteúdo da peça" className="grid gap-3" onSubmit={(e) => {
      e.preventDefault(); const f = new FormData(e.currentTarget);
      const s = (k: string) => String(f.get(k) ?? "");
      const pub = s("publicarEm");
      rodar(() => atualizarPecaAction(id, { objetivo: s("objetivo"), roteiro: s("roteiro"), referencias: s("referencias"), legenda: s("legenda"), linkBrutos: s("linkBrutos"), linkVersao: s("linkVersao"), linkPublicacao: s("linkPublicacao"), publicarEm: pub ? `${pub}:00-03:00` : "" }), "Salvo.");
    }}>
      <label className="text-sm font-medium">Objetivo do vídeo<Input name="objetivo" defaultValue={inicial.objetivo ?? ""} maxLength={500} className="mt-1" /></label>
      <label className="text-sm font-medium">Roteiro<textarea name="roteiro" defaultValue={inicial.roteiro ?? ""} rows={etapa === "ROTEIRO" || etapa === "PLANEJAMENTO" ? 8 : 4} maxLength={20000} className={`${campo} h-auto py-2`} /></label>
      <label className="text-sm font-medium">Referências (links, ideias, storytelling)<textarea name="referencias" defaultValue={inicial.referencias ?? ""} rows={3} maxLength={4000} className={`${campo} h-auto py-2`} /></label>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-sm font-medium">Link dos brutos<Input name="linkBrutos" type="url" defaultValue={inicial.linkBrutos ?? ""} placeholder="https://drive.google.com/…" className="mt-1" /></label>
        <label className="text-sm font-medium">Link da versão editada<Input name="linkVersao" type="url" defaultValue={inicial.linkVersao ?? ""} placeholder="https://…" className="mt-1" /></label>
        <label className="text-sm font-medium">Link da publicação<Input name="linkPublicacao" type="url" defaultValue={inicial.linkPublicacao ?? ""} placeholder="https://instagram.com/…" className="mt-1" /></label>
      </div>
      <label className="text-sm font-medium">Legenda<textarea name="legenda" defaultValue={inicial.legenda ?? ""} rows={3} maxLength={5000} className={`${campo} h-auto py-2`} /></label>
      <label className="text-sm font-medium sm:w-72">Publicar em<Input name="publicarEm" type="datetime-local" defaultValue={paraLocal(inicial.publicarEm)} className="mt-1" /></label>
      <div><Button type="submit" loading={pending}>Salvar conteúdo</Button></div>
    </form>
  );
}

export function NovoComentario({ id, pessoas }: { id: string; pessoas: { id: string; nome: string }[] }) {
  const { pending, rodar } = useAcao();
  const [texto, setTexto] = React.useState("");
  const [lnk, setLnk] = React.useState("");
  const [avisar, setAvisar] = React.useState<string[]>([]);
  return (
    <div className="space-y-2">
      <label className="sr-only" htmlFor={`cm-${id}`}>Comentário</label>
      <textarea id={`cm-${id}`} value={texto} onChange={(e) => setTexto(e.target.value)} rows={3} maxLength={4000} placeholder="Escreva para a equipe" className={`${campo} h-auto py-2`} />
      <label className="block text-xs font-medium">Link (opcional)<Input value={lnk} onChange={(e) => setLnk(e.target.value)} type="url" placeholder="https://…" className="mt-1" /></label>
      {pessoas.length ? <details className="text-sm"><summary className="min-h-11 cursor-pointer py-2 font-medium">Avisar pessoas ({avisar.length})</summary><div className="grid gap-1 sm:grid-cols-2">{pessoas.map((x) => <label key={x.id} className="flex min-h-11 items-center gap-2"><input type="checkbox" className="size-4" checked={avisar.includes(x.id)} onChange={(e) => setAvisar(e.target.checked ? [...avisar, x.id] : avisar.filter((a) => a !== x.id))} />{x.nome}</label>)}</div></details> : null}
      <Button size="sm" disabled={!texto.trim()} loading={pending} onClick={() => rodar(async () => { const r = await comentarPecaAction(id, { texto, link: lnk, mencoes: avisar }); if (r.ok) { setTexto(""); setLnk(""); setAvisar([]); } return r; }, "Comentário enviado.")}>Comentar</Button>
    </div>
  );
}
