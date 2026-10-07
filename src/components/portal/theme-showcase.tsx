"use client";
import * as React from "react";
import { Check, MousePointerClick } from "lucide-react";
import { cn } from "@/lib/utils";

const THEMES = [
  { key: "starter", name: "Starter", note: "Já incluso. Limpo e pronto para vender.", features: ["Página inicial com vitrine", "Catálogo, produto e carrinho", "Cores, logo e textos"] },
  { key: "arena", name: "Arena", note: "Esportivo, criado para lojas de camisas de time.", features: ["Hero esportivo com produto real", "Categorias, vitrines e campanhas", "Compra rápida e experiência mobile"] },
  { key: "editorial", name: "Editorial", note: "Foco em imagem, marca e tipografia.", features: ["Lookbook e vídeo na página inicial", "Seções e blocos configuráveis", "Tipografia refinada"] },
  { key: "signature", name: "Signature", note: "A vitrine completa, no nível das grandes lojas.", features: ["Menu grande, busca com sugestões e compra rápida", "Barra fixa de compra no celular", "Todas as seções e animações discretas"] },
] as const;
type Key = (typeof THEMES)[number]["key"];

/** Miniatura ilustrativa de cada tema (usada no portal e na vitrine de temas do lojista). */
export function ThemeMock({ k }: { k: Key }) {
  const grid = (n: number, cls: string) => <div className={cn("grid gap-1.5", n === 3 ? "grid-cols-3" : "grid-cols-4")}>{Array.from({ length: n }).map((_, i) => <div key={i} className={cn("aspect-[4/5] rounded", cls)} />)}</div>;
  if (k === "starter") return <div className="bg-surface p-3"><div className="mb-3 flex items-center justify-between text-[10px]"><b>Sua Loja</b><span className="text-muted-foreground">Catálogo · Carrinho</span></div><div className="mb-3 rounded-lg bg-success-soft p-4"><p className="text-sm font-bold">Vista o manto do seu time</p><span className="mt-2 inline-block rounded bg-band px-2 py-1 text-[9px] text-band-foreground">Ver catálogo</span></div>{grid(4, "bg-surface-muted")}</div>;
  if (k === "arena") return <div className="bg-band p-3 text-band-foreground"><div className="mb-3 flex items-center justify-between text-[10px]"><b className="tracking-widest">ARENA</b><span className="text-muted-foreground">CLUBES · NOVIDADES · OFERTAS</span></div><div className="mb-2 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-800 p-4"><p className="text-lg font-black uppercase leading-none">Vista a paixão</p><span className="mt-2 inline-block rounded bg-surface px-2 py-1 text-[9px] font-bold text-foreground">COMPRAR</span></div><div className="mb-2 flex gap-1.5 text-[9px]">{["SÃO PAULO", "FLAMENGO", "PALMEIRAS", "SANTOS"].map((c) => <span key={c} className="rounded-full border border-neutral-600 px-2 py-0.5">{c}</span>)}</div>{grid(4, "bg-band")}</div>;
  if (k === "editorial") return <div className="bg-[#faf7f2] p-3 text-foreground" style={{ fontFamily: "Georgia, serif" }}><div className="mb-3 text-center text-[11px] tracking-[0.3em]">MAISON</div><div className="mb-3 grid grid-cols-5 gap-2"><div className="col-span-3 flex flex-col justify-center"><p className="text-lg leading-tight">A coleção<br />da estação</p><p className="mt-1 text-[9px] text-muted-foreground">Peças pensadas para durar.</p></div><div className="col-span-2 aspect-[4/5] rounded bg-border" /></div>{grid(3, "bg-border")}</div>;
  return <div className="bg-surface p-3"><div className="mb-2 flex items-center justify-between rounded bg-band px-2 py-1 text-[9px] text-band-foreground"><span>Novidades toda semana</span><span>Atendimento pelo WhatsApp</span></div><div className="mb-2 flex items-center justify-between text-[10px]"><b>SIGNATURE</b><span className="hidden gap-2 text-muted-foreground sm:flex"><span>Camisas ▾</span><span>Times ▾</span><span>Novidades</span><span className="rounded-full bg-surface-muted px-2">Buscar…</span></span></div><div className="relative mb-2 aspect-[16/7] overflow-hidden rounded-lg bg-band"><div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent" /><div className="absolute bottom-2 left-3 text-band-foreground"><p className="text-sm font-extrabold">Coleção 25/26</p><span className="mt-1 inline-block rounded bg-surface px-2 py-0.5 text-[9px] font-bold text-foreground">Ver lookbook</span></div><span className="absolute right-2 top-2 rounded-full bg-surface/90 px-2 py-0.5 text-[8px] font-bold">▶ Vídeo</span></div>{grid(4, "bg-surface-muted")}<div className="mt-2 rounded-lg bg-band px-3 py-2 text-center text-[10px] font-bold text-band-foreground sm:hidden">Comprar agora</div></div>;
}

/** `prices`: rótulo de preço de cada tema, lido do catálogo no servidor (fonte única; tema não liberado não aparece). */
export function ThemeShowcase({ prices }: { prices: Partial<Record<Key, string>> }) {
  const list = THEMES.filter((x) => prices[x.key]);
  const [k, setK] = React.useState<Key>(list.some((x) => x.key === "editorial") ? "editorial" : list[0]?.key ?? "starter");
  const t = THEMES.find((x) => x.key === k)!;
  return (
    <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_1fr]">
      <div className="overflow-hidden rounded-xl border border-border shadow-[0_24px_60px_rgba(15,28,22,0.14)]" aria-hidden><ThemeMock k={k} /></div>
      <div>
        <div role="radiogroup" aria-label="Escolha um tema para ver" className="mb-6 grid grid-cols-2 gap-2">
          {list.map((x) => <button key={x.key} type="button" role="radio" aria-checked={k === x.key} onClick={() => setK(x.key)} className={cn("rounded-xl border p-3 text-left transition-all", k === x.key ? "border-foreground bg-surface shadow-md" : "border-border bg-surface/60 hover:bg-surface")}><span className="block text-sm font-bold">{x.name}</span><span className="block text-sm tabular-nums text-muted-foreground">{prices[x.key]}</span></button>)}
        </div>
        <h3 className="nl-title">{t.name}</h3>
        <p className="mt-1 text-muted-foreground">{t.note}</p>
        <ul className="mt-4 space-y-2">{t.features.map((f) => <li key={f} className="flex gap-2.5 text-sm"><Check className="mt-0.5 size-4 shrink-0 text-link" aria-hidden />{f}</li>)}</ul>
        <p className="mt-5 flex items-center gap-2 rounded-lg bg-surface-muted px-3 py-2 text-sm"><MousePointerClick className="size-4 shrink-0" aria-hidden /> {t.key === "starter" ? "Já vem ativo na sua loja." : "Disponível na Loja NextLevel: compre e instale com 1 clique."}</p>
      </div>
    </div>
  );
}
