"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Lock, LockOpen, Pencil, Plus, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { MoneyField } from "@/components/finance/fields";
import { formatBRL } from "@/lib/money";
import { MEIOS, MEIO_FIXO, NOME_DA_ORIGEM, NOME_DO_MEIO, ORIGENS, TIPO_FIXO, type Meio, type Origem, type Tipo } from "@/lib/finance/caixa-regras";
import { abrirCaixaAction, editarLancamentoAction, estornarLancamentoAction, fecharCaixaAction, lancarAction, reabrirCaixaAction } from "@/app/actions/caixa";

type Opcoes = { lojas: { id: string; nome: string }[]; parceiros: { id: string; nome: string; executivo: boolean }[] };
const lab = "grid gap-1 text-xs font-medium";
const MEIOS_MANUAIS = MEIOS.filter((m) => m !== "MERCADO_PAGO");

function useAcao() {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, ok: string, depois?: () => void) => start(async () => {
    const r = await fn();
    if (r.ok) { toast.success(ok); depois?.(); router.refresh(); } else toast.error(r.error ?? "Não foi possível salvar.");
  });
  return { pending, run };
}

export function AbrirCaixa({ data, sugestaoCents }: { data: string; sugestaoCents: number }) {
  const [saldo, setSaldo] = React.useState(sugestaoCents);
  const { pending, run } = useAcao();
  return (
    <form className="flex flex-wrap items-end gap-3" onSubmit={(e) => { e.preventDefault(); run(() => abrirCaixaAction({ data, saldoInicialCents: saldo }), "Caixa aberto"); }}>
      <MoneyField label="Dinheiro na gaveta para começar" hint={sugestaoCents ? `Sugerido: o que foi contado no último fechamento (${formatBRL(sugestaoCents)}).` : "Troco que está na gaveta agora."} valueCents={saldo} onChange={setSaldo} className="w-64" />
      <Button type="submit" loading={pending}><LockOpen /> Abrir o caixa</Button>
    </form>
  );
}

type Valores = { tipo: Tipo; origem: Origem; meio: Meio; valorCents: number; storeId: string; partnerId: string; descricao: string };
function CamposDoLancamento({ v, set, opcoes }: { v: Valores; set: (p: Partial<Valores>) => void; opcoes: Opcoes }) {
  const uid = React.useId();
  const tipoFixo = TIPO_FIXO[v.origem];
  const meioFixo = MEIO_FIXO[v.origem];
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <label className={lab}>Origem
        <Select value={v.origem} onChange={(e) => { const o = e.target.value as Origem; set({ origem: o, tipo: TIPO_FIXO[o] ?? v.tipo, meio: MEIO_FIXO[o] ?? v.meio }); }}>
          {ORIGENS.map((o) => <option key={o} value={o}>{NOME_DA_ORIGEM[o]}</option>)}
        </Select>
      </label>
      <label className={lab}>Entrada ou saída
        <Select value={tipoFixo ?? v.tipo} disabled={!!tipoFixo} onChange={(e) => set({ tipo: e.target.value as Tipo })}><option value="ENTRADA">Entrada</option><option value="SAIDA">Saída</option></Select>
      </label>
      <label className={lab}>Meio
        <Select value={meioFixo ?? v.meio} disabled={!!meioFixo} onChange={(e) => set({ meio: e.target.value as Meio })}>{MEIOS_MANUAIS.map((m) => <option key={m} value={m}>{NOME_DO_MEIO[m]}</option>)}</Select>
      </label>
      <MoneyField label="Valor" id={`valor-${uid}`} valueCents={v.valorCents} onChange={(c) => set({ valorCents: c })} />
      <label className={lab}>Loja (opcional)
        <Select value={v.storeId} onChange={(e) => set({ storeId: e.target.value })}><option value="">Nenhuma</option>{opcoes.lojas.map((l) => <option key={l.id} value={l.id}>{l.nome}</option>)}</Select>
      </label>
      <label className={lab}>{v.origem === "PRESTACAO_EXECUTIVO" ? "Executivo" : "Executivo ou parceiro (opcional)"}
        <Select value={v.partnerId} onChange={(e) => set({ partnerId: e.target.value })}><option value="">Nenhum</option>{opcoes.parceiros.map((p) => <option key={p.id} value={p.id}>{p.nome}{p.executivo ? " (executivo)" : ""}</option>)}</Select>
      </label>
      <label className={`${lab} sm:col-span-2`}>Descrição<Input value={v.descricao} onChange={(e) => set({ descricao: e.target.value })} placeholder="Ex.: Plano Start de novembro, loja da Rua Oriente" maxLength={300} /></label>
    </div>
  );
}

export function NovoLancamento({ data, opcoes }: { data: string; opcoes: Opcoes }) {
  const vazio: Valores = { tipo: "ENTRADA", origem: "ASSINATURA", meio: "DINHEIRO", valorCents: 0, storeId: "", partnerId: "", descricao: "" };
  const [v, setV] = React.useState<Valores>(vazio);
  const [chave, setChave] = React.useState(0);
  const { pending, run } = useAcao();
  return (
    <form key={chave} className="grid gap-3" aria-label="Novo lançamento" onSubmit={(e) => { e.preventDefault(); run(() => lancarAction({ data, tipo: v.tipo, origem: v.origem, meio: v.meio, valorCents: v.valorCents, storeId: v.storeId || null, partnerId: v.partnerId || null, descricao: v.descricao }), "Lançado no caixa", () => { setV(vazio); setChave((k) => k + 1); }); }}>
      <CamposDoLancamento v={v} set={(p) => setV({ ...v, ...p })} opcoes={opcoes} />
      <div><Button type="submit" loading={pending} disabled={!v.valorCents}><Plus /> Lançar</Button></div>
    </form>
  );
}

