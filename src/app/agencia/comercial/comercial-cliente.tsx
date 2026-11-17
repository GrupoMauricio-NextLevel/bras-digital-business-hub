"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, UserCheck } from "lucide-react";
import { atualizarOportunidadeAction, criarOportunidadeAction, perderOportunidadeAction, virarClienteAction } from "@/app/actions/agencias";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";

const campo = "mt-1 h-10 w-full rounded-md border border-border bg-surface px-3 text-sm";
const ORIGENS = [["INDICACAO", "Indicação"], ["INSTAGRAM", "Instagram"], ["SITE", "Site"], ["ANUNCIO", "Anúncio"], ["WHATSAPP", "WhatsApp"], ["EVENTO", "Evento"], ["PROSPECCAO_ATIVA", "Prospecção ativa"], ["OUTRO", "Outro"]] as const;
type Origem = (typeof ORIGENS)[number][0];
type Pessoa = { id: string; nome: string };
type Dados = { empresa: string; contatoNome: string | null; whatsapp: string | null; email: string | null; segmento: string | null; origem: Origem; servicos: string | null; valorPropostoCents: number | null; responsavelId: string | null; proximaAtividade: string | null; proximaAtividadeEm: string | null; observacoes: string | null };

function Campos({ d, equipe, valor, setValor }: { d?: Partial<Dados>; equipe: Pessoa[]; valor: number; setValor: (v: number) => void }) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium sm:col-span-2">Empresa<Input name="empresa" defaultValue={d?.empresa ?? ""} required minLength={2} maxLength={120} className="mt-1" /></label>
        <label className="text-sm font-medium">Responsável na empresa<Input name="contatoNome" defaultValue={d?.contatoNome ?? ""} maxLength={120} className="mt-1" /></label>
        <label className="text-sm font-medium">Telefone / WhatsApp<Input name="whatsapp" type="tel" defaultValue={d?.whatsapp ?? ""} maxLength={20} className="mt-1" /></label>
        <label className="text-sm font-medium">E-mail<Input name="email" type="email" defaultValue={d?.email ?? ""} maxLength={160} className="mt-1" /></label>
        <label className="text-sm font-medium">Segmento<Input name="segmento" defaultValue={d?.segmento ?? ""} maxLength={80} className="mt-1" /></label>
        <label className="text-sm font-medium">Origem do lead<select name="origem" defaultValue={d?.origem ?? "INDICACAO"} className={campo}>{ORIGENS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
        <label className="text-sm font-medium">Quem cuida (agência)<select name="responsavelId" defaultValue={d?.responsavelId ?? ""} className={campo}><option value="">Eu</option>{equipe.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}</select></label>
        <label className="text-sm font-medium sm:col-span-2">Serviços de interesse<Input name="servicos" defaultValue={d?.servicos ?? ""} maxLength={500} placeholder="Ex.: 12 vídeos por mês + social media" className="mt-1" /></label>
        <MoneyInput label="Valor proposto (por mês)" valueCents={valor} onChange={setValor} />
        <span />
        <label className="text-sm font-medium">Próxima atividade<Input name="proximaAtividade" defaultValue={d?.proximaAtividade ?? ""} maxLength={200} placeholder="Ex.: ligar para apresentar a proposta" className="mt-1" /></label>
        <label className="text-sm font-medium">Data da próxima atividade<Input name="proximaAtividadeEm" type="date" defaultValue={d?.proximaAtividadeEm ?? ""} className="mt-1" /></label>
      </div>
      <label className="text-sm font-medium">Observações<textarea name="observacoes" defaultValue={d?.observacoes ?? ""} rows={3} maxLength={2000} className={`${campo} h-auto py-2`} /></label>
    </>
  );
}
const ler = (f: FormData, valor: number) => ({
  empresa: String(f.get("empresa")), contatoNome: String(f.get("contatoNome") ?? ""), whatsapp: String(f.get("whatsapp") ?? ""), email: String(f.get("email") ?? ""), segmento: String(f.get("segmento") ?? ""),
  origem: String(f.get("origem")) as Origem, servicos: String(f.get("servicos") ?? ""), valorPropostoCents: valor || null, responsavelId: String(f.get("responsavelId") ?? "") || null,
  proximaAtividade: String(f.get("proximaAtividade") ?? ""), proximaAtividadeEm: String(f.get("proximaAtividadeEm") ?? ""), observacoes: String(f.get("observacoes") ?? ""),
});

