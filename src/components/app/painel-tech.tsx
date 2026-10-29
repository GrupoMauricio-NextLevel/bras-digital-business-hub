import { EC_FAMILIAS } from "@/components/portal/commerce/fontes-ec";

/**
 * Visual de tecnologia nos painéis (D224), versão contida para o trabalho do dia a dia: Space Grotesk nos títulos, Geist no
 * texto, Geist Mono nos números e rótulos do menu, cartões com borda fina em degradê. O painel escuro com grade fica só no
 * bloco de abertura (`.ds-hero`). Entra e sai junto com a casca (como o `AreaTheme`), então vale também para diálogos e menus.
 * Ligado no painel do lojista da E-commerce, no Master e no painel do parceiro da E-commerce.
 */
const f = EC_FAMILIAS;
const CSS = `
:root{--ds-font-ui:${f.texto},system-ui,sans-serif;--font-sans:${f.texto},system-ui,sans-serif;--nl-font-display:${f.titulo},system-ui,sans-serif;--font-display:${f.titulo},system-ui,sans-serif;--pn-mono:${f.mono},ui-monospace,monospace;--ec-mono:var(--pn-mono);--ec-verde:#22e08a;--ec-ciano-vivo:#22d3ee;--ec-linha:linear-gradient(120deg,rgb(34 211 238/.75),rgb(124 92 255/.55) 45%,rgb(34 224 138/.7))}
body{font-family:var(--ds-font-ui)}
:is(h1,h2,h3,.ds-head h1){font-family:var(--nl-font-display);letter-spacing:-.02em}
.ds-head h1{font-weight:700;letter-spacing:-.03em}
.ds-content .tabular-nums{font-family:var(--pn-mono);letter-spacing:-.01em}
.ds-group-label,.ds-eyebrow{font-family:var(--pn-mono);text-transform:uppercase;letter-spacing:.1em;font-size:.68rem;font-weight:500}
.ds-group-label::before,.ds-eyebrow::before{content:"// ";opacity:.5}
.ds-card{border:1px solid transparent!important;background:linear-gradient(var(--ds-surface),var(--ds-surface)) padding-box,linear-gradient(140deg,rgb(34 211 238/.4),rgb(124 92 255/.22) 45%,color-mix(in srgb,var(--ds-line) 80%,transparent) 70%) border-box!important;box-shadow:0 18px 40px -34px rgb(34 211 238/.55)}
.ds-hero{border:1px solid transparent!important;color:#e8eefc;border-radius:1.75rem;background:linear-gradient(#0a1224,#0a1224) padding-box,linear-gradient(120deg,rgb(34 211 238/.8),rgb(124 92 255/.6) 45%,rgb(34 224 138/.7)) border-box!important;box-shadow:0 40px 90px -45px rgb(34 211 238/.6)}
.ds-hero::after{content:"";position:absolute;inset:0;z-index:-1;pointer-events:none;background-image:linear-gradient(rgb(255 255 255/.05) 1px,transparent 1px),linear-gradient(90deg,rgb(255 255 255/.05) 1px,transparent 1px);background-size:32px 32px;-webkit-mask-image:radial-gradient(ellipse 80% 90% at 85% 10%,#000 20%,transparent 75%);mask-image:radial-gradient(ellipse 80% 90% at 85% 10%,#000 20%,transparent 75%)}
.ds-hero .ds-hero-stage{opacity:.18}
.ds-hero :is(h1,h2){color:#fff;font-weight:700;letter-spacing:-.035em}
.ds-hero .ds-eyebrow{color:#7dd3fc}
.ds-hero :is(p,span){color:#c9d4ee}
.ds-hero :is(b,strong,.tabular-nums){color:#fff}
.ds-hero :is(.ds-chip,[class*="rounded-full"]:not([class*="size-"]):not([class*="h-1"]):not([class*="h-2"])){background:rgb(255 255 255/.06);border-color:rgb(255 255 255/.16);color:#e8eefc}
.ds-hero .ds-btn--ghost{background:transparent;color:#fff;border-color:rgb(255 255 255/.3)}
`;

export function PainelTech() {
  return <style>{CSS}</style>;
}
