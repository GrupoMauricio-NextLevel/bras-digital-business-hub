"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { KeyRound, MessageCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { removerChaveIaLojaAction, salvarChaveIaLojaAction } from "@/app/actions/ia-loja";
import type { SituacaoIa } from "@/lib/domain/ia-por-plano";

const NOME: Record<string, string> = { COMMERCE_START: "Start", COMMERCE_PRO: "Pro", COMMERCE_SCALE: "Scale", COMMERCE_ENTERPRISE: "Enterprise" };
const CHAT: Record<SituacaoIa["iaNoChat"], string> = {
  cota: "com IA, pela cota do seu plano",
  chave: "com IA, pela sua chave",
  regras: "com respostas prontas (produtos, pedidos e guias). Para IA no chat: plano Pro ou sua chave",
};

/** Sua IA (D243): cota do mês, aviso aos 80%, chave própria e como o chat da loja responde. */
export function SuaIa({ s }: { s: SituacaoIa }) {
  const router = useRouter();
  const [chave, setChave] = React.useState("");
  const [pending, start] = React.useTransition();
  const pct = s.cota ? Math.min(100, Math.round((s.usados / s.cota) * 100)) : 0;
  const salvar = (e: React.FormEvent) => { e.preventDefault(); start(async () => { const r = await salvarChaveIaLojaAction(chave); if (r.ok) { toast.success("Chave conferida e salva"); setChave(""); router.refresh(); } else toast.error(r.error); }); };
  const remover = () => start(async () => { const r = await removerChaveIaLojaAction(); if (r.ok) { toast.success("Chave removida"); router.refresh(); } else toast.error(r.error); });
  return (
    <section className="mb-8 grid gap-4 lg:grid-cols-2" aria-label="Sua IA">
      <div className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="text-lg font-bold">IA do seu plano</h2>
        <p className="mt-1 text-sm text-muted-foreground">{s.plano ? <>Plano <b className="text-foreground">{NOME[s.plano] ?? s.plano}</b>: {s.cota.toLocaleString("pt-BR")} usos por mês, pagos pela NextLevel.</> : "Sem plano ativo."}</p>
        <div className="mt-4">
          <div className="flex justify-between text-sm"><span>Usados este mês</span><b className="tabular-nums">{s.usados.toLocaleString("pt-BR")} de {s.cota.toLocaleString("pt-BR")}</b></div>
          <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-surface-muted" role="progressbar" aria-valuemin={0} aria-valuemax={s.cota} aria-valuenow={s.usados} aria-label="Uso da IA no mês">
            <span className={`block h-full rounded-full ${s.alerta ? "bg-warning" : "bg-primary"}`} style={{ width: `${pct}%` }} />
          </div>
          {s.alerta ? <p className="mt-2 text-sm font-medium text-warning">Você já usou {pct}% da cota. Ao acabar, a IA segue com a sua chave (se tiver) ou volta às respostas prontas até o mês virar.</p> : null}
        </div>
        <p className="mt-4 flex items-start gap-2 rounded-xl bg-surface-muted px-3 py-2 text-sm"><MessageCircle className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />Chat da sua loja: {CHAT[s.iaNoChat]}.</p>
      </div>
      <div className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="flex items-center gap-2 text-lg font-bold"><KeyRound className="size-5 text-muted-foreground" aria-hidden />Use sua chave</h2>
        <p className="mt-1 text-sm text-muted-foreground">Com a sua chave da OpenAI, a IA não tem limite nosso: o uso é cobrado direto na sua conta da OpenAI. Ela fica guardada criptografada e nunca aparece na tela.</p>
        {s.chaveLoja ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-3 text-sm">
            <span>Chave salva, termina em <b className="font-mono">…{s.chaveLoja.fim}</b> {s.chaveLoja.ok ? "· conferida" : ""}</span>
            <Button size="sm" variant="ghost" onClick={remover} disabled={pending}><Trash2 /> Remover</Button>
          </div>
        ) : (
          <form onSubmit={salvar} className="mt-4 flex flex-col gap-2 sm:flex-row">
            <label htmlFor="chave-ia" className="sr-only">Chave da OpenAI</label>
            <Input id="chave-ia" type="password" autoComplete="off" value={chave} onChange={(e) => setChave(e.target.value)} placeholder="sk-..." />
            <Button type="submit" loading={pending} disabled={!chave.trim()}>Conferir e salvar</Button>
          </form>
        )}
        <p className="mt-3 text-xs text-muted-foreground">Crie a chave em platform.openai.com → API keys. Precisa de ajuda técnica? Indicamos parceiros (serviço à parte).</p>
      </div>
    </section>
  );
}
