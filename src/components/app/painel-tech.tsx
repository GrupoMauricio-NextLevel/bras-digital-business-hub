import { EC_FAMILIAS } from "@/components/portal/commerce/fontes-ec";

/**
 * Visual de tecnologia nos painéis (D224), versão contida para o trabalho do dia a dia: Space Grotesk nos títulos, Geist no
 * texto, Geist Mono nos números e rótulos do menu, cartões com borda fina em degradê. O bloco de abertura (`.ds-hero`) vira vidro
 * colorido nas cores do topo (roxo, violeta e azul), com grade leve (D225; antes era painel escuro). Entra e sai junto com a casca (como o `AreaTheme`), então vale também para diálogos e menus.
 * Ligado no painel do lojista da Commerce, no Master e no painel do parceiro da Commerce.
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
.ds-hero{border:1px solid rgb(255 255 255/.35)!important;color:#fff;border-radius:1.75rem;background:radial-gradient(60% 90% at 88% 0%,rgb(255 63 209/.45),transparent 60%),radial-gradient(50% 80% at 0% 100%,rgb(61 139 255/.5),transparent 60%),linear-gradient(135deg,rgb(76 29 149/.88),rgb(91 72 220/.82) 55%,rgb(37 99 235/.8))!important;-webkit-backdrop-filter:blur(18px) saturate(1.3);backdrop-filter:blur(18px) saturate(1.3);box-shadow:inset 0 1px 0 rgb(255 255 255/.45),inset 0 -1px 0 rgb(255 255 255/.08),0 30px 70px -35px rgb(91 72 220/.75)}
.ds-hero::after{content:"";position:absolute;inset:0;z-index:-1;pointer-events:none;background-image:linear-gradient(rgb(255 255 255/.07) 1px,transparent 1px),linear-gradient(90deg,rgb(255 255 255/.07) 1px,transparent 1px);background-size:32px 32px;-webkit-mask-image:radial-gradient(ellipse 80% 90% at 85% 10%,#000 20%,transparent 75%);mask-image:radial-gradient(ellipse 80% 90% at 85% 10%,#000 20%,transparent 75%)}
.ds-hero .ds-hero-stage{opacity:.5}
.ds-hero :is(h1,h2){color:#fff;font-weight:700;letter-spacing:-.035em}
.ds-hero .ds-eyebrow{color:rgb(255 255 255/.8)}
.ds-hero :is(p,span){color:rgb(255 255 255/.86)}
.ds-hero :is(b,strong,.tabular-nums){color:#fff}
.ds-hero :is(.ds-chip,[class*="rounded-full"]:not([class*="size-"]):not([class*="h-1"]):not([class*="h-2"])){background:rgb(255 255 255/.12);border-color:rgb(255 255 255/.28);color:#fff}
.ds-hero .ds-btn--ghost{background:transparent;color:#fff;border-color:rgb(255 255 255/.4)}
.ds-hero .ec-tag{color:#fff;background:rgb(255 255 255/.14);box-shadow:0 0 0 1px rgb(255 255 255/.3) inset}
`;

/** Durante a Black (D232), a abertura de vidro ganha contorno neon verde e ciano. */
const CSS_BLACK = `.ds-hero{box-shadow:0 0 0 1.5px rgb(34 224 138/.75),0 0 40px -8px rgb(34 224 138/.6),inset 0 1px 0 rgb(255 255 255/.45),0 30px 70px -35px rgb(91 72 220/.75)!important}`;

export function PainelTech({ black = false }: { black?: boolean }) {
  return <style>{black ? CSS + CSS_BLACK : CSS}</style>;
}
