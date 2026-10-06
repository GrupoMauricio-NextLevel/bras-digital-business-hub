"use client";
import * as React from "react";
import { fontStack } from "@/lib/ds/fonts";
import { formatBRL } from "@/lib/money";
import { DEMO_STORES } from "./demo-stores";
import { Photo } from "./store-mock";

const THEMES = [
  { key: "marinho", label: "Marinho e dourado", primary: "#14213d", accent: "#8a5a12", font: "moderna" },
  { key: "musgo", label: "Musgo e coral", primary: "#1f3d2b", accent: "#b8400f", font: "elegante" },
  { key: "vinho", label: "Vinho e rosé", primary: "#5b1230", accent: "#a8325f", font: "moderna" },
] as const;

const STEPS = [
  { t: "Ajuste textos e cores", d: "Troque as cores da marca e a fonte dos títulos. A vitrine muda na hora, sem código." },
  { t: "Adicione seções prontas", d: "Escolha entre seções como faixa de confiança, categorias, banners e vitrine de produtos." },
  { t: "Organize como quiser", d: "Arraste as seções para mudar a ordem da página e confira a prévia antes de publicar." },
];

type Sec = { id: string; label: string };
const BASE: Sec[] = [{ id: "destaque", label: "Destaque principal" }, { id: "vitrine", label: "Vitrine de produtos" }];
const TRUST: Sec = { id: "confianca", label: "Faixa de confiança" };

