// Definição do sistema: marcas, escalas, neutros, papéis de interface por tema e tokens semânticos.
import { oklchToHex, hexToOklch, contrast, mixOk, deltaE } from "./cores.mjs";

export const NAVY = "#101B34", AMARELO = "#F5BC00", OFFWHITE = "#F4F1E9";
export const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
const L_STEPS = [0.975, 0.945, 0.89, 0.82, 0.735, 0.615, 0.545, 0.48, 0.405, 0.335, 0.265];
const C_FACTOR = [0.1, 0.2, 0.42, 0.7, 0.92, 1, 0.97, 0.88, 0.76, 0.62, 0.48];

/** Marcas: oficial = tem logo no kit v1; planejada = só proposta de cor. Hue e croma em OKLCH. */
export const MARCAS = [
  { id: "nextlevel", nome: "NextLevel Soluções Digitais", curto: "NextLevel", papel: "Marca central do grupo", oficial: true, pasta: "nextlevel-solucoes-digitais", cor: "Amarelo NextLevel", H: 86.5, C: 0.169, especial: "amarelo" },
  { id: "commerce", nome: "NextLevel Commerce", curto: "Commerce", papel: "Motor de catálogo, pedidos e checkout", oficial: true, pasta: "nextlevel-commerce", cor: "Azul Commerce", H: 258, C: 0.19 },
  { id: "superdrop", nome: "SuperDrop", curto: "SuperDrop", papel: "Distribuição e dropshipping", oficial: true, pasta: "superdrop", cor: "Verde SuperDrop", H: 145, C: 0.17 },
  { id: "creators", nome: "Creators Hub", curto: "Creators", papel: "Campanhas, links e comissões dos creators", oficial: true, pasta: "creators-hub", cor: "Magenta Creators", H: 352, C: 0.19 },
  { id: "play", nome: "NextLevel Play", curto: "Play", papel: "Feed, lives e compras (planejada)", oficial: false, cor: "Violeta Play", H: 306, C: 0.19 },
  { id: "chinahub", nome: "China Hub", curto: "China Hub", papel: "Fornecedores e importadores (planejada)", oficial: false, cor: "Jade China Hub", H: 200, C: 0.12 },
  { id: "bras", nome: "Brás Digital", curto: "Brás", papel: "Ecossistema comercial do Brás (planejada)", oficial: false, cor: "Laranja Brás", H: 47, C: 0.18 },
];

/** Escala de 11 passos. O amarelo do grupo é ancorado no oficial (#F5BC00 = 400) e desce para âmbar sem esverdear. */
export function escala(m) {
  const out = {};
  if (m.especial === "amarelo") {
    const Ls = [0.98, 0.955, 0.915, 0.87, null, 0.73, 0.635, 0.545, 0.46, 0.38, 0.29];
    STEPS.forEach((s, i) => {
      if (s === 400) { out[s] = AMARELO; return; }
      const H = i < 4 ? 88 : 86.5 - (i - 4) * 4.2; // passos escuros puxam para âmbar/bronze
      const C = m.C * [0.16, 0.3, 0.55, 0.8, 1, 0.92, 0.82, 0.72, 0.6, 0.5, 0.4][i];
      out[s] = oklchToHex(Ls[i], C, H);
    });
    return out;
  }
  STEPS.forEach((s, i) => { out[s] = oklchToHex(L_STEPS[i], m.C * C_FACTOR[i], m.H); });
  return out;
}

// ---------- Neutros compartilhados (família navy + off-white) ----------
export const NEUTROS = {
  claro: { canvas: OFFWHITE, surface: "#FFFFFF", surface2: "#ECE8DD", ink: NAVY, text2: "#4A5268", border: "#D8D3C6", borderStrong: "#7C8294", overlay: "rgba(16,27,52,.45)" },
  escuro: { canvas: "#0B1427", surface: NAVY, surface2: "#18264A", ink: OFFWHITE, text2: "#B3B9CA", border: "#2A3961", borderStrong: "#7D88A6", overlay: "rgba(4,8,18,.6)" },
};
export const NEUTRAL_SCALE = (() => { const o = {}; [0.985, 0.955, 0.9, 0.82, 0.7, 0.58, 0.47, 0.38, 0.3, 0.227, 0.17].forEach((L, i) => { o[STEPS[i]] = oklchToHex(L, i < 3 ? 0.012 : 0.03 + i * 0.002, i < 3 ? 89 : 264.7); }); o[900] = NAVY; return o; })();

// ---------- Semânticos (iguais para todas as marcas; nunca usados como cor de marca) ----------
const SEM_HUE = { sucesso: 158, alerta: 72, erro: 27, info: 236 };
export function semanticos(tema) {
  const n = NEUTROS[tema], out = {};
  for (const [k, H] of Object.entries(SEM_HUE)) {
    const C = k === "alerta" ? 0.15 : k === "info" ? 0.13 : 0.16;
    if (tema === "claro") {
      const fg = pickL((L) => oklchToHex(L, C, H), [n.surface, n.canvas], 4.5, "desc", 0.62);
      const soft = oklchToHex(0.955, C * 0.25, H);
      const solid = pickL((L) => oklchToHex(L, C, H), ["#FFFFFF"], 4.5, "desc", 0.62);
      out[k] = { fg, soft, onSoft: pickL((L) => oklchToHex(L, C, H), [soft], 4.5, "desc", 0.6), solid, onSolid: "#FFFFFF", borda: oklchToHex(0.82, C * 0.6, H) };
    } else {
      const fg = pickL((L) => oklchToHex(L, C, H), [n.surface, n.canvas, n.surface2], 4.5, "asc", 0.6);
      const soft = mixOk(n.surface, oklchToHex(0.6, C, H), 0.2);
      const solid = oklchToHex(0.78, C, H);
      out[k] = { fg, soft, onSoft: pickL((L) => oklchToHex(L, C, H), [soft], 4.5, "asc", 0.6), solid, onSolid: NAVY, borda: mixOk(n.surface, oklchToHex(0.6, C, H), 0.5) };
    }
  }
  return out;
}

