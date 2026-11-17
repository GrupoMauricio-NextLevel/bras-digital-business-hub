"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { atualizarClienteAction, definirEquipeDoClienteAction, mudarSituacaoDoClienteAction } from "@/app/actions/agencias";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import type { AgenciaIncluso } from "@/db/schema";
import { campo, ITENS_INCLUSO } from "../clientes-cliente";

type Inicial = { nome: string; segmento: string | null; contatoNome: string | null; whatsapp: string | null; email: string | null; documento: string | null; pacote: string | null; incluso: AgenciaIncluso; valorMensalCents: number | null; diaVencimento: number | null; responsavelId: string | null; observacoes: string | null };
const num = (v: FormDataEntryValue | null) => { const n = Number(String(v ?? "").trim()); return Number.isFinite(n) && n > 0 ? Math.round(n) : undefined; };

/** Edição da ficha. Quem só cuida do contrato vê só valor e vencimento; quem só cuida da ficha não vê o contrato. */
export function EditarCliente({ id, inicial, podeFicha, podeContrato, equipe }: { id: string; inicial: Inicial; podeFicha: boolean; podeContrato: boolean; equipe: { id: string; nome: string }[] }) {
  const router = useRouter();
  const [valor, setValor] = React.useState(inicial.valorMensalCents ?? 0);
  const [pending, start] = React.useTransition();
  return (
    <form aria-label="Editar cliente" className="grid gap-3" onSubmit={(e) => {
      e.preventDefault(); const f = new FormData(e.currentTarget);
      const dados: Parameters<typeof atualizarClienteAction>[1] = {};
      if (podeFicha) Object.assign(dados, {
        nome: String(f.get("nome")), segmento: String(f.get("segmento") ?? ""), contatoNome: String(f.get("contatoNome") ?? ""), whatsapp: String(f.get("whatsapp") ?? ""), email: String(f.get("email") ?? ""),
        documento: String(f.get("documento") ?? ""), pacote: String(f.get("pacote") ?? ""), observacoes: String(f.get("observacoes") ?? ""), responsavelId: String(f.get("responsavel") ?? "") || null,
        incluso: Object.fromEntries(ITENS_INCLUSO.map(([k]) => [k, num(f.get(k))])),
      });
      if (podeContrato) Object.assign(dados, { valorMensalCents: valor || null, diaVencimento: num(f.get("dia")) ?? null });
      start(async () => { const r = await atualizarClienteAction(id, dados); if (r.ok) { toast.success("Cliente atualizado."); router.refresh(); } else toast.error(r.error); });
    }}>
      {podeFicha ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-medium">Nome<Input name="nome" defaultValue={inicial.nome} required minLength={2} maxLength={120} className="mt-1" /></label>
            <label className="text-sm font-medium">Segmento<Input name="segmento" defaultValue={inicial.segmento ?? ""} maxLength={80} className="mt-1" /></label>
            <label className="text-sm font-medium">Pessoa de contato<Input name="contatoNome" defaultValue={inicial.contatoNome ?? ""} maxLength={120} className="mt-1" /></label>
            <label className="text-sm font-medium">WhatsApp<Input name="whatsapp" type="tel" defaultValue={inicial.whatsapp ?? ""} maxLength={20} className="mt-1" /></label>
            <label className="text-sm font-medium">E-mail<Input name="email" type="email" defaultValue={inicial.email ?? ""} maxLength={160} className="mt-1" /></label>
            <label className="text-sm font-medium">CPF ou CNPJ<Input name="documento" defaultValue={inicial.documento ?? ""} inputMode="numeric" maxLength={20} className="mt-1" /></label>
            <label className="text-sm font-medium">Pacote<Input name="pacote" defaultValue={inicial.pacote ?? ""} maxLength={80} className="mt-1" /></label>
            <label className="text-sm font-medium">Responsável<select name="responsavel" defaultValue={inicial.responsavelId ?? ""} className={campo}><option value="">Sem responsável</option>{equipe.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}</select></label>
          </div>
          <fieldset className="rounded-lg border border-border p-3">
            <legend className="px-1 text-sm font-semibold">O que entra no mês</legend>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">{ITENS_INCLUSO.map(([k, l]) => <label key={k} className="text-sm">{l}<Input name={k} type="number" min={0} max={999} defaultValue={inicial.incluso[k] ?? ""} inputMode="numeric" className="mt-1" /></label>)}</div>
          </fieldset>
        </>
      ) : null}
      {podeContrato ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <MoneyInput label="Valor mensal" valueCents={valor} onChange={setValor} />
          <label className="text-sm font-medium">Dia do vencimento (1 a 28)<Input name="dia" type="number" min={1} max={28} defaultValue={inicial.diaVencimento ?? ""} inputMode="numeric" className="mt-1" /></label>
        </div>
      ) : null}
      {podeFicha ? <label className="text-sm font-medium">Anotações<textarea name="observacoes" defaultValue={inicial.observacoes ?? ""} rows={3} maxLength={2000} className={`${campo} h-auto py-2`} /></label> : null}
      <div><Button type="submit" loading={pending}>Salvar</Button></div>
    </form>
  );
}

