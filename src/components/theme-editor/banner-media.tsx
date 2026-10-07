"use client";
import * as React from "react";
import { Crosshair, ImageIcon, Images, Monitor, Smartphone, TriangleAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/input";
import { FormField } from "@/components/app/form-field";
import { PLACEMENTS } from "@/lib/themes/banners";
import { isValidImageRef } from "@/lib/themes/settings";
import type { SettingValue } from "@/lib/themes/types";
import { cn } from "@/lib/utils";
import { useMediaLibrary } from "./media-library";

/** Aplica várias mudanças de uma vez (um passo só no histórico; foco X e Y juntos). */
type Patch = (patch: Record<string, SettingValue>) => void;
const num = (v: unknown, d = 50) => (typeof v === "number" ? v : d);
/** Proporções usadas nas prévias (as mesmas dos componentes da loja). */
const PREVIEW: Record<string, { desktop: string; mobile: string }> = {
  "hero-banner": { desktop: "21 / 9", mobile: "4 / 5" }, "banner-duo": { desktop: "4 / 3", mobile: "4 / 3" },
  "banner-strip": { desktop: "4 / 1", mobile: "3 / 2" }, "banner-mosaic": { desktop: "4 / 5", mobile: "1 / 1" },
};

/**
 * Imagem do banner (todos os níveis): imagem do computador e do celular (com reserva explícita), ponto de foco por
 * aparelho (clique na imagem), prévia do recorte nos dois formatos, aviso de resolução, descrição ou "decorativa".
 */
export function BannerMediaPanel({ sectionType, settings, onSet, idPrefix }: { sectionType: string; settings: Record<string, SettingValue>; onSet: Patch; idPrefix: string }) {
  const pick = useMediaLibrary();
  const [device, setDevice] = React.useState<"desktop" | "mobile">("desktop");
  const [natural, setNatural] = React.useState<Record<string, number>>({});
  const placement = PLACEMENTS.find((p) => p.key === sectionType);
  const ratio = PREVIEW[sectionType] ?? { desktop: "16 / 9", mobile: "4 / 5" };
  const desktop = String(settings.image ?? ""); const mobileOwn = String(settings.imageMobile ?? "");
  const shown = device === "desktop" ? desktop : mobileOwn || desktop;
  const fx = device === "desktop" ? "focusX" : "focusMobileX", fy = device === "desktop" ? "focusY" : "focusMobileY";
  const minWidth = device === "desktop" ? placement?.desktop.minWidth : placement?.mobile.minWidth;
  const w = natural[shown];
  const choose = async (field: "image" | "imageMobile") => { const url = await pick?.({ minWidth: field === "image" ? placement?.desktop.minWidth : placement?.mobile.minWidth }); if (url) onSet({ [field]: url }); };
  const setFocus = (e: React.MouseEvent<HTMLButtonElement> | React.KeyboardEvent<HTMLButtonElement>, x?: number, y?: number) => {
    if (x !== undefined && y !== undefined) { onSet({ [fx]: x, [fy]: y }); return; }
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); const me = e as React.MouseEvent;
    onSet({ [fx]: Math.round(((me.clientX - r.left) / r.width) * 20) * 5, [fy]: Math.round(((me.clientY - r.top) / r.height) * 20) * 5 });
  };
  const step = (k: string) => (e: React.KeyboardEvent<HTMLButtonElement>) => {
    const d = { ArrowLeft: [-5, 0], ArrowRight: [5, 0], ArrowUp: [0, -5], ArrowDown: [0, 5] }[k]; if (!d) return; e.preventDefault();
    setFocus(e, Math.min(100, Math.max(0, num(settings[fx]) + d[0]!)), Math.min(100, Math.max(0, num(settings[fy]) + d[1]!)));
  };
  return (
    <div className="space-y-3 rounded-lg border border-border p-3" aria-label="Imagem do banner">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">Imagem</p>
        <div role="radiogroup" aria-label="Aparelho" className="flex gap-0.5 rounded-md bg-surface-muted p-0.5">
          {(["desktop", "mobile"] as const).map((d) => <button key={d} type="button" role="radio" aria-checked={device === d} onClick={() => setDevice(d)} className={cn("flex items-center gap-1 rounded px-2 py-1 text-xs", device === d ? "bg-surface shadow-sm" : "text-muted-foreground")}>{d === "desktop" ? <Monitor className="size-3.5" aria-hidden /> : <Smartphone className="size-3.5" aria-hidden />}{d === "desktop" ? "Computador" : "Celular"}</button>)}
        </div>
      </div>
      {shown ? (
        <>
          <button type="button" onClick={(e) => setFocus(e)} onKeyDown={(e) => step(e.key)(e)} aria-label={`Ponto de foco no ${device === "desktop" ? "computador" : "celular"}: ${num(settings[fx])}% na horizontal e ${num(settings[fy])}% na vertical. Clique na imagem ou use as setas.`} className="relative block w-full overflow-hidden rounded-md bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2">
            {/* eslint-disable-next-line @next/next/no-img-element -- prévia do original para escolher o foco */}
            <img src={/^\/assets\//.test(shown) ? `${shown}?w=640` : shown} alt="" className="block w-full" onLoad={(e) => { const el = e.currentTarget; const real = new Image(); real.onload = () => setNatural((n) => ({ ...n, [shown]: real.naturalWidth })); real.src = shown; void el; }} />
            <span aria-hidden className="pointer-events-none absolute size-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_2px_rgba(0,0,0,.5)]" style={{ left: `${num(settings[fx])}%`, top: `${num(settings[fy])}%` }}><Crosshair className="size-5 text-white" /></span>
          </button>
          <div className="grid grid-cols-[2fr_1fr] gap-2" aria-label="Prévia do recorte">
            {(["desktop", "mobile"] as const).map((d) => { const src = d === "desktop" ? desktop : mobileOwn || desktop; return (
              <figure key={d} className="m-0"><div className="overflow-hidden rounded bg-surface-muted" style={{ aspectRatio: ratio[d] }}>
                {/* eslint-disable-next-line @next/next/no-img-element -- prévia do recorte */}
                <img src={/^\/assets\//.test(src) ? `${src}?w=640` : src} alt="" className="size-full object-cover" style={{ objectPosition: `${num(settings[d === "desktop" ? "focusX" : "focusMobileX"])}% ${num(settings[d === "desktop" ? "focusY" : "focusMobileY"])}%` }} />
              </div><figcaption className="mt-0.5 text-[10px] text-muted-foreground">{d === "desktop" ? "Computador" : "Celular"} · {ratio[d].replace(/ /g, "")}</figcaption></figure>
            ); })}
          </div>
          {w && minWidth && w < minWidth ? <p className="flex items-start gap-1.5 text-[11px] text-warning"><TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden /> Esta imagem tem {w} px de largura. Para esta posição, o ideal é pelo menos {minWidth} px: em telas grandes ela pode ficar sem nitidez.</p> : null}
        </>
      ) : <div className="flex aspect-[16/9] flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border-strong text-xs text-muted-foreground"><ImageIcon className="size-5" aria-hidden />Nenhuma imagem: a loja mostra um fundo nas cores do tema.</div>}
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="secondary" onClick={() => void choose("image")}><Images aria-hidden /> {desktop ? "Trocar imagem" : "Escolher imagem"}</Button>
        {desktop ? <Button type="button" size="sm" variant="ghost" onClick={() => onSet({ image: "" })}><X aria-hidden /> Tirar</Button> : null}
      </div>
      <div className="rounded-md bg-surface-muted p-2 text-xs">
        <p className="font-medium text-foreground">Imagem do celular</p>
        {mobileOwn ? <div className="mt-1 flex flex-col items-start gap-1"><span className="text-muted-foreground">Imagem própria para o celular</span><span className="flex gap-1"><Button type="button" size="sm" variant="ghost" onClick={() => void choose("imageMobile")}>Trocar</Button><Button type="button" size="sm" variant="ghost" onClick={() => onSet({ imageMobile: "" })}>Usar a do computador</Button></span></div>
          : <div className="mt-1 flex flex-col items-start gap-1"><span className="text-muted-foreground">Usa a do computador, com o foco do celular.</span><Button type="button" size="sm" variant="ghost" onClick={() => void choose("imageMobile")} disabled={!desktop}>Escolher outra</Button></div>}
      </div>
      <FormField label="Endereço da imagem (opcional)" htmlFor={`${idPrefix}-url`} error={isValidImageRef(desktop) ? undefined : "Use um endereço https:// ou uma imagem da biblioteca."} hint="Prefira a biblioteca: ela guarda o original e gera versões leves.">
        <Input id={`${idPrefix}-url`} value={desktop} placeholder="https://…" onChange={(e) => onSet({ image: e.target.value })} />
      </FormField>
      <FormField label="Descrição da imagem" htmlFor={`${idPrefix}-alt`} hint={settings.decorative === true ? "Imagem decorativa: leitores de tela vão ignorá-la." : "Lida por leitores de tela. Descreva o que aparece."}>
        <Input id={`${idPrefix}-alt`} value={String(settings.alt ?? "")} maxLength={140} disabled={settings.decorative === true} onChange={(e) => onSet({ alt: e.target.value })} />
      </FormField>
      <Switch checked={settings.decorative === true} onCheckedChange={(v) => onSet({ decorative: v })} label="Imagem só decorativa" />
    </div>
  );
}

/** Ajustes que o painel de imagem já cobre (não aparecem de novo na lista de campos). */
export const MEDIA_FIELDS = new Set(["image", "imageMobile", "focusX", "focusY", "focusMobileX", "focusMobileY", "alt", "decorative"]);