/** Procura a luminosidade mais próxima de `start` que atinge `min` contra todos os fundos. dir desc = escurece, asc = clareia. */
export function pickL(fn, bgs, min, dir, start) {
  for (let i = 0; i <= 400; i++) {
    const L = dir === "desc" ? start - i * 0.002 : start + i * 0.002;
    if (L < 0 || L > 1) break;
    const h = fn(L);
    if (bgs.every((b) => contrast(h, b) >= min)) return h;
  }
  return dir === "desc" ? "#000000" : "#FFFFFF";
}

/** Primeiro passo da escala (na ordem dada) que atinge o contraste mínimo contra todos os fundos. */
function stepWith(esc, order, bgs, min) { for (const s of order) if (bgs.every((b) => contrast(esc[s], b) >= min)) return s; return order[order.length - 1]; }

/** Papéis de interface por marca e tema. Retorna também a origem (passo) de cada papel. */
export function papeis(m, esc, tema) {
  const n = NEUTROS[tema];
  const DOWN = [500, 600, 700, 800, 900, 950], UP = [300, 200, 100, 50];
  if (tema === "claro") {
    let primary, onPrimary;
    if (m.especial === "amarelo") { primary = 400; onPrimary = NAVY; }
    else { primary = stepWith(esc, [500, 600, 700, 800], ["#FFFFFF"], 4.5); onPrimary = "#FFFFFF"; }
    const idx = STEPS.indexOf(primary);
    const soft = esc[100], softStrong = esc[200];
    const text = stepWith(esc, DOWN, [n.canvas, n.surface, n.surface2, soft, softStrong], 4.5);
    const indicator = stepWith(esc, m.especial === "amarelo" ? [600, 700, 800] : [500, 600, 700], [n.canvas, n.surface], 3);
    const mark = m.especial === "amarelo" ? 400 : 500;
    return {
      "brand-primary": esc[primary], "brand-on-primary": onPrimary, "brand-hover": esc[STEPS[idx + 1]], "brand-active": esc[STEPS[idx + 2]],
      "brand-soft": soft, "brand-soft-strong": softStrong, "brand-on-soft": esc[text], "brand-text": esc[text],
      "brand-indicator": esc[indicator], "brand-mark": esc[mark], "focus-ring": esc[indicator],
      _origem: { primary, text, indicator, mark },
    };
  }
  // escuro
  const primary = m.especial === "amarelo" ? 400 : 400;
  const onPrimary = [NAVY, "#0B1427"].find((c) => contrast(c, esc[primary]) >= 4.5) ?? NAVY;
  const soft = mixOk(n.surface, esc[500], 0.2), softStrong = mixOk(n.surface, esc[500], 0.32);
  const text = stepWith(esc, [400, 300, 200, 100], [n.canvas, n.surface, n.surface2, soft, softStrong], 4.5);
  // pressionado: escurece em direção ao 500 até onde o rótulo ainda tem 4,5:1
  let active = esc[400];
  for (let t = 0.7; t >= 0; t -= 0.05) { const c = mixOk(esc[400], esc[500], t); if (contrast(onPrimary, c) >= 4.5) { active = c; break; } }
  const indicator = stepWith(esc, [400, 300, 200], [n.canvas, n.surface, n.surface2], 3);
  return {
    "brand-primary": esc[primary], "brand-on-primary": onPrimary, "brand-hover": esc[300], "brand-active": active,
    "brand-soft": soft, "brand-soft-strong": softStrong, "brand-on-soft": esc[text], "brand-text": esc[text],
    "brand-indicator": esc[indicator], "brand-mark": esc[400], "focus-ring": esc[indicator],
    _origem: { primary, text, indicator, mark: 400 },
  };
}

export function neutrosTokens(tema) {
  const n = NEUTROS[tema];
  return {
    canvas: n.canvas, surface: n.surface, "surface-2": n.surface2, "text-primary": n.ink, "text-secondary": n.text2,
    border: n.border, "border-strong": n.borderStrong, overlay: n.overlay,
  };
}

export function sistema() {
  return MARCAS.map((m) => {
    const esc = escala(m);
    return { ...m, escala: esc, assinatura: m.especial === "amarelo" ? AMARELO : esc[500], claro: papeis(m, esc, "claro"), escuro: papeis(m, esc, "escuro") };
  });
}

/** Distância mínima entre assinaturas (ΔE OK) para garantir que nenhuma dupla pareça igual. */
export function distancias(lista, chave = (x) => x.assinatura) {
  const out = [];
  for (let i = 0; i < lista.length; i++) for (let j = i + 1; j < lista.length; j++) out.push({ a: lista[i].id, b: lista[j].id, dE: deltaE(chave(lista[i]), chave(lista[j])) });
  return out.sort((p, q) => p.dE - q.dE);
}
export { hexToOklch };
