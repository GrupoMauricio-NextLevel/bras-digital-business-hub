"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { removerChaveIaAction, salvarAjustesIaAction, salvarChaveIaAction, testarConexaoIaAction } from "@/app/actions/ia";
import { NOME_PLANO, ORDEM_PLANOS } from "@/lib/ia/ferramentas";

export function ChaveIa({ temChave, fim, testadoEm, testeOk }: { temChave: boolean; fim: string | null; testadoEm: string | null; testeOk: boolean }) {
  const router = useRouter();
  const [chave, setChave] = React.useState("");
  const [pending, start] = React.useTransition();
  const rodar = (fn: () => Promise<{ ok: boolean; error?: string; data?: unknown }>, ok?: string) => start(async () => {
    const r = await fn();
    if (!r.ok) { toast.error(r.error); return; }
    const d = r.data as { ok?: boolean; mensagem?: string } | undefined;
    if (d?.mensagem) (d.ok ? toast.success : toast.error)(d.mensagem); else if (ok) toast.success(ok);
    setChave(""); router.refresh();
  });
  return (
    <div className="space-y-3">
      <p className="text-sm text-body">{temChave ? <>Chave salva: <span className="font-mono">sk-…{fim}</span>. {testadoEm ? (testeOk ? "Último teste: conectado." : "Último teste: falhou.") : "Ainda não testada."}</> : "Nenhuma chave salva. Sem chave, o Maurício aparece só no visual, bloqueado ou em breve."}</p>
      <form className="flex max-w-xl flex-wrap items-end gap-2" onSubmit={(e) => { e.preventDefault(); rodar(() => salvarChaveIaAction(chave), "Chave salva. Agora teste a conexão."); }}>
        <label className="min-w-0 flex-1 text-sm font-medium">{temChave ? "Trocar a chave da API" : "Chave da API da OpenAI"}
          <Input className="mt-1" type="password" autoComplete="off" value={chave} onChange={(e) => setChave(e.target.value)} placeholder="sk-…" />
        </label>
        <Button type="submit" loading={pending} disabled={chave.trim().length < 20}>Salvar</Button>
      </form>
      <p className="text-xs text-muted-foreground">A chave fica guardada criptografada e nunca aparece de novo. Gere em platform.openai.com, em API keys.</p>
      {temChave ? (
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" loading={pending} onClick={() => rodar(() => testarConexaoIaAction())}>Testar conexão</Button>
          <Button variant="ghost" loading={pending} onClick={() => rodar(() => removerChaveIaAction(), "Chave removida")}>Remover a chave</Button>
        </div>
      ) : null}
    </div>
  );
}

type Ajustes = { mostrar: boolean; usoReal: boolean; organizacao: string; modeloPadrao: string; modeloEconomico: string; planoTexto: string; planoAvancado: string; cotas: Record<string, number> };
export function AjustesIa({ inicial, podeUsoReal }: { inicial: Ajustes; podeUsoReal: boolean }) {
  const router = useRouter();
  const [v, setV] = React.useState(inicial);
  const [pending, start] = React.useTransition();
  const sel = (k: "planoTexto" | "planoAvancado", rotulo: string) => (
    <label className="text-sm font-medium">{rotulo}
      <select className="mt-1 block h-10 w-full rounded-lg border border-border bg-surface px-2 text-sm" value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value })}>
        {ORDEM_PLANOS.map((p) => <option key={p} value={p}>{NOME_PLANO[p]}</option>)}
      </select>
    </label>
  );
  return (
    <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await salvarAjustesIaAction(v as never); if (r.ok) { toast.success("Ajustes salvos"); router.refresh(); } else toast.error(r.error); }); }}>
      <div className="space-y-2">
        <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1 size-4" checked={v.mostrar} onChange={(e) => setV({ ...v, mostrar: e.target.checked })} /><span><b>Mostrar o Maurício nos painéis</b><span className="block text-xs text-muted-foreground">Botão, central e cartões aparecem para as lojas (bloqueados conforme o plano).</span></span></label>
        <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1 size-4" checked={v.usoReal} disabled={!podeUsoReal} onChange={(e) => setV({ ...v, usoReal: e.target.checked })} /><span><b>Permitir uso real</b><span className="block text-xs text-muted-foreground">{podeUsoReal ? "Libera as ferramentas para quem tem o plano (a partir da fase IA1)." : "Salve a chave e teste a conexão para liberar."}</span></span></label>
      </div>
      <div className="grid max-w-2xl gap-3 sm:grid-cols-2">
        {sel("planoTexto", "Ferramentas de texto a partir do plano")}
        {sel("planoAvancado", "Maurício completo (análise e ações) no plano")}
        <label className="text-sm font-medium">Modelo padrão<Input className="mt-1" value={v.modeloPadrao} onChange={(e) => setV({ ...v, modeloPadrao: e.target.value })} /></label>
        <label className="text-sm font-medium">Modelo econômico<Input className="mt-1" value={v.modeloEconomico} onChange={(e) => setV({ ...v, modeloEconomico: e.target.value })} /></label>
        <label className="text-sm font-medium sm:col-span-2">Organização da OpenAI (opcional)<Input className="mt-1" value={v.organizacao} onChange={(e) => setV({ ...v, organizacao: e.target.value })} placeholder="org-…" /></label>
      </div>
      <fieldset className="max-w-2xl">
        <legend className="text-sm font-semibold">Usos por mês em cada plano</legend>
        <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {ORDEM_PLANOS.map((p) => <label key={p} className="text-sm font-medium">{NOME_PLANO[p]}<Input className="mt-1" inputMode="numeric" value={String(v.cotas[p] ?? 0)} onChange={(e) => setV({ ...v, cotas: { ...v.cotas, [p]: Number(e.target.value.replace(/\D/g, "")) || 0 } })} /></label>)}
        </div>
      </fieldset>
      <Button type="submit" loading={pending}>Salvar ajustes</Button>
    </form>
  );
}
