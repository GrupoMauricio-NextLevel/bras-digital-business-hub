/**
 * Gera os manifestos de imagens das famílias de temas e o prompt para o GPT, a partir dos dados do código
 * (src/lib/themes/families.ts). Rode depois de mudar o catálogo: `npx tsx scripts/manifesto-temas.ts`.
 * Saídas: docs/temas-modulares/manifestos/<família>.json e .md, e docs/prompts/imagens-familias-nextlevel-gpt.md.
 */
import { mkdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { THEME_CATALOG } from "../src/lib/themes/catalog";
import { FAMILY_DEMOS, finalAssetPath, type FamilyAsset, type FamilyDemo } from "../src/lib/themes/families";
import { FAMILY_INFO, LEVEL_INFO } from "../src/lib/themes/levels";

const OUT = "docs/temas-modulares/manifestos";
mkdirSync(OUT, { recursive: true });
const exists = (p: string) => { try { return statSync(join("public", p)).size > 0; } catch { return false; } };
const status = (a: FamilyAsset) => (exists(finalAssetPath(a)) ? "integrado" : a.provisional ? "provisório" : "pendente");
const size = (s: { ratio: string; size: [number, number] }) => `${s.ratio} (${s.size[0]}×${s.size[1]} px)`;
const productFile = (d: FamilyDemo, sku: string) => `/temas/familias/${d.family}/produtos/${sku}.webp`;

const prompt: string[] = [
  "# Imagens das famílias de temas NextLevel para criar no GPT",
  "",
  "> Gerado por `npx tsx scripts/manifesto-temas.ts` a partir do código. Não edite à mão: mude `src/lib/themes/families.ts` e gere de novo.",
  "",
  "## Como usar",
  "1. Para cada imagem abaixo, peça ao GPT exatamente a **cena**, na **proporção** indicada, com a **paleta** e a **luz** da família.",
  "2. **Nunca peça texto, logo, marca, escudo, preço ou selo dentro da imagem.** O texto é escrito pelo sistema por cima, na área livre indicada.",
  "3. Pessoas: sem rosto reconhecível (de costas, perfil ou recortado). Nada de marcas registradas, clubes ou celebridades.",
  "4. Exporte em WebP (qualidade 80 a 85), até 600 KB no computador e 350 KB no celular, e salve com o nome indicado em `public/`.",
  "5. Rode `npx tsx scripts/manifesto-temas.ts` de novo: o estado muda de pendente/provisório para integrado. Reinicie a demonstração para aplicar.",
  "",
  "Regras gerais para todas as cenas: fotografia realista de produto e ambiente (não ilustração), fundo limpo, composição que deixa a área livre indicada sem objetos importantes, cores dentro da paleta, sem marca-d'água.",
  "",
];

for (const d of Object.values(FAMILY_DEMOS)) {
  if (!d) continue;
  const themes = THEME_CATALOG.filter((t) => t.family === d.family).sort((a, b) => a.level - b.level);
  const json = {
    family: d.family, name: FAMILY_INFO[d.family].name, demoStore: d.storeName,
    themes: themes.map((t) => ({ key: t.key, name: t.name, level: t.level, release: t.release, priceCents: t.priceCents, pricePending: !!t.pricePending })),
    assets: d.assets.map((a) => ({ ...a, file: finalAssetPath(a), fileMobile: a.mobile ? finalAssetPath(a, "mobile") : null, status: status(a) })),
    products: d.products.map((p) => ({ sku: p.sku, name: p.name, category: p.category, file: productFile(d, p.sku), ratio: "1:1 (1200×1200 px)", status: exists(productFile(d, p.sku)) ? "integrado" : p.photo.startsWith("art:") ? "ilustração provisória" : "provisório" })),
  };
  writeFileSync(join(OUT, `${d.family}.json`), JSON.stringify(json, null, 2) + "\n");

  const md: string[] = [
    `# Manifesto de imagens · Família ${FAMILY_INFO[d.family].name} (${d.storeName})`,
    "",
    "> Gerado por `npx tsx scripts/manifesto-temas.ts`. Os quatro níveis usam as mesmas imagens; o nível decide quais posições aparecem.",
    "",
    `Temas: ${themes.map((t) => `${t.name} (${LEVEL_INFO[t.level].short}, ${t.release === "released" ? "à venda" : "em revisão"})`).join(" · ")}`,
    "",
    `Paleta: ${d.assets[0]?.palette ?? "—"}  `,
    `Luz: ${d.assets[0]?.light ?? "—"}`,
    "",
    "## Banners e imagens de seção",
    "",
    "| Id | Posição | Níveis | Computador | Celular | Foco | Área livre | Estado | Arquivo final |",
    "|---|---|---|---|---|---|---|---|---|",
    ...d.assets.map((a) => `| ${a.id} | ${a.position} | ${a.levels.map((l) => `N${l}`).join(", ")} | ${size(a.desktop)} | ${a.mobile ? size(a.mobile) : "usa a do computador"} | ${a.focus} | ${a.safeArea} | ${status(a)} | \`public${finalAssetPath(a)}\`${a.mobile ? `<br>\`public${finalAssetPath(a, "mobile")}\`` : ""} |`),
    "",
    "## Fotos de produto (1:1, 1200×1200 px, fundo claro e liso)",
    "",
    "| SKU | Produto | Categoria | Estado | Arquivo final |",
    "|---|---|---|---|---|",
    ...json.products.map((p) => `| ${p.sku} | ${p.name} | ${p.category} | ${p.status} | \`public${p.file}\` |`),
    "",
  ];
  writeFileSync(join(OUT, `${d.family}.md`), md.join("\n"));

  prompt.push(`## Família ${FAMILY_INFO[d.family].name} · loja de exemplo “${d.storeName}”`, "", `Paleta: ${d.assets[0]?.palette}. Luz: ${d.assets[0]?.light}.`, "");
  for (const a of d.assets) {
    prompt.push(`### ${a.id} (${status(a)})`, `- Onde aparece: ${a.position} (níveis ${a.levels.join(", ")})`, `- Cena: ${a.scene}`, `- Computador: ${size(a.desktop)} → salvar em \`public${finalAssetPath(a)}\``);
    if (a.mobile) prompt.push(`- Celular: ${size(a.mobile)} → salvar em \`public${finalAssetPath(a, "mobile")}\` (mesma cena, recomposta na vertical)`);
    prompt.push(`- Foco: ${a.focus}`, `- Área livre para o texto do sistema: ${a.safeArea}`, `- Texto que o sistema escreve por cima (NÃO colocar na imagem): ${a.overlayText}`, `- Descrição (alt): ${a.alt}`, "");
  }
  prompt.push(`### Fotos de produto da família ${FAMILY_INFO[d.family].name}`, "Foto de estúdio do produto sozinho, centralizado, fundo claro e liso, sombra suave, 1:1 (1200×1200 px), sem marca ou etiqueta legível.", "");
  for (const p of d.products) prompt.push(`- ${p.sku} · ${p.name} (${p.category}): ${p.description.replace(/ (Imagem provisória \(ilustração\)|Produto esgotado \(estado de exemplo\))\.?/g, "")} → \`public${productFile(d, p.sku)}\``);
  prompt.push("");
}
writeFileSync("docs/prompts/imagens-familias-nextlevel-gpt.md", prompt.join("\n"));
console.log("manifestos e prompt gerados");