export function AcoesDoLancamento({ l, opcoes }: { l: { id: string; tipo: Tipo; origem: Origem; meio: Meio; valorCents: number; storeId: string | null; partnerId: string | null; descricao: string; data: string }; opcoes: Opcoes }) {
  const [modo, setModo] = React.useState<null | "editar" | "estornar">(null);
  const [v, setV] = React.useState<Valores>({ tipo: l.tipo, origem: l.origem, meio: l.meio, valorCents: l.valorCents, storeId: l.storeId ?? "", partnerId: l.partnerId ?? "", descricao: l.descricao });
  const [data, setData] = React.useState(l.data);
  const [motivo, setMotivo] = React.useState("");
  const { pending, run } = useAcao();
  if (!modo) return (
    <span className="flex gap-1">
      <Button size="sm" variant="ghost" onClick={() => setModo("editar")} aria-label="Editar lançamento"><Pencil /></Button>
      <Button size="sm" variant="ghost" onClick={() => setModo("estornar")} aria-label="Estornar lançamento"><Undo2 /></Button>
    </span>
  );
  return (
    <div className="grid gap-3 rounded-xl border border-border bg-surface-muted/40 p-3">
      {modo === "editar" ? <>
        <CamposDoLancamento v={v} set={(p) => setV({ ...v, ...p })} opcoes={opcoes} />
        <label className={`${lab} w-44`}>Data<Input type="date" value={data} onChange={(e) => setData(e.target.value)} /></label>
      </> : <p className="text-sm">Estornar tira este lançamento das contas do dia. Ele continua na lista, riscado, com o motivo.</p>}
      <div className="flex flex-wrap items-end gap-2">
        <label className={`${lab} min-w-0 flex-1`}>Motivo (obrigatório)<Input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder={modo === "editar" ? "Ex.: era Pix, não dinheiro" : "Ex.: lançado em dobro"} /></label>
        <Button size="sm" loading={pending} disabled={motivo.trim().length < 3} onClick={() => run(() => modo === "editar"
          ? editarLancamentoAction(l.id, { data, tipo: v.tipo, origem: v.origem, meio: v.meio, valorCents: v.valorCents, storeId: v.storeId || null, partnerId: v.partnerId || null, descricao: v.descricao, motivo })
          : estornarLancamentoAction(l.id, motivo), modo === "editar" ? "Lançamento atualizado" : "Lançamento estornado", () => setModo(null))}>{modo === "editar" ? "Salvar mudança" : "Estornar"}</Button>
        <Button size="sm" variant="ghost" onClick={() => setModo(null)}>Cancelar</Button>
      </div>
    </div>
  );
}

export function FecharCaixa({ data, esperadoCents }: { data: string; esperadoCents: number }) {
  const [contado, setContado] = React.useState(esperadoCents);
  const [motivo, setMotivo] = React.useState("");
  const { pending, run } = useAcao();
  const dif = contado - esperadoCents;
  return (
    <form className="grid gap-3" onSubmit={(e) => { e.preventDefault(); run(() => fecharCaixaAction({ data, contadoCents: contado, motivo: motivo || undefined }), "Caixa fechado"); }}>
      <div className="flex flex-wrap items-end gap-3">
        <MoneyField label="Dinheiro contado na gaveta" valueCents={contado} onChange={setContado} className="w-56" />
        <p className="pb-2 text-sm" aria-live="polite">Esperado <b className="tabular-nums">{formatBRL(esperadoCents)}</b> · {dif === 0 ? <b className="text-success">bate certinho</b> : <b className={dif > 0 ? "text-warning" : "text-danger"}>{dif > 0 ? "sobrou" : "faltou"} {formatBRL(Math.abs(dif))}</b>}</p>
      </div>
      {dif !== 0 ? <label className={`${lab} max-w-lg`}>Motivo da diferença (obrigatório)<Input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ex.: troco dado errado" /></label> : null}
      <div><Button type="submit" loading={pending} disabled={dif !== 0 && motivo.trim().length < 3}><Lock /> Fechar o caixa</Button></div>
    </form>
  );
}

export function ReabrirCaixa({ data }: { data: string }) {
  const [aberto, setAberto] = React.useState(false);
  const [motivo, setMotivo] = React.useState("");
  const { pending, run } = useAcao();
  if (!aberto) return <Button size="sm" variant="secondary" onClick={() => setAberto(true)}><LockOpen /> Reabrir o dia</Button>;
  return (
    <div className="flex flex-wrap items-end gap-2">
      <label className={`${lab} w-72`}>Motivo da reabertura<Input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ex.: conferir um Pix" /></label>
      <Button size="sm" loading={pending} disabled={motivo.trim().length < 3} onClick={() => run(() => reabrirCaixaAction(data, motivo), "Dia reaberto", () => setAberto(false))}>Reabrir</Button>
      <Button size="sm" variant="ghost" onClick={() => setAberto(false)}>Cancelar</Button>
    </div>
  );
}
