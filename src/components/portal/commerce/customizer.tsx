"use client";
import * as React from "react";
import { fontStack } from "@/lib/ds/fonts";
import { formatBRL } from "@/lib/money";
import { Photo } from "./store-mock";
import { CUSTOMIZER_PRODUCTS } from "./demo-stores";

const COLORS = [
  { key: "grafite", label: "Grafite e terracota", primary: "#1f2937", accent: "#c2410c" },
  { key: "marinho", label: "Marinho e dourado", primary: "#14213d", accent: "#b7791f" },
  { key: "musgo", label: "Musgo e coral", primary: "#1f3d2b", accent: "#e0573f" },
  { key: "vinho", label: "Vinho e rosé", primary: "#5b1230", accent: "#c0507a" },
] as const;
const FONTS = [{ key: "moderna", label: "Moderna" }, { key: "elegante", label: "Elegante" }, { key: "condensada", label: "Condensada" }] as const;
const RADII = [{ v: 0, label: "Retos" }, { v: 12, label: "Suaves" }, { v: 24, label: "Arredondados" }] as const;
const BUTTONS = [{ key: "solid", label: "Cheio" }, { key: "outline", label: "Contorno" }] as const;

function Group<T extends string | number>({ legend, value, onChange, options }: { legend: string; value: T; onChange: (v: T) => void; options: readonly { v: T; label: string; swatch?: [string, string] }[] }) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold text-[#14213d]">{legend}</legend>
      <div role="radiogroup" aria-label={legend} className="mt-2 flex flex-wrap gap-2">
        {options.map((o) => (
          <button key={String(o.v)} type="button" role="radio" aria-checked={value === o.v} onClick={() => onChange(o.v)}
            className={`inline-flex min-h-11 items-center gap-2 rounded-md border px-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14213d] ${value === o.v ? "border-[#14213d] bg-[#14213d] text-[#f5f1e8]" : "border-[#14213d]/25 bg-white text-[#14213d] hover:border-[#14213d]"}`}>
            {o.swatch ? <span aria-hidden className="flex rounded-full ring-1 ring-white/70 outline outline-1 outline-neutral-400"><i className="size-4 rounded-l-full" style={{ background: o.swatch[0] }} /><i className="size-4 rounded-r-full" style={{ background: o.swatch[1] }} /></span> : null}
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

/** Simulação das escolhas que o editor de temas permite hoje (cores, fontes, cantos, botões). Não salva nada. */
export function Customizer() {
  const [color, setColor] = React.useState<(typeof COLORS)[number]["key"]>("marinho");
  const [font, setFont] = React.useState<(typeof FONTS)[number]["key"]>("moderna");
  const [radius, setRadius] = React.useState<number>(12);
  const [btn, setBtn] = React.useState<(typeof BUTTONS)[number]["key"]>("solid");
  const c = COLORS.find((x) => x.key === color)!;
  const reset = () => { setColor("marinho"); setFont("moderna"); setRadius(12); setBtn("solid"); };
  const buttonStyle: React.CSSProperties = btn === "solid" ? { background: c.accent, color: "#fff", borderColor: c.accent, borderRadius: radius } : { background: "transparent", color: c.accent, borderColor: c.accent, borderRadius: radius };
  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
      <div className="space-y-6">
        <Group legend="Cores da marca" value={color} onChange={setColor} options={COLORS.map((x) => ({ v: x.key, label: x.label, swatch: [x.primary, x.accent] as [string, string] }))} />
        <Group legend="Fonte dos títulos" value={font} onChange={setFont} options={FONTS.map((x) => ({ v: x.key, label: x.label }))} />
        <Group legend="Cantos" value={radius} onChange={setRadius} options={RADII.map((x) => ({ v: x.v, label: x.label }))} />
        <Group legend="Botões" value={btn} onChange={setBtn} options={BUTTONS.map((x) => ({ v: x.key, label: x.label }))} />
        <button type="button" onClick={reset} className="text-sm font-semibold text-[#1f47c9] underline underline-offset-4 hover:no-underline">Voltar ao padrão</button>
      </div>
      <div>
        <div className="overflow-hidden border border-[#14213d]/15 bg-white" style={{ borderRadius: Math.min(radius, 16) }} aria-live="polite">
          <div className="flex items-center justify-between px-4 py-3 text-white" style={{ background: c.primary }}>
            <span className="text-lg font-extrabold" style={{ fontFamily: fontStack(font) }}>Sua marca</span>
            <span className="text-xs text-white/80">Início · Produtos · Carrinho</span>
          </div>
          <ul className="grid grid-cols-3 gap-3 p-4">
            {CUSTOMIZER_PRODUCTS.map((p) => (
              <li key={p.name} className="min-w-0">
                <div className="overflow-hidden bg-neutral-100" style={{ borderRadius: radius }}><Photo src={p.img} ratio="1/1" /></div>
                <p className="mt-2 truncate text-[13px] font-semibold" style={{ fontFamily: fontStack(font) }}>{p.name}</p>
                <p className="text-[13px] text-neutral-600">{formatBRL(p.priceCents)}</p>
                <span className="mt-2 inline-flex h-9 w-full items-center justify-center border text-[12px] font-bold" style={buttonStyle}>Comprar</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="mt-3 text-sm text-neutral-700">Simulação de demonstração: nada é salvo. No editor de verdade você também troca a logo, os textos e a ordem das seções, vê a prévia e só então publica.</p>
      </div>
    </div>
  );
}
