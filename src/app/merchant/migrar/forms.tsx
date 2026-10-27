"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { definirLancamentoAction, importarRedirecionamentosAction, removerRedirecionamentoAction, salvarIntegracoesAction, salvarPixelAction } from "@/app/actions/migrar";
import { validarIntegracoes, type EntradaIntegracoes } from "@/lib/domain/integracoes-regras";

export function FormRedirecionamentos() {
  const router = useRouter();
  const [texto, setTexto] = React.useState("");
  const [erros, setErros] = React.useState<string[]>([]);
  const [pending, start] = React.useTransition();
  return (
    <form className="space-y-2" onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await importarRedirecionamentosAction(texto); if (!r.ok) { toast.error(r.error); return; } setErros(r.data.erros); toast.success(`${r.data.salvos} endereço(s) salvo(s)`); if (r.data.salvos) setTexto(""); router.refresh(); }); }}>
      <label className="block text-sm font-medium">Endereços (antigo;novo)<textarea rows={5} value={texto} onChange={(e) => setTexto(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-surface p-2 font-mono text-sm" placeholder={"/produto/vestido-azul;/product/vestido-azul\n/categoria/vestidos;/catalog"} /></label>
      {erros.length ? <ul role="alert" className="list-disc space-y-0.5 pl-5 text-sm text-danger">{erros.slice(0, 10).map((x) => <li key={x}>{x}</li>)}</ul> : null}
      <Button type="submit" loading={pending} disabled={!texto.trim()}>Salvar endereços</Button>
    </form>
  );
}

export function RemoverRedirecionamento({ fromPath }: { fromPath: string }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  return <Button size="sm" variant="ghost" loading={pending} aria-label={`Remover ${fromPath}`} onClick={() => start(async () => { const r = await removerRedirecionamentoAction(fromPath); if (r.ok) router.refresh(); else toast.error(r.error); })}>Remover</Button>;
}

export function CopiarLink({ url }: { url: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <code className="min-w-0 break-all rounded bg-surface-muted px-2 py-1 text-sm">{url}</code>
      <Button size="sm" variant="secondary" onClick={async () => { try { await navigator.clipboard.writeText(url); toast.success("Endereço copiado"); } catch { toast.error("Não deu para copiar; selecione e copie."); } }}>Copiar</Button>
    </div>
  );
}

export function FormPixel({ pixelId, temToken }: { pixelId: string; temToken: boolean }) {
  const router = useRouter();
  const [id, setId] = React.useState(pixelId);
  const [token, setToken] = React.useState("");
  const [pending, start] = React.useTransition();
  return (
    <form className="grid max-w-xl gap-3" onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await salvarPixelAction({ pixelId: id, token: token || undefined }); if (r.ok) { toast.success(id ? "Pixel salvo" : "Pixel desligado"); setToken(""); router.refresh(); } else toast.error(r.error); }); }}>
      <label className="text-sm font-medium">Número do pixel<Input className="mt-1" inputMode="numeric" value={id} onChange={(e) => setId(e.target.value)} placeholder="ex.: 123456789012345" /></label>
      <label className="text-sm font-medium">Token da API de conversões (opcional)<Input className="mt-1" type="password" autoComplete="off" value={token} onChange={(e) => setToken(e.target.value)} placeholder={temToken ? "Token salvo. Preencha só para trocar." : "Cole o token gerado no Gerenciador de Eventos"} /></label>
      <p className="text-xs text-muted-foreground">O token fica guardado criptografado e nunca aparece de novo. Para desligar o pixel, apague o número e salve.</p>
      <Button type="submit" loading={pending} className="justify-self-start">Salvar</Button>
    </form>
  );
}

export function FormLancamento({ ligado }: { ligado: boolean }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  return (
    <Button variant={ligado ? "secondary" : "primary"} loading={pending} onClick={() => start(async () => { const r = await definirLancamentoAction(!ligado); if (r.ok) { toast.success(ligado ? "Loja aberta ao público" : "Loja em lançamento"); router.refresh(); } else toast.error(r.error); })}>
      {ligado ? "Abrir a loja para o público" : "Colocar a loja em lançamento"}
    </Button>
  );
}

