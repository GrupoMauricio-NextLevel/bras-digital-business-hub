"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FormField } from "@/components/app/form-field";
import { MoneyField } from "@/components/finance/fields";
import { setBrasDiscoveryAction } from "@/app/actions/bras";

export type DiscoveryRow = {
  trendSignal: string | null; verdict: string | null; score: number | null; teaserYoutubeId: string | null; analysisYoutubeId: string | null;
  analysis: { trend?: string; competition?: string; risks?: string; howToSell?: string; salePriceMinCents?: number; salePriceMaxCents?: number } | null;
};

const yt = (id: string | null) => (id ? `https://www.youtube.com/watch?v=${id}` : "");

/**
 * Análise da descoberta (D95), por camada: o que é público, o que o membro grátis vê e o que é só para quem tem acesso.
 * O sinal público aceita só palavras; números ficam na análise.
 */
export function DiscoveryEditor({ videoId, title, shortsId, d }: { videoId: string; title: string; shortsId: string; d: DiscoveryRow }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const a = d.analysis ?? {};
  const [f, setF] = React.useState({ trendSignal: d.trendSignal ?? "", verdict: d.verdict ?? "", score: d.score == null ? "" : String(d.score), teaserUrl: yt(d.teaserYoutubeId), analysisUrl: yt(d.analysisYoutubeId), trend: a.trend ?? "", competition: a.competition ?? "", risks: a.risks ?? "", howToSell: a.howToSell ?? "", min: a.salePriceMinCents ?? 0, max: a.salePriceMaxCents ?? 0 });
  const [pending, start] = React.useTransition();
  const set = (p: Partial<typeof f>) => setF((x) => ({ ...x, ...p }));
  const save = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const r = await setBrasDiscoveryAction(videoId, {
        trendSignal: f.trendSignal, verdict: f.verdict, score: f.score === "" ? null : Number(f.score), teaserUrl: f.teaserUrl, analysisUrl: f.analysisUrl,
        analysis: { trend: f.trend, competition: f.competition, risks: f.risks, howToSell: f.howToSell, salePriceMinCents: f.min || undefined, salePriceMaxCents: f.max || undefined },
      });
      if (r.ok) { toast.success("Análise salva"); setOpen(false); router.refresh(); } else toast.error(r.error);
    });
  };
  const completa = !!(d.analysisYoutubeId && d.verdict);
  if (!open) {
    return (
      <div className="flex w-full flex-wrap items-center gap-2 border-t border-border pt-2 text-sm">
        <FileText className="size-4 text-muted-foreground" aria-hidden />
        {completa ? <Badge tone="success">Análise pronta</Badge> : d.verdict || d.analysisYoutubeId ? <Badge tone="warning">Análise incompleta</Badge> : <Badge>Sem análise</Badge>}
        {d.trendSignal ? <span className="text-muted-foreground">Sinal público: <b className="text-foreground">{d.trendSignal}</b></span> : null}
        {d.score != null ? <span className="tabular-nums text-muted-foreground">Nota {d.score}/10</span> : null}
        <Button size="sm" variant="ghost" onClick={() => setOpen(true)} aria-label={`Editar análise de ${title}`}>Editar análise</Button>
      </div>
    );
  }
  const sec = "space-y-3 rounded-xl border border-border p-3";
  return (
    <form onSubmit={save} className="w-full space-y-3 border-t border-border pt-3" aria-label={`Análise de ${title}`}>
      <fieldset className={sec}>
        <legend className="px-1 text-sm font-bold">Público (Shorts e página)</legend>
        <p className="text-xs text-muted-foreground">Shorts: <a className="text-link underline" href={yt(shortsId)} target="_blank" rel="noreferrer">abrir</a>. O sinal aparece no cartão público: só palavras, sem números.</p>
        <FormField label="Sinal de tendência" htmlFor={`d-sig-${videoId}`} hint="Ex.: Buscas subindo · Pouca concorrência · Volta às aulas"><Input id={`d-sig-${videoId}`} maxLength={60} value={f.trendSignal} onChange={(e) => set({ trendSignal: e.target.value })} /></FormField>
      </fieldset>
      <fieldset className={sec}>
        <legend className="px-1 text-sm font-bold">Membro grátis</legend>
        <div className="grid gap-3 sm:grid-cols-[1fr_7rem]">
          <FormField label="Veredito" htmlFor={`d-ver-${videoId}`} hint="Uma frase. Ex.: Produto certo para quem vende no Mercado Livre"><Input id={`d-ver-${videoId}`} maxLength={140} value={f.verdict} onChange={(e) => set({ verdict: e.target.value })} /></FormField>
          <FormField label="Nota" htmlFor={`d-nota-${videoId}`}><Select id={`d-nota-${videoId}`} value={f.score} onChange={(e) => set({ score: e.target.value })}><option value="">—</option>{Array.from({ length: 11 }, (_, i) => <option key={i} value={String(i)}>{i}/10</option>)}</Select></FormField>
        </div>
        <FormField label="Trecho da análise (link do YouTube)" htmlFor={`d-tea-${videoId}`} hint="Um vídeo curto separado, não listado. Nunca o link da análise completa."><Input id={`d-tea-${videoId}`} inputMode="url" value={f.teaserUrl} onChange={(e) => set({ teaserUrl: e.target.value })} /></FormField>
      </fieldset>
      <fieldset className={sec}>
        <legend className="px-1 text-sm font-bold">Análise completa (quem tem acesso)</legend>
        <FormField label="Vídeo da análise (link do YouTube)" htmlFor={`d-ana-${videoId}`} hint="Horizontal, não listado nesta fase. Quando passar a cobrar, troque por vídeo privado."><Input id={`d-ana-${videoId}`} inputMode="url" value={f.analysisUrl} onChange={(e) => set({ analysisUrl: e.target.value })} /></FormField>
        <div className="grid gap-3 sm:grid-cols-2">
          <MoneyField id={`d-min-${videoId}`} label="Preço no Mercado Livre (mínimo, por unidade)" valueCents={f.min} onChange={(v) => set({ min: v })} />
          <MoneyField id={`d-max-${videoId}`} label="Preço no Mercado Livre (máximo, por unidade)" valueCents={f.max} onChange={(v) => set({ max: v })} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Tendência" htmlFor={`d-t-${videoId}`}><Textarea id={`d-t-${videoId}`} rows={3} maxLength={1200} value={f.trend} onChange={(e) => set({ trend: e.target.value })} /></FormField>
          <FormField label="Concorrência" htmlFor={`d-c-${videoId}`}><Textarea id={`d-c-${videoId}`} rows={3} maxLength={1200} value={f.competition} onChange={(e) => set({ competition: e.target.value })} /></FormField>
          <FormField label="Riscos e cuidados" htmlFor={`d-r-${videoId}`}><Textarea id={`d-r-${videoId}`} rows={3} maxLength={1200} value={f.risks} onChange={(e) => set({ risks: e.target.value })} /></FormField>
          <FormField label="Como anunciar" htmlFor={`d-h-${videoId}`}><Textarea id={`d-h-${videoId}`} rows={3} maxLength={1200} value={f.howToSell} onChange={(e) => set({ howToSell: e.target.value })} /></FormField>
        </div>
        <p className="text-xs text-muted-foreground">Mostre dados e riscos. Nunca prometa ganho (&quot;vai lucrar X&quot;): a margem aparece como estimativa, antes de taxas, frete e impostos.</p>
      </fieldset>
      <div className="flex gap-2"><Button type="submit" size="sm" loading={pending}>Salvar análise</Button><Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button></div>
    </form>
  );
}
