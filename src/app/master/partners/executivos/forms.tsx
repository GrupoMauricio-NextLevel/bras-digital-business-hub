"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { HandCoins, Target, Undo2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cadastrarExecutivoAction, definirMetaSemanalAction, estornarVendaDeRuaAction, receberDoExecutivoAction } from "@/app/actions/executivos";

function useAcao() {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, ok: string, depois?: () => void) => start(async () => { const r = await fn(); if (r.ok) { toast.success(ok); depois?.(); router.refresh(); } else toast.error(r.error ?? "Não foi possível."); });
  return { pending, run };
}

export function ReceberPendencia({ id, dinheiro }: { id: string; dinheiro: boolean }) {
  const { pending, run } = useAcao();
  const [estorno, setEstorno] = React.useState(false);
  const [motivo, setMotivo] = React.useState("");
  if (estorno) return (
    <div className="flex flex-wrap items-end gap-2">
      <label className="grid w-60 gap-1 text-xs font-medium">Motivo do estorno<Input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ex.: cliente desistiu" /></label>
      <Button size="sm" loading={pending} disabled={motivo.trim().length < 3} onClick={() => run(() => estornarVendaDeRuaAction(id, motivo), "Venda estornada: loja, comissão e período desfeitos", () => setEstorno(false))}>Estornar</Button>
      <Button size="sm" variant="ghost" onClick={() => setEstorno(false)}>Voltar</Button>
    </div>
  );
  return (
    <span className="flex flex-wrap gap-1">
      <Button size="sm" loading={pending} onClick={() => run(() => receberDoExecutivoAction(id), dinheiro ? "Dinheiro recebido e lançado no caixa" : "Maquininha conferida e lançada no caixa")}><HandCoins /> {dinheiro ? "Receber agora" : "Conferi no Mercado Pago"}</Button>
      <Button size="sm" variant="ghost" onClick={() => setEstorno(true)} aria-label="Estornar venda"><Undo2 /></Button>
    </span>
  );
}

export function NovoExecutivo() {
  const vazio = { nome: "", email: "", senha: "", taxId: "", telefone: "" };
  const [v, setV] = React.useState(vazio);
  const { pending, run } = useAcao();
  const campo = (k: keyof typeof v, rotulo: string, extra: React.InputHTMLAttributes<HTMLInputElement> = {}) => <label className="grid gap-1 text-xs font-medium">{rotulo}<Input value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value })} required {...extra} /></label>;
  return (
    <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5" aria-label="Cadastrar executivo" onSubmit={(e) => { e.preventDefault(); run(() => cadastrarExecutivoAction({ nome: v.nome, email: v.email, senha: v.senha, taxId: v.taxId, telefone: v.telefone }), "Executivo cadastrado: ele entra com o e-mail e a senha provisória", () => setV(vazio)); }}>
      {campo("nome", "Nome completo")}
      {campo("email", "E-mail", { type: "email" })}
      {campo("taxId", "CPF ou CNPJ")}
      {campo("telefone", "WhatsApp com DDD")}
      {campo("senha", "Senha provisória", { minLength: 8 })}
      <div className="sm:col-span-2 lg:col-span-5"><Button type="submit" loading={pending}><UserPlus /> Cadastrar executivo</Button></div>
    </form>
  );
}

/** Meta semanal de lojas pagas do executivo (CX4, D274). Vazio volta ao padrão da campanha da rua. Só o dono. */
export function MetaSemanal({ partnerId, meta, padrao }: { partnerId: string; meta: number | null; padrao: number }) {
  const { pending, run } = useAcao();
  const [v, setV] = React.useState(meta ? String(meta) : "");
  const id = React.useId();
  return (
    <form className="mt-3 flex flex-wrap items-end gap-2" onSubmit={(e) => { e.preventDefault(); run(() => definirMetaSemanalAction(partnerId, v.trim() ? Number(v) : null), "Meta da semana salva"); }}>
      <label htmlFor={id} className="grid gap-1 text-xs font-medium">Meta da semana (lojas)<Input id={id} className="w-28" inputMode="numeric" value={v} placeholder={`${padrao} (padrão)`} onChange={(e) => setV(e.target.value.replace(/\D/g, ""))} /></label>
      <Button size="sm" variant="secondary" loading={pending}><Target /> Salvar meta</Button>
    </form>
  );
}
