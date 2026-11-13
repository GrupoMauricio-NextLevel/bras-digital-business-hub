"use client";
import * as React from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { reenviarConversaoAction, salvarConfigRetornoAction } from "@/app/actions/trafego";
import type { ConfigRetornoTela } from "@/lib/domain/trafego/retorno";

const campo = "mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 font-mono";
type Campo = { k: string; rotulo: string; onde: string; secreto?: boolean; tem?: boolean; atual?: string | null; exemplo?: string };

function Campos({ campos, v, set }: { campos: Campo[]; v: Record<string, string>; set: (k: string, x: string) => void }) {
  return (
    <div className="grid gap-4">
      {campos.map((c) => (
        <div key={c.k}>
          <label className="block font-semibold" htmlFor={`r-${c.k}`}>{c.rotulo}{c.secreto ? <span className="ml-2 text-xs font-normal text-muted-foreground">{c.tem ? "(guardado; deixe vazio para manter, ou escreva - para apagar)" : "(ainda não informado)"}</span> : null}</label>
          <input id={`r-${c.k}`} type={c.secreto ? "password" : "text"} autoComplete="off" spellCheck={false} value={v[c.k] ?? ""} onChange={(e) => set(c.k, e.target.value)} placeholder={c.secreto ? (c.tem ? "••••••••" : "") : c.exemplo ?? ""} className={campo} aria-describedby={`r-${c.k}-onde`} />
          <p id={`r-${c.k}-onde`} className="mt-1 text-xs text-muted-foreground">{c.onde}</p>
        </div>
      ))}
    </div>
  );
}

/** Tokens e números da Meta e do Google (TR5, D296). Segredos nunca voltam para a tela. */
export function FormRetorno({ cfg, podeEditar }: { cfg: ConfigRetornoTela; podeEditar: boolean }) {
  const router = useRouter();
  const [v, setV] = React.useState<Record<string, string>>({
    metaTesteCodigo: cfg.meta.testeCodigo ?? "", googleClienteId: cfg.google.clienteId ?? "", googleGerenteId: cfg.google.gerenteId ?? "", googleOauthClientId: cfg.google.oauthClientId ?? "",
    googleAcaoLead: cfg.google.acaoLead ?? "", googleAcaoConta: cfg.google.acaoConta ?? "", googleAcaoPagante: cfg.google.acaoPagante ?? "",
  });
  const [pending, start] = React.useTransition();
  const set = (k: string, x: string) => setV({ ...v, [k]: x });
  const meta: Campo[] = [
    { k: "metaToken", rotulo: "Token de acesso da API de conversões", secreto: true, tem: cfg.meta.temToken, onde: "Meta: Gerenciador de Eventos → o Pixel → Configurações → API de Conversões → \"Gerar token de acesso\" (ou um usuário do sistema do Gerenciador de Negócios com acesso ao Pixel)." },
    { k: "metaTesteCodigo", rotulo: "Código de teste (opcional, só para conferir)", exemplo: "TEST12345", onde: "Gerenciador de Eventos → Testar eventos. Com ele, os envios aparecem lá na hora e não contam nas campanhas. Apague depois de conferir." },
  ];
  const google: Campo[] = [
    { k: "googleClienteId", rotulo: "Número da conta do Google Ads", exemplo: "123-456-7890", onde: "No topo do Google Ads, ao lado do nome da conta." },
    { k: "googleGerenteId", rotulo: "Número da conta de administrador (MCC), se houver", exemplo: "987-654-3210", onde: "A conta de administrador que pediu o token de desenvolvedor." },
    { k: "googleDevToken", rotulo: "Token de desenvolvedor", secreto: true, tem: cfg.google.temDevToken, onde: "Conta de administrador → Ferramentas → Centro de API (precisa de \"Acesso básico\" aprovado pelo Google)." },
    { k: "googleOauthClientId", rotulo: "ID do cliente OAuth", exemplo: "123…apps.googleusercontent.com", onde: "Google Cloud → APIs e serviços → Credenciais." },
    { k: "googleOauthSecret", rotulo: "Chave secreta do cliente OAuth", secreto: true, tem: cfg.google.temOauthSecret, onde: "No mesmo lugar do ID do cliente." },
    { k: "googleRefresh", rotulo: "Token de atualização (refresh token)", secreto: true, tem: cfg.google.temRefresh, onde: "Gerado uma vez ao autorizar o acesso à conta do Google Ads (a equipe técnica ajuda)." },
    { k: "googleAcaoLead", rotulo: "Ação de conversão \"Contato\" (número)", exemplo: "123456789", onde: "Google Ads → Metas → Conversões → a ação → o número ctId no endereço da página." },
    { k: "googleAcaoConta", rotulo: "Ação de conversão \"Conta criada\" (número)", exemplo: "123456790", onde: "Crie a ação do tipo \"Importar → cliques\"." },
    { k: "googleAcaoPagante", rotulo: "Ação de conversão \"Pagante\" (número)", exemplo: "123456791", onde: "Também do tipo \"Importar → cliques\", com valor." },
  ];
  if (!podeEditar) return <section className="ds-card text-sm"><h2 className="text-lg font-bold">Configuração</h2><p className="mt-2 text-muted-foreground">Só o dono do Master vê e muda os tokens das contas de anúncio.</p></section>;
  return (
    <form className="ds-card text-sm" aria-labelledby="ret-t" onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await salvarConfigRetornoAction(v); if (r.ok) { toast.success("Salvo. Os segredos ficam guardados criptografados."); setV((x) => ({ ...x, metaToken: "", googleDevToken: "", googleOauthSecret: "", googleRefresh: "" })); router.refresh(); } else toast.error(r.error); }); }}>
      <h2 id="ret-t" className="text-lg font-bold">Configuração</h2>
      <p className="mt-1 text-muted-foreground">Tokens ficam guardados criptografados e nunca aparecem de novo na tela.</p>
      <fieldset className="mt-4"><legend className="mb-3 font-bold">Meta (Instagram e Facebook)</legend><Campos campos={meta} v={v} set={set} /></fieldset>
      <fieldset className="mt-6"><legend className="mb-3 font-bold">Google Ads</legend><Campos campos={google} v={v} set={set} /></fieldset>
      <button type="submit" disabled={pending} className="ds-btn mt-5">{pending ? "Salvando…" : "Salvar"}</button>
    </form>
  );
}

export function Reenviar({ id }: { id: string }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  return <button type="button" disabled={pending} className="ds-btn ds-btn--ghost ds-btn--sm" onClick={() => start(async () => { const r = await reenviarConversaoAction(id); if (r.ok) { toast.success("Volta para a fila; sai no próximo envio (até 10 minutos)."); router.refresh(); } else toast.error(r.error); })}>Tentar de novo</button>;
}