/** Dispositivo fixo na tela e três passos que o acendem conforme a rolagem (no computador) ou o clique (no celular). Simulação: não salva nada. */
export function Personalize() {
  const store = DEMO_STORES[0]!;
  const [step, setStep] = React.useState(0);
  const [theme, setTheme] = React.useState<(typeof THEMES)[number]["key"]>("marinho");
  const refs = React.useRef<(HTMLLIElement | null)[]>([]);
  React.useEffect(() => {
    if (!window.matchMedia("(min-width: 1024px)").matches) return;
    const io = new IntersectionObserver((es) => { for (const e of es) if (e.isIntersecting) setStep(Number((e.target as HTMLElement).dataset.step)); }, { rootMargin: "-42% 0px -42% 0px" });
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);
  const t = THEMES.find((x) => x.key === theme)!;
  const order: Sec[] = step === 0 ? BASE : step === 1 ? [BASE[0]!, BASE[1]!, TRUST] : [TRUST, BASE[0]!, BASE[1]!];
  const sectionsOnPage = step === 0 ? BASE : order;
  const ROW = 38;
  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
      <ol className="space-y-3 lg:space-y-0">
        {STEPS.map((s, n) => (
          <li key={s.t} data-step={n} ref={(el) => { refs.current[n] = el; }} className="lg:flex lg:min-h-[58vh] lg:items-center">
            <button type="button" onClick={() => setStep(n)} aria-pressed={step === n} className={`w-full border-l-4 py-3 pl-5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring ${step === n ? "border-primary" : "border-border hover:border-foreground/40"}`}>
              <span className="text-sm font-bold uppercase tracking-wider text-link">Passo {n + 1}</span>
              <span className={`mt-1 block font-[family-name:var(--nl-font-display)] text-2xl font-extrabold leading-tight transition-colors sm:text-3xl ${step === n ? "text-foreground" : "text-muted-foreground"}`}>{s.t}</span>
              <span className={`mt-2 block max-w-md text-lg leading-relaxed transition-opacity ${step === n ? "text-body" : "text-muted-foreground"}`}>{s.d}</span>
            </button>
          </li>
        ))}
      </ol>

      <div className="lg:sticky lg:top-24 lg:self-start">
        <div className="overflow-hidden rounded-[1.4rem] bg-band p-2 shadow-[0_30px_80px_-30px_rgba(14,26,51,0.6)]">
          <div className="overflow-hidden rounded-[1rem] bg-surface-muted">
            <div className="flex items-center gap-2 border-b border-border bg-surface px-3 py-2 text-[12px]" aria-hidden>
              <b>Editor do tema</b>
              <span className="ml-auto flex items-center gap-2 text-muted-foreground">{step === 0 ? THEMES.map((x) => <span key={x.key} className="inline-block size-3.5 rounded-full ring-2 ring-white outline outline-1 outline-neutral-300" style={{ background: x.accent }} />) : <span className="text-success">✓ Rascunho salvo</span>}</span>
              <span className="rounded-md bg-band px-2.5 py-1 font-semibold text-band-foreground">Publicar</span>
            </div>
            <div className="grid sm:grid-cols-[11.5rem_minmax(0,1fr)]">
              <div className="hidden border-r border-border bg-surface p-3 text-[12px] sm:block">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Página inicial</p>
                <div className="relative" style={{ height: ROW * 3 }} aria-hidden>
                  {[...BASE, TRUST].map((sec) => {
                    const idx = order.findIndex((o) => o.id === sec.id);
                    const present = idx >= 0;
                    return <div key={sec.id} className="absolute inset-x-0 flex items-center rounded-md border bg-surface px-2 transition-all duration-500" style={{ height: ROW - 6, top: (present ? idx : 2) * ROW, opacity: present ? 1 : 0, borderColor: sec.id === "confianca" && step >= 1 ? "var(--ds-primary)" : "#e5e5e5" }}><span className="mr-1.5 text-muted-foreground">⋮⋮</span>{sec.label}</div>;
                  })}
                </div>
                <p className={`mt-3 rounded-md border border-dashed px-2 py-1.5 text-center font-semibold transition-colors ${step === 1 ? "border-[#1f47c9] bg-[#1f47c9]/10 text-link" : "border-border text-muted-foreground"}`}>+ Adicionar seção</p>
                {step === 1 ? <ul key="menu" className="cm-pop mt-2 space-y-1 rounded-md border border-border bg-surface p-1.5 shadow-lg"><li className="rounded bg-primary/25 px-2 py-1 font-semibold">Faixa de confiança</li><li className="px-2 py-1 text-muted-foreground">Categorias</li><li className="px-2 py-1 text-muted-foreground">Banners</li></ul> : null}
              </div>
              <div className="min-w-0 p-3 sm:p-4">
                <div className="overflow-hidden rounded-lg border border-border bg-white text-neutral-900" style={{ fontFamily: "var(--nl-font-text), ui-sans-serif, system-ui, sans-serif" }}>
                  <div className="flex items-center gap-3 px-3 py-2.5 text-band-foreground transition-colors duration-500" style={{ background: t.primary }}>
                    <span className="text-sm font-extrabold transition-all" style={{ fontFamily: fontStack(t.font) }}>{store.name}</span>
                    <ul className="ml-2 hidden gap-3 text-[11px] text-band-foreground/80 sm:flex">{store.nav.slice(0, 3).map((n) => <li key={n}>{n}</li>)}</ul>
                  </div>
                  {sectionsOnPage.map((sec, i) => (
                    <div key={`${sec.id}-${step}`} className="cm-pop" style={{ animationDelay: `${i * 60}ms` }}>
                      {sec.id === "destaque" ? (
                        <div className="relative"><Photo src={store.banner.img} ratio="16/6" className="max-h-44" /><div className="absolute inset-y-0 left-0 flex max-w-[65%] flex-col justify-center gap-1.5 bg-gradient-to-r from-black/65 to-transparent p-3 text-band-foreground"><b className="text-base leading-tight transition-all sm:text-lg" style={{ fontFamily: fontStack(t.font) }}>{store.banner.title}</b><span className="inline-flex w-fit rounded-full px-2.5 py-1 text-[10px] font-bold text-band-foreground transition-colors duration-500" style={{ background: t.accent }}>{store.banner.cta}</span></div></div>
                      ) : null}
                      {sec.id === "confianca" ? (
                        <ul className="grid grid-cols-3 gap-px border-y border-border bg-border text-center text-[10px] font-semibold text-foreground">{["Envio para todo o Brasil", "Pagamento protegido", "Troca em 7 dias"].map((x) => <li key={x} className="bg-surface px-1 py-2">{x}</li>)}</ul>
                      ) : null}
                      {sec.id === "vitrine" ? (
                        <ul className="grid grid-cols-4 gap-2 p-2.5">{store.products.map((p) => <li key={p.name} className="min-w-0"><Photo src={p.img} ratio="1/1" className="rounded-md" /><p className="mt-1 truncate text-[10px] font-semibold" style={{ fontFamily: fontStack(t.font) }}>{p.name}</p><p className="text-[10px] font-bold" style={{ color: t.accent }}>{formatBRL(p.priceCents)}</p></li>)}</ul>
                      ) : null}
                    </div>
                  ))}
                </div>
                <div role="radiogroup" aria-label="Cores da marca" className="mt-3 flex flex-wrap gap-2 sm:hidden">{THEMES.map((x) => <button key={x.key} type="button" role="radio" aria-checked={theme === x.key} onClick={() => setTheme(x.key)} className={`min-h-11 rounded-md border px-3 text-sm font-medium ${theme === x.key ? "border-foreground bg-band text-band-foreground" : "border-border bg-surface"}`}>{x.label}</button>)}</div>
              </div>
            </div>
          </div>
        </div>
        <div role="radiogroup" aria-label="Cores da marca" className="mt-4 hidden flex-wrap gap-2 sm:flex">
          {THEMES.map((x) => <button key={x.key} type="button" role="radio" aria-checked={theme === x.key} onClick={() => setTheme(x.key)} className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${theme === x.key ? "border-foreground bg-band text-band-foreground" : "border-foreground/25 bg-surface text-foreground hover:border-foreground"}`}><span aria-hidden className="size-3 rounded-full" style={{ background: x.accent }} />{x.label}</button>)}
        </div>
        <p className="mt-3 text-sm text-body">Simulação de demonstração: nada é salvo. Nomes de seção como no editor de hoje.</p>
      </div>
    </div>
  );
}