/** Integrações só de configuração (D189): cada campo aceita só o código do parceiro, conferido aqui e no servidor. */
export function FormIntegracoes({ inicial }: { inicial: EntradaIntegracoes }) {
  const router = useRouter();
  const [v, setV] = React.useState<EntradaIntegracoes>(inicial);
  const [erros, setErros] = React.useState<Record<string, string>>({});
  const [pending, start] = React.useTransition();
  const campo = (k: keyof EntradaIntegracoes, rotulo: string, dica: string, extra: Partial<React.ComponentProps<typeof Input>> = {}) => (
    <label className="text-sm font-medium">{rotulo}
      <Input className="mt-1" name={k} autoComplete="off" spellCheck={false} value={String(v[k] ?? "")} onChange={(e) => setV({ ...v, [k]: e.target.value })} aria-invalid={!!erros[k]} aria-describedby={`${k}-dica`} {...extra} />
      <span id={`${k}-dica`} className={`mt-1 block text-xs font-normal ${erros[k] ? "text-danger" : "text-muted-foreground"}`}>{erros[k] ?? dica}</span>
    </label>
  );
  const chave = (k: "pwa" | "maioridade", rotulo: string, dica: string) => (
    <label className="flex items-start gap-2 text-sm"><input type="checkbox" name={k} className="mt-1 size-4" checked={!!v[k]} onChange={(e) => setV({ ...v, [k]: e.target.checked })} /><span><span className="font-medium">{rotulo}</span><span className="block text-xs text-muted-foreground">{dica}</span></span></label>
  );
  const grupo = "scroll-mt-24 space-y-3 border-t border-border pt-4 first:border-t-0 first:pt-0";
  return (
    <form className="space-y-5" onSubmit={(e) => {
      e.preventDefault();
      const r = validarIntegracoes(v);
      if (!r.ok) { setErros(r.erros); toast.error("Confira os campos marcados."); return; }
      setErros({});
      start(async () => { const s = await salvarIntegracoesAction(v); if (s.ok) { toast.success("Integrações salvas"); router.refresh(); } else toast.error(s.error); });
    }}>
      <fieldset id="google-ferramentas" className={grupo}>
        <legend className="text-base font-semibold">Google</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {campo("ga4", "Google Analytics 4", "O ID de medição, começa com G-. Fica em Administrador > Fluxos de dados.", { placeholder: "G-ABC123XYZ" })}
          {campo("gtm", "Google Tag Manager", "O ID do contêiner, começa com GTM-.", { placeholder: "GTM-AB12CD3" })}
          {campo("googleVerificacao", "Google Search Console", "Escolha \"Tag HTML\" e cole a tag inteira ou só o código. Guardamos só o código.", { placeholder: "<meta name=\"google-site-verification\" ...>" })}
          {campo("googleAdsId", "Google Ads: ID da conta", "Começa com AW-. Mede a compra paga.", { placeholder: "AW-123456789" })}
          {campo("googleAdsRotulo", "Google Ads: rótulo da conversão (opcional)", "O texto depois da barra em \"AW-123/rótulo\".", { placeholder: "AbC-D_efG123" })}
        </div>
      </fieldset>
      <fieldset id="redes" className={grupo}>
        <legend className="text-base font-semibold">TikTok e Pinterest</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {campo("tiktokPixel", "Pixel do TikTok", "O ID do pixel, no Gerenciador de Eventos do TikTok.", { placeholder: "C1ABCDEFGHIJ2KLMNOPQ" })}
          {campo("pinterestTag", "Tag do Pinterest", "O ID da tag (só números), no Gerenciador de Anúncios.", { placeholder: "2612345678901", inputMode: "numeric" })}
        </div>
      </fieldset>
      <fieldset id="chat" className={grupo}>
        <legend className="text-base font-semibold">Chat ao vivo</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium">Serviço de chat
            <select name="chatProvedor" className="mt-1 block h-10 w-full rounded-lg border border-border bg-surface px-2 text-sm" value={v.chatProvedor ?? ""} onChange={(e) => setV({ ...v, chatProvedor: e.target.value as EntradaIntegracoes["chatProvedor"] })}>
              <option value="">Nenhum</option><option value="TAWK">Tawk.to (gratuito)</option><option value="JIVO">JivoChat</option>
            </select>
          </label>
          {v.chatProvedor ? campo("chatId", "Código do chat", v.chatProvedor === "TAWK" ? "Cole o código do widget ou o endereço embed.tawk.to/…" : "Cole o código do widget ou o endereço code.jivosite.com/widget/…") : null}
        </div>
      </fieldset>
      <fieldset id="celular" className={grupo}>
        <legend className="text-base font-semibold">Celular e maioridade</legend>
        {chave("pwa", "Loja instalável no celular", "O cliente pode pôr a sua loja na tela inicial, com o nome, a cor e o ícone dela.")}
        {chave("maioridade", "Pedir confirmação de 18 anos", "Na primeira visita aparece \"Você tem 18 anos ou mais?\". Para bebidas, tabacaria e produtos adultos.")}
      </fieldset>
      <p className="text-xs text-muted-foreground">Por segurança, não aceitamos colar scripts: cada campo recebe só o código do parceiro, e a loja carrega o script oficial. Nada disso aparece na prévia, na demonstração nem na página de espera.</p>
      <Button type="submit" loading={pending}>Salvar integrações</Button>
    </form>
  );
}
