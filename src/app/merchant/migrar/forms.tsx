"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { definirLancamentoAction, importarRedirecionamentosAction, removerRedirecionamentoAction, salvarPixelAction } from "@/app/actions/migrar";

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
