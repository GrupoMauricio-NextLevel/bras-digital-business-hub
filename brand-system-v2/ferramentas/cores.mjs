// Motor de cor: sRGB <-> OKLab/OKLCH (Björn Ottosson, 2020), contraste WCAG 2.x, ΔE OK, ajuste ao gamut sRGB.
export const clamp01 = (x) => Math.min(1, Math.max(0, x));
export const hexToRgb = (h) => { const s = h.replace("#", ""); return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16) / 255); };
export const rgbToHex = (rgb) => "#" + rgb.map((c) => Math.round(clamp01(c) * 255).toString(16).padStart(2, "0")).join("").toUpperCase();
export const toLin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
export const fromLin = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

export function linToOklab([r, g, b]) {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
}
export function oklabToLin([L, a, b]) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
}
export const hexToOklab = (h) => linToOklab(hexToRgb(h).map(toLin));
export function hexToOklch(h) { const [L, a, b] = hexToOklab(h); const C = Math.hypot(a, b); let H = (Math.atan2(b, a) * 180) / Math.PI; if (H < 0) H += 360; return [L, C, C < 1e-4 ? 0 : H]; }
const inGamut = (lin) => lin.every((c) => c >= -1e-5 && c <= 1 + 1e-5);
/** OKLCH -> HEX; se sair do gamut sRGB, reduz o croma (mantém L e H), como o ajuste do CSS Color 4. */
export function oklchToHex(L, C, H) {
  const lab = (c) => [L, c * Math.cos((H * Math.PI) / 180), c * Math.sin((H * Math.PI) / 180)];
  let lin = oklabToLin(lab(C));
  if (!inGamut(lin)) { let lo = 0, hi = C; for (let i = 0; i < 30; i++) { const mid = (lo + hi) / 2; if (inGamut(oklabToLin(lab(mid)))) lo = mid; else hi = mid; } lin = oklabToLin(lab(lo)); }
  return rgbToHex(lin.map((c) => fromLin(clamp01(c))));
}
export const oklchStr = (h) => { const [L, C, H] = hexToOklch(h); return `oklch(${(L * 100).toFixed(1)}% ${C.toFixed(3)} ${H.toFixed(1)})`; };
export const lum = (h) => { const [r, g, b] = hexToRgb(h).map(toLin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
export const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
export const deltaE = (a, b) => { const p = hexToOklab(a), q = hexToOklab(b); return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]); };
/** Mistura em OKLab (t = peso de b). */
export function mixOk(a, b, t) { const p = hexToOklab(a), q = hexToOklab(b); const m = p.map((v, i) => v + (q[i] - v) * t); return rgbToHex(oklabToLin(m).map((c) => fromLin(clamp01(c)))); }

// Simulação de visão cromática: Machado, Oliveira & Fernandes (2009), severidade 1.0, aplicada em RGB linear.
export const CVD = {
  protanopia: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
  deuteranopia: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.01182, 0.04294, 0.968881]],
  tritanopia: [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.3039]],
};
export function simulate(hex, kind) {
  const lin = hexToRgb(hex).map(toLin);
  if (kind === "cinza") { const y = 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2]; return rgbToHex([y, y, y].map(fromLin)); }
  const M = CVD[kind];
  return rgbToHex(M.map((row) => fromLin(clamp01(row[0] * lin[0] + row[1] * lin[1] + row[2] * lin[2]))));
}
