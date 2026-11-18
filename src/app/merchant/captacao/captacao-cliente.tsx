"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Copy, Download, ExternalLink, PencilLine, Plus, QrCode } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { criarCampanhaAction } from "@/app/actions/site";
import { formatBRL } from "@/lib/money";

const campo = "mt-1 h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm";

/** Assistente da página de campanha (NB4, D339): objetivo, oferta e motivos; a página nasce pronta e publicada. */
export function NovaCampanha({ objetivos, abrir }: { objetivos: { chave: string; rotulo: string; descricao: string }[]; abrir: boolean }) {
  const router = useRouter();
  const [aberto, setAberto] = React.useState(abrir);
  const [objetivo, setObjetivo] = React.useState(objetivos[0]?.chave ?? "ORCAMENTO");
  const [pending, start] = React.useTransition();
  if (!aberto) return <Button onClick={() => setAberto(true)}><Plus aria-hidden />Nova página de campanha</Button>;
  return (
    <form className="w-full max-w-xl space-y-4 rounded-2xl border border-border bg-surface p-5 text-left" aria-label="Nova página de campanha" onSubmit={(e) => {
      e.preventDefault(); const f = new FormData(e.currentTarget);
      start(async () => {
        const r = await criarCampanhaAction({ objetivo: objetivo as "ORCAMENTO", titulo: String(f.get("titulo") ?? ""), oferta: String(f.get("oferta") ?? ""), motivos: [1, 2, 3, 4].map((i) => String(f.get(`motivo${i}`) ?? "")) });
        if (r.ok) { toast.success("Página de campanha no ar. Copie o link para o anúncio."); setAberto(false); router.push("/merchant/captacao"); router.refresh(); } else toast.error(r.error);
      });
    }}>
      <fieldset>
        <legend className="text-sm font-semibold">1. O que o cliente vai fazer na página?</legend>
        <div className="mt-2 grid gap-2">
          {objetivos.map((o) => (
            <label key={o.chave} className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 text-sm ${objetivo === o.chave ? "border-[var(--ds-link)] bg-[var(--ds-link)]/5" : "border-border"}`}>
              <input type="radio" name="objetivo" value={o.chave} checked={objetivo === o.chave} onChange={() => setObjetivo(o.chave)} className="mt-1 size-4 accent-[var(--ds-link)]" />
              <span><b className="block font-semibold">{o.rotulo}</b><span className="text-xs text-muted-foreground">{o.descricao}</span></span>
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <p className="text-sm font-semibold">2. A oferta</p>
        <label className="mt-2 block text-sm font-medium">Título (o mesmo do anúncio)<Input name="titulo" required minLength={4} maxLength={80} placeholder="Ex.: Box de vidro sob medida com instalação" className="mt-1" /></label>
        <label className="mt-3 block text-sm font-medium">Uma frase com a oferta (opcional)<Input name="oferta" maxLength={160} placeholder="Ex.: Orçamento sem compromisso e visita técnica na sua casa." className="mt-1" /></label>
      </div>
      <div>
        <p className="text-sm font-semibold">3. Por que escolher vocês (até 4, opcional)</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">{[1, 2, 3, 4].map((i) => <input key={i} name={`motivo${i}`} maxLength={90} aria-label={`Motivo ${i}`} placeholder={["Ex.: 12 anos atendendo a região", "Ex.: Garantia na instalação", "Ex.: Vidro temperado certificado", "Ex.: Pagamento facilitado"][i - 1]} className={campo} />)}</div>
      </div>
      <p className="text-xs text-muted-foreground">Sem promessa de resultado: escreva só o que depende de vocês. Depois dá para trocar textos e fotos no editor.</p>
      <div className="flex flex-wrap gap-2"><Button type="submit" loading={pending}>Criar e publicar a página</Button><Button type="button" variant="ghost" onClick={() => setAberto(false)}>Cancelar</Button></div>
    </form>
  );
}

type Campanha = { id: string; titulo: string; slug: string; noAr: boolean; arquivada: boolean; contatos: number; fechados: number; valorCents: number; url: string; links: { canal: string; rotulo: string; url: string }[]; qr: string; urlQr: string };

/** Uma campanha: números, links para copiar por lugar e o QR. */
export function CampanhaCartao({ c }: { c: Campanha }) {
  const copiar = async (texto: string) => { try { await navigator.clipboard.writeText(texto); toast.success("Link copiado"); } catch { toast.error("Não deu para copiar; selecione o link."); } };
  const qrHref = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(c.qr)}`;
  return (
    <article className="rounded-2xl border border-border bg-surface p-5" aria-labelledby={`cp-${c.id}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id={`cp-${c.id}`} className="text-lg font-semibold">{c.titulo}</h2>
          <p className="mt-0.5 break-all text-xs text-muted-foreground">{c.url}</p>
          <span className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${c.noAr ? "bg-success-soft text-success" : "bg-surface-muted text-muted-foreground"}`}>{c.arquivada ? "Arquivada" : c.noAr ? "No ar" : "Rascunho"}</span>
        </div>
        <dl className="grid grid-cols-3 gap-3 text-center text-sm">
          <div><dt className="text-xs text-muted-foreground">Contatos</dt><dd className="text-xl font-semibold">{c.contatos}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Fechados</dt><dd className="text-xl font-semibold">{c.fechados}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Valor</dt><dd className="text-xl font-semibold">{c.valorCents ? formatBRL(c.valorCents) : "—"}</dd></div>
        </dl>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
        <ul className="space-y-2" aria-label="Links prontos">
          {c.links.map((l) => (
            <li key={l.canal} className="flex flex-wrap items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm">
              <span className="min-w-0 flex-1"><b className="block text-xs">{l.rotulo}</b><span className="block truncate text-xs text-muted-foreground">{l.url}</span></span>
              <Button size="sm" variant="secondary" onClick={() => copiar(l.url)} aria-label={`Copiar o link: ${l.rotulo}`}><Copy aria-hidden />Copiar</Button>
            </li>
          ))}
        </ul>
        <div className="flex flex-col items-center gap-2 rounded-lg border border-border p-3 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrHref} alt={`QR da página ${c.titulo}`} width={120} height={120} className="rounded bg-white" />
          <a href={qrHref} download={`qr-${c.slug}.svg`} className="inline-flex items-center gap-1 text-xs font-semibold text-link underline underline-offset-4"><Download className="size-3.5" aria-hidden />Baixar QR</a>
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><QrCode className="size-3" aria-hidden />cartaz, panfleto e balcão</span>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {c.noAr ? <a href={c.url} target="_blank" rel="noreferrer" className={buttonVariants({ size: "sm", variant: "secondary" })}><ExternalLink aria-hidden />Ver a página</a> : null}
        <Link href={`/theme-editor?pagina=p:${c.id}`} className={buttonVariants({ size: "sm", variant: "secondary" })}><PencilLine aria-hidden />Trocar textos e fotos</Link>
        <Link href={`/merchant/contatos?ver=quadro`} className={buttonVariants({ size: "sm", variant: "ghost" })}>Ver os contatos</Link>
        <Link href="/merchant/anuncios" className={buttonVariants({ size: "sm", variant: "ghost" })}>Anunciar com a equipe NextLevel</Link>
      </div>
    </article>
  );
}
