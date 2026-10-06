import { sistema } from "./sistema.mjs";
import { simulate, deltaE } from "./cores.mjs";
import { writeFileSync } from "node:fs";
const S = sistema(); const out = {};
for (const kind of ["normal", "protanopia", "deuteranopia", "tritanopia", "cinza"]) {
  const res = {};
  for (const [nome, sel] of [["assinatura", (m) => m.assinatura], ["raio_escuro", (m) => m.escuro["brand-mark"]]]) {
    const cols = S.map((m) => ({ id: m.id, c: kind === "normal" ? sel(m) : simulate(sel(m), kind) }));
    const ps = [];
    for (let i = 0; i < cols.length; i++) for (let j = i + 1; j < cols.length; j++) ps.push({ par: `${cols[i].id} × ${cols[j].id}`, dE: +deltaE(cols[i].c, cols[j].c).toFixed(3) });
    ps.sort((a, b) => a.dE - b.dE);
    res[nome] = { cores: Object.fromEntries(cols.map((x) => [x.id, x.c])), pares_mais_proximos: ps.slice(0, 4) };
  }
  out[kind] = res;
}
writeFileSync(`${process.argv[2]}/simulacoes/distancias.json`, JSON.stringify({ metodo: "Machado, Oliveira & Fernandes (2009), severidade 1,0 (dicromacia total), em RGB linear; escala de cinza pela luminância relativa (WCAG). Distância: ΔE OK (OKLab euclidiana).", resultados: out }, null, 2) + "\n");
for (const [k, r] of Object.entries(out)) console.log(k.padEnd(12), "assinatura:", r.assinatura.pares_mais_proximos.slice(0, 3).map((p) => `${p.par} ${p.dE}`).join(" | "), "|| raio escuro:", r.raio_escuro.pares_mais_proximos.slice(0, 2).map((p) => `${p.par} ${p.dE}`).join(" | "));