export function EquipeDoCliente({ id, equipe, marcados, pode }: { id: string; equipe: { id: string; nome: string; funcao: string }[]; marcados: string[]; pode: boolean }) {
  const router = useRouter();
  const [sel, setSel] = React.useState(new Set(marcados));
  const [pending, start] = React.useTransition();
  if (!pode) return <ul className="space-y-1 text-sm">{equipe.filter((p) => marcados.includes(p.id)).map((p) => <li key={p.id}>{p.nome} <span className="text-muted-foreground">· {p.funcao}</span></li>)}{marcados.length ? null : <li className="text-muted-foreground">Ninguém ainda.</li>}</ul>;
  return (
    <div className="space-y-2">
      {equipe.map((p) => (
        <label key={p.id} className="flex min-h-11 items-center gap-2 text-sm">
          <input type="checkbox" className="size-4" checked={sel.has(p.id)} onChange={(e) => { const n = new Set(sel); if (e.target.checked) n.add(p.id); else n.delete(p.id); setSel(n); }} />
          <span>{p.nome} <span className="text-muted-foreground">· {p.funcao}</span></span>
        </label>
      ))}
      <Button variant="secondary" loading={pending} onClick={() => start(async () => { const r = await definirEquipeDoClienteAction(id, [...sel]); if (r.ok) { toast.success("Equipe do cliente salva."); router.refresh(); } else toast.error(r.error); })}>Salvar equipe</Button>
    </div>
  );
}

export function SituacaoDoCliente({ id, situacao, motivos }: { id: string; situacao: "ATIVO" | "PAUSADO" | "ENCERRADO"; motivos: readonly string[] }) {
  const router = useRouter();
  const [motivo, setMotivo] = React.useState("");
  const [pending, start] = React.useTransition();
  const mudar = (s: "ATIVO" | "PAUSADO" | "ENCERRADO", ok: string) => start(async () => { const r = await mudarSituacaoDoClienteAction(id, { situacao: s, motivo: s === "ENCERRADO" ? motivo : null }); if (r.ok) { toast.success(ok); router.refresh(); } else toast.error(r.error); });
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {situacao !== "ATIVO" ? <Button variant="secondary" loading={pending} onClick={() => mudar("ATIVO", "Cliente reativado.")}>Reativar</Button> : null}
        {situacao === "ATIVO" ? <Button variant="secondary" loading={pending} onClick={() => mudar("PAUSADO", "Cliente pausado.")}>Pausar</Button> : null}
      </div>
      {situacao !== "ENCERRADO" ? (
        <div>
          <label className="text-sm font-medium">Encerrar contrato: motivo<select value={motivo} onChange={(e) => setMotivo(e.target.value)} className={campo}><option value="">Escolha</option>{motivos.map((m) => <option key={m} value={m}>{m}</option>)}</select></label>
          <Button className="mt-2" variant="secondary" disabled={!motivo} loading={pending} onClick={() => mudar("ENCERRADO", "Contrato encerrado.")}>Encerrar contrato</Button>
        </div>
      ) : null}
    </div>
  );
}
