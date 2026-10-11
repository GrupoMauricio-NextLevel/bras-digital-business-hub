/**
 * Funil por marca (D124, fase P1): a mesma conta da tela Master → Financeiro → Descoberta, para rodar e guardar.
 * Só leitura e só números somados (nenhum nome, documento, e-mail ou telefone).
 * Uso: `DATABASE_URL=... npx tsx scripts/funil-marcas.ts [--json]` (sem `--json`, sai em Markdown).
 */
import { createDatabase } from "../src/db/client";
import { funnelsUnchecked } from "../src/lib/domain/precos/funil";

async function main() {
  const handle = await createDatabase();
  const funnels = await funnelsUnchecked(handle.db);
  await handle.close();
  if (process.argv.includes("--json")) { console.log(JSON.stringify(funnels, null, 2)); return; }
  const brl = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const out: string[] = [`# Funil por marca (${new Date().toISOString().slice(0, 10)})`, ""];
  for (const f of funnels) {
    out.push(`## ${f.label} (${f.total} ${f.unit})`, "", "| Etapa | Quantos | % do cadastro | Mediana de dias desde a etapa anterior |", "|---|---|---|---|");
    for (const s of f.stages) out.push(`| ${s.label} | ${s.count} | ${s.pctOfFirst}% | ${s.medianDaysFromPrev ?? "—"} |`);
    out.push("", `Cadastros por semana: ${f.weekly.map((w) => `${w.label}: ${w.count}`).join(" · ")}`, "", "| Entrada | Entraram | 30 dias | 60 dias | 90 dias | " + f.revenueLabel + " |", "|---|---|---|---|---|---|");
    for (const c of f.cohorts) out.push(`| ${c.month} | ${c.entered} | ${c.d30 ?? "—"} | ${c.d60 ?? "—"} | ${c.d90 ?? "—"} | ${brl(c.revenuePerClientCents)} |`);
    if (f.bands) out.push("", `Faixas (30 dias): ${f.bands.map((b) => `${b.label}: ${b.count}`).join(" · ")}`);
    out.push("", `Origem: ${f.origins.map((o) => `${o.label}: ${o.count}`).join(" · ") || "—"}`);
    if (f.usage.length) out.push("", `Uso (quem paga × quem não paga): ${f.usage.map((u) => `${u.feature} ${u.payingPct ?? "—"}% × ${u.freePct ?? "—"}%`).join(" · ")}`);
    out.push("");
  }
  console.log(out.join("\n"));
}
main().catch((e) => { console.error(e); process.exit(1); });