export function NovaOportunidade({ equipe }: { equipe: Pessoa[] }) {
  const router = useRouter();
  const [aberto, setAberto] = React.useState(false);
  const [valor, setValor] = React.useState(0);
  const [pending, start] = React.useTransition();
  if (!aberto) return <Button onClick={() => setAberto(true)}><Plus aria-hidden />Nova oportunidade</Button>;
  return (
    <form aria-label="Nova oportunidade" className="ds-card grid w-full gap-3 sm:w-[34rem]" onSubmit={(e) => { e.preventDefault(); const d = ler(new FormData(e.currentTarget), valor); start(async () => { const r = await criarOportunidadeAction(d); if (r.ok) { toast.success("Oportunidade criada."); router.push(`/agencia/comercial/${r.data.id}`); } else toast.error(r.error); }); }}>
      <Campos equipe={equipe} valor={valor} setValor={setValor} />
      <div className="flex gap-2"><Button type="submit" loading={pending}>Criar</Button><Button type="button" variant="ghost" onClick={() => setAberto(false)}>Cancelar</Button></div>
    </form>
  );
}

export function EditarOportunidade({ id, d, equipe }: { id: string; d: Dados; equipe: Pessoa[] }) {
  const router = useRouter();
  const [valor, setValor] = React.useState(d.valorPropostoCents ?? 0);
  const [pending, start] = React.useTransition();
  return (
    <form aria-label="Dados da oportunidade" className="grid gap-3" onSubmit={(e) => { e.preventDefault(); const v = ler(new FormData(e.currentTarget), valor); start(async () => { const r = await atualizarOportunidadeAction(id, v); if (r.ok) { toast.success("Salvo."); router.refresh(); } else toast.error(r.error); }); }}>
      <Campos d={d} equipe={equipe} valor={valor} setValor={setValor} />
      <div><Button type="submit" loading={pending}>Salvar</Button></div>
    </form>
  );
}

export function AndamentoDaOportunidade({ id, etapa, etapas, motivos }: { id: string; etapa: string; etapas: { v: string; l: string }[]; motivos: readonly string[] }) {
  const router = useRouter();
  const [motivo, setMotivo] = React.useState("");
  const [pending, start] = React.useTransition();
  const rodar = (fn: () => Promise<{ ok: true } | { ok: false; error: string }>, ok: string) => start(async () => { const r = await fn(); if (r.ok) { toast.success(ok); router.refresh(); } else toast.error(r.error); });
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Etapa">
        {etapas.map((e) => <Button key={e.v} size="sm" variant={e.v === etapa ? "primary" : "secondary"} disabled={pending || e.v === etapa} onClick={() => rodar(() => atualizarOportunidadeAction(id, { etapa: e.v as never }), `Etapa: ${e.l}.`)}>{e.l}</Button>)}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" loading={pending} onClick={() => rodar(() => atualizarOportunidadeAction(id, { registrarContato: true }), "Contato registrado agora.")}>Registrar contato agora</Button>
        <Button loading={pending} onClick={() => start(async () => { const r = await virarClienteAction(id); if (r.ok) { toast.success("Virou cliente: onboarding começou."); router.push(`/agencia/clientes/${r.data.clienteId}`); } else toast.error(r.error); })}><UserCheck aria-hidden />Virar cliente</Button>
      </div>
      <fieldset className="rounded-xl border border-border p-3">
        <legend className="px-1 text-sm font-semibold">Perdeu</legend>
        <label className="text-sm font-medium">Motivo<select value={motivo} onChange={(e) => setMotivo(e.target.value)} className={campo}><option value="">Escolha</option>{motivos.map((m) => <option key={m} value={m}>{m}</option>)}</select></label>
        <Button className="mt-2" size="sm" variant="secondary" disabled={!motivo} loading={pending} onClick={() => rodar(() => perderOportunidadeAction(id, motivo), "Marcada como perdida.")}>Marcar como perdida</Button>
      </fieldset>
    </div>
  );
}
