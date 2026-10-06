// Gera paletas.json, tokens.json, tokens.css e contrastes.csv.
import { writeFileSync, mkdirSync } from "node:fs";
import { sistema, NEUTROS, NEUTRAL_SCALE, semanticos, neutrosTokens, STEPS, NAVY, AMARELO, OFFWHITE, distancias } from "./sistema.mjs";
import { contrast, oklchStr, deltaE } from "./cores.mjs";

const OUT = process.argv[2];
mkdirSync(OUT, { recursive: true });
const S = sistema();
const TEMAS = ["claro", "escuro"];
const SEM = { claro: semanticos("claro"), escuro: semanticos("escuro") };
const SEM_NOME = { sucesso: "success", alerta: "warning", erro: "danger", info: "info" };
const cor = (hex) => ({ hex, oklch: oklchStr(hex) });
const r2 = (x) => Math.round(x * 100) / 100;

// ---------------- Pares avaliados (contrastes.csv) ----------------
const pares = [];
const add = (tema, marca, frente, fundo, cf, cb, funcao, criterio, minimo, obs = "") => {
  const v = contrast(cf, cb);
  let resultado = v >= minimo ? "aprovado" : "reprovado";
  if (criterio.startsWith("logotipo")) resultado = v >= 3 ? "isento (logotipo); acima de 3:1" : "isento (logotipo); abaixo de 3:1";
  if (criterio.startsWith("informativo")) resultado = "informativo";
  if (criterio.startsWith("uso proibido")) resultado = "uso proibido pela regra";
  if (criterio.startsWith("observação")) resultado = v >= minimo ? "aprovado" : "atendido pelo rótulo (ver observação)";
  pares.push({ tema, marca, frente, fundo, cf, cb, contraste: r2(v), funcao, criterio, minimo, resultado, obs });
};
for (const t of TEMAS) {
  const n = neutrosTokens(t);
  for (const bg of ["canvas", "surface", "surface-2"]) {
    add(t, "todas", "text-primary", bg, n["text-primary"], n[bg], "texto principal", "texto comum ≥4,5:1", 4.5);
    add(t, "todas", "text-secondary", bg, n["text-secondary"], n[bg], "texto de apoio, rótulos", "texto comum ≥4,5:1", 4.5);
  }
  add(t, "todas", "border-strong", "surface", n["border-strong"], n.surface, "borda de campo de formulário", "componente ≥3:1", 3);
  add(t, "todas", "border", "surface", n.border, n.surface, "divisória decorativa (não identifica componente)", "informativo", 0);
  for (const [k, v] of Object.entries(SEM[t])) {
    const nm = SEM_NOME[k];
    add(t, "todas", `${nm}`, "surface", v.fg, n.surface, `texto/ícone de ${k}`, "texto comum ≥4,5:1", 4.5);
    add(t, "todas", `${nm}`, "canvas", v.fg, n.canvas, `texto/ícone de ${k}`, "texto comum ≥4,5:1", 4.5);
    add(t, "todas", `on-${nm}-soft`, `${nm}-soft`, v.onSoft, v.soft, `texto em aviso de ${k}`, "texto comum ≥4,5:1", 4.5);
    add(t, "todas", `on-${nm}-solid`, `${nm}-solid`, v.onSolid, v.solid, `texto em selo/botão de ${k}`, "texto comum ≥4,5:1", 4.5);
  }
  for (const m of S) {
    const p = m[t];
    add(t, m.id, "brand-on-primary", "brand-primary", p["brand-on-primary"], p["brand-primary"], "rótulo do botão principal", "texto comum ≥4,5:1", 4.5);
    add(t, m.id, "brand-on-primary", "brand-hover", p["brand-on-primary"], p["brand-hover"], "rótulo do botão em hover", "texto comum ≥4,5:1", 4.5);
    add(t, m.id, "brand-on-primary", "brand-active", p["brand-on-primary"], p["brand-active"], "rótulo do botão pressionado", "texto comum ≥4,5:1", 4.5);
    for (const bg of ["canvas", "surface", "surface-2"]) add(t, m.id, "brand-text", bg, p["brand-text"], n[bg], "link e texto de destaque", "texto comum ≥4,5:1", 4.5);
    add(t, m.id, "brand-on-soft", "brand-soft", p["brand-on-soft"], p["brand-soft"], "item ativo do menu, etiqueta da marca", "texto comum ≥4,5:1", 4.5);
    add(t, m.id, "brand-on-soft", "brand-soft-strong", p["brand-on-soft"], p["brand-soft-strong"], "item selecionado com ênfase", "texto comum ≥4,5:1", 4.5);
    add(t, m.id, "brand-indicator", "surface", p["brand-indicator"], n.surface, "barra do item ativo, progresso, seleção", "componente ≥3:1", 3);
    add(t, m.id, "brand-indicator", "canvas", p["brand-indicator"], n.canvas, "barra do item ativo, progresso, seleção", "componente ≥3:1", 3);
    add(t, m.id, "focus-ring", "surface", p["focus-ring"], n.surface, "anel de foco do teclado", "componente ≥3:1", 3);
    add(t, m.id, "brand-primary", "canvas", p["brand-primary"], n.canvas, "título grande na cor da marca (≥24 px ou ≥18,66 px negrito)", m.especial === "amarelo" && t === "claro" ? "uso proibido no claro (amarelo como texto)" : "texto grande ≥3:1", 3,
      m.especial === "amarelo" && t === "claro" ? "No claro, o amarelo não serve como texto; use brand-text." : "");
    add(t, m.id, "brand-primary", "surface", p["brand-primary"], n.surface, "limite do botão principal contra a superfície", m.especial === "amarelo" && t === "claro" ? "observação: componente ≥3:1" : "componente ≥3:1", 3,
      m.especial === "amarelo" && t === "claro" ? "O rótulo navy identifica o botão (o critério 1.4.11 não exige o limite quando há texto); em campos e chips amarelos acrescente borda brand-indicator." : "");
    add(t, m.id, "brand-mark (raio)", t === "claro" ? "off-white" : "navy", p["brand-mark"], t === "claro" ? OFFWHITE : NAVY, "raio da logo sobre o fundo oficial", "logotipo (isento do 1.4.3/1.4.11)", 3,
      m.especial === "amarelo" && t === "claro" ? "Amarelo oficial preservado na marca do grupo; em favicon e avatar pequenos prefira a versão escura." : "");
  }
}
const csvCell = (x) => { const s = String(x); return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
writeFileSync(`${OUT}/contrastes.csv`, "﻿" + ["tema,marca,frente,fundo,cor_frente,cor_fundo,contraste,funcao,criterio,minimo,resultado,observacao", ...pares.map((p) => [p.tema, p.marca, p.frente, p.fundo, p.cf, p.cb, String(p.contraste).replace(".", ","), p.funcao, p.criterio, p.minimo, p.resultado, p.obs].map(csvCell).join(","))].join("\n") + "\n");

// ---------------- paletas.json ----------------
const papelPub = (p) => Object.fromEntries(Object.entries(p).filter(([k]) => !k.startsWith("_")).map(([k, v]) => [k, cor(v)]));
const paletas = {
  versao: "2.0.0",
  gerado_em: new Date().toISOString().slice(0, 10),
  modelo_de_cor: "Hex sRGB; OKLCH (CSS Color 4) calculado a partir do Hex. Fora do gamut sRGB, o croma é reduzido mantendo L e H.",
  base_compartilhada: { navy: cor(NAVY), amarelo: cor(AMARELO), offwhite: cor(OFFWHITE), neutros: Object.fromEntries(STEPS.map((s) => [s, cor(NEUTRAL_SCALE[s])])) },
  neutros_por_tema: Object.fromEntries(TEMAS.map((t) => [t, Object.fromEntries(Object.entries(neutrosTokens(t)).map(([k, v]) => [k, v.startsWith("#") ? cor(v) : { valor: v }]))])),
  semanticos: Object.fromEntries(TEMAS.map((t) => [t, Object.fromEntries(Object.entries(SEM[t]).map(([k, v]) => [SEM_NOME[k], Object.fromEntries(Object.entries(v).map(([a, b]) => [a, cor(b)]))]))])),
  marcas: S.map((m) => ({
    id: m.id, nome: m.nome, papel: m.papel, status: m.oficial ? "oficial (logo no kit v1)" : "planejada (proposta de cor, sem logo oficial)",
    nome_da_cor: m.cor, assinatura: cor(m.assinatura),
    elemento_com_a_cor: m.oficial ? "raio da logo e do monograma (o preenchimento que hoje é #F5BC00)" : "reservado ao raio quando a logo oficial existir",
    escala: Object.fromEntries(STEPS.map((s) => [s, cor(m.escala[s])])),
    papeis: { claro: papelPub(m.claro), escuro: papelPub(m.escuro) },
    origem_dos_papeis: { claro: m.claro._origem, escuro: m.escuro._origem },
    pares: Object.fromEntries(TEMAS.map((t) => [t, pares.filter((p) => p.marca === m.id && p.tema === t).map((p) => ({ frente: p.frente, fundo: p.fundo, cores: [p.cf, p.cb], contraste: p.contraste, criterio: p.criterio, resultado: p.resultado }))])),
  })),
  distancia_minima_entre_assinaturas: distancias(S).slice(0, 5).map((d) => ({ par: `${d.a} × ${d.b}`, deltaE_OK: r2(d.dE * 100) / 100 })),
};
writeFileSync(`${OUT}/paletas.json`, JSON.stringify(paletas, null, 2) + "\n");

// ---------------- tokens.json (formato Design Tokens: $value/$type) ----------------
const tk = (v, d) => ({ $value: v, $type: v.startsWith("#") ? "color" : "string", ...(d ? { $description: d } : {}) });
const semTokens = (t) => Object.fromEntries(Object.entries(SEM[t]).flatMap(([k, v]) => { const nm = SEM_NOME[k]; return [[nm, tk(v.fg)], [`${nm}-soft`, tk(v.soft)], [`on-${nm}-soft`, tk(v.onSoft)], [`${nm}-solid`, tk(v.solid)], [`on-${nm}-solid`, tk(v.onSolid)], [`${nm}-border`, tk(v.borda)]]; }));
const tokens = {
  $description: "Tokens do ecossistema NextLevel v2. Primitivos não mudam por tema; semânticos são resolvidos por marca (data-brand) e tema (data-theme).",
  primitivo: {
    base: { navy: tk(NAVY), amarelo: tk(AMARELO), offwhite: tk(OFFWHITE), branco: tk("#FFFFFF") },
    neutro: Object.fromEntries(STEPS.map((s) => [s, tk(NEUTRAL_SCALE[s])])),
    ...Object.fromEntries(S.map((m) => [m.id, Object.fromEntries(STEPS.map((s) => [s, tk(m.escala[s])]))])),
  },
  semantico: Object.fromEntries(TEMAS.map((t) => [t, { ...Object.fromEntries(Object.entries(neutrosTokens(t)).map(([k, v]) => [k, tk(v)])), ...semTokens(t) }])),
  marca: Object.fromEntries(S.map((m) => [m.id, Object.fromEntries(TEMAS.map((t) => [t, Object.fromEntries(Object.entries(m[t]).filter(([k]) => !k.startsWith("_")).map(([k, v]) => [k, tk(v)]))]))])),
};
writeFileSync(`${OUT}/tokens.json`, JSON.stringify(tokens, null, 2) + "\n");

// ---------------- tokens.css ----------------
const decl = (obj) => Object.entries(obj).map(([k, v]) => `  --${k}: ${v};`).join("\n");
const brandDecl = (p) => decl(Object.fromEntries(Object.entries(p).filter(([k]) => !k.startsWith("_"))));
const semDecl = (t) => decl(Object.fromEntries(Object.entries(semTokens(t)).map(([k, v]) => [k, v.$value])));
const neuDecl = (t) => decl(neutrosTokens(t));
const def = S[0];
let css = `/* =============================================================================
   Ecossistema NextLevel — tokens de cor v2 (gerado; não edite à mão: veja paletas.json)
   Uso: <html data-brand="commerce" data-theme="light|dark">. Sem data-theme, segue o sistema.
   Sem data-brand, vale NextLevel (marca do grupo).
   Neutros e semânticos são compartilhados; só --brand-* muda por marca.
   ============================================================================= */

/* ---- Primitivos (não mudam por tema) ---- */
:root {
  --nl-navy: ${NAVY};
  --nl-amarelo: ${AMARELO};
  --nl-offwhite: ${OFFWHITE};
${STEPS.map((s) => `  --neutral-${s}: ${NEUTRAL_SCALE[s]};`).join("\n")}
${S.map((m) => STEPS.map((s) => `  --${m.id}-${s}: ${m.escala[s]};`).join("\n")).join("\n")}
}

/* ---- Neutros e semânticos: claro (padrão) ---- */
:root, [data-theme="light"] {
  color-scheme: light;
${neuDecl("claro")}
${semDecl("claro")}
}
/* ---- Neutros e semânticos: escuro ---- */
[data-theme="dark"] {
  color-scheme: dark;
${neuDecl("escuro")}
${semDecl("escuro")}
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    color-scheme: dark;
${neuDecl("escuro").replace(/^/gm, "  ")}
${semDecl("escuro").replace(/^/gm, "  ")}
  }
}

/* ---- Marca: papéis no claro ---- */
:root, [data-brand="${def.id}"] {
${brandDecl(def.claro)}
}
${S.slice(1).map((m) => `[data-brand="${m.id}"] {\n${brandDecl(m.claro)}\n}`).join("\n")}

/* ---- Marca: papéis no escuro ---- */
${S.map((m) => `${m.id === def.id ? `[data-theme="dark"]:not([data-brand]), [data-theme="dark"] [data-brand="${m.id}"], ` : `[data-theme="dark"] [data-brand="${m.id}"], `}[data-theme="dark"][data-brand="${m.id}"], [data-brand="${m.id}"][data-theme="dark"] {\n${brandDecl(m.escuro)}\n}`).join("\n")}
@media (prefers-color-scheme: dark) {
${S.map((m) => `  :root:not([data-theme="light"])${m.id === def.id ? ":not([data-brand])" : `[data-brand="${m.id}"]`}, :root:not([data-theme="light"]) [data-brand="${m.id}"]:not([data-theme="light"]) {\n${brandDecl(m.escuro).replace(/^/gm, "  ")}\n  }`).join("\n")}
}
`;
writeFileSync(`${OUT}/tokens.css`, css);

const reprov = pares.filter((p) => p.resultado === "reprovado");
console.log(`pares: ${pares.length} · reprovados: ${reprov.length}`);
for (const p of reprov) console.log("  ✖", p.tema, p.marca, p.frente, "/", p.fundo, p.contraste, p.criterio, p.obs);
console.log("isentos/observação:", pares.filter((p) => p.resultado.startsWith("isento") && p.resultado.includes("abaixo")).map((p) => `${p.tema} ${p.marca} ${p.contraste}`).join(" | "));
