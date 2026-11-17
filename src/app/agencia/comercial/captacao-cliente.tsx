"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { salvarCaptacaoAction } from "@/app/actions/agencias";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type C = { ligada: boolean; titulo: string; texto: string; servicos: string[]; whatsapp: string | null };

/** Configuração da página de captação (D322): textos, serviços, WhatsApp e o link para o site e os anúncios. */
export function ConfigurarCaptacao({ inicial, url }: { inicial: C; url: string }) {
  const router = useRouter();
  const [c, setC] = React.useState({ ...inicial, servicosTexto: inicial.servicos.join("\n"), whatsapp: inicial.whatsapp ?? "" });
  const [pending, start] = React.useTransition();
  const exemplo = `${url}?utm_source=instagram&utm_medium=bio&utm_campaign=site`;
  const copiar = async (t: string) => { try { await navigator.clipboard.writeText(t); toast.success("Link copiado."); } catch { toast.error("Não deu para copiar; selecione o link."); } };
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-sm">Endereço da página: <a href={url} target="_blank" rel="noreferrer" className="break-all font-semibold text-link underline underline-offset-4">{url}</a></p>
        <div className="flex flex-wrap gap-2"><Button size="sm" variant="secondary" onClick={() => copiar(url)}>Copiar link</Button><Button size="sm" variant="secondary" onClick={() => copiar(exemplo)}>Copiar link com etiquetas</Button></div>
        <p className="text-xs text-muted-foreground">Use o link no botão &quot;Fale conosco&quot; do site, na bio e nos anúncios. Com etiquetas (utm_source, utm_campaign) e <code>lp=nome-da-pagina</code>, o Comercial mostra de onde veio cada contato.</p>
      </div>
      <form className="grid gap-3 sm:grid-cols-2" aria-label="Página de captação" onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await salvarCaptacaoAction({ ligada: c.ligada, titulo: c.titulo, texto: c.texto, servicos: c.servicosTexto.split(/[\n,]+/).map((x) => x.trim()).filter(Boolean), whatsapp: c.whatsapp }); if (r.ok) { toast.success(c.ligada ? "Página no ar." : "Página salva (desligada)."); router.refresh(); } else toast.error(r.error); }); }}>
        <label className="flex min-h-11 items-center gap-2 text-sm font-medium sm:col-span-2"><input type="checkbox" className="size-4" checked={c.ligada} onChange={(e) => setC({ ...c, ligada: e.target.checked })} />Página no ar (recebendo pedidos)</label>
        <label className="text-sm font-medium sm:col-span-2">Título<Input value={c.titulo} onChange={(e) => setC({ ...c, titulo: e.target.value })} maxLength={120} className="mt-1" /></label>
        <label className="text-sm font-medium sm:col-span-2">Texto<textarea value={c.texto} onChange={(e) => setC({ ...c, texto: e.target.value })} rows={2} maxLength={400} className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm" /></label>
        <label className="text-sm font-medium">Serviços (um por linha)<textarea value={c.servicosTexto} onChange={(e) => setC({ ...c, servicosTexto: e.target.value })} rows={4} className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm" /></label>
        <label className="text-sm font-medium">WhatsApp da agência (opcional)<Input value={c.whatsapp} onChange={(e) => setC({ ...c, whatsapp: e.target.value })} inputMode="tel" maxLength={20} className="mt-1" /></label>
        <div className="sm:col-span-2"><Button type="submit" loading={pending}>Salvar</Button></div>
      </form>
    </div>
  );
}
