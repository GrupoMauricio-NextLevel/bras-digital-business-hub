/**
 * Gera os manifestos de incorporação das famílias de temas: cada posição de imagem dos temas → imagem do pacote visual da
 * loja (ou pendente), e as fotos de cada SKU. Rode depois de importar pacotes: `npx tsx scripts/manifesto-temas.ts`.
 * Saídas: docs/temas-modulares/manifestos/<família>.json e .md. A geração de imagens foi encerrada pelo dono: nada aqui
 * pede imagem nova; posição sem imagem pronta no pacote fica pendente (fundo nas cores do tema).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { THEME_CATALOG } from "../src/lib/themes/catalog";
import { FAMILY_DEMOS } from "../src/lib/themes/families";
import { FAMILY_INFO, LEVEL_INFO } from "../src/lib/themes/levels";
import { categoryImages, packageOf, slotImage } from "../src/lib/themes/pacotes";

const OUT = "docs/temas-modulares/manifestos";
mkdirSync(OUT, { recursive: true });
const size = (s: { ratio: string; size: [number, number] }) => `${s.ratio} (${s.size[0]}×${s.size[1]} px)`;

for (const d of Object.values(FAMILY_DEMOS)) {
  if (!d) continue;
  const pkg = packageOf(d.family)!;
  const themes = THEME_CATALOG.filter((t) => t.family === d.family).sort((a, b) => a.level - b.level);
  const idOf = (src: string) => Object.entries(pkg.assets).find(([, a]) => a.src === src)?.[1].qualifiedId ?? null;
  const slots = d.assets.map((a) => { const r = slotImage(d.family, a.id); return { id: a.id, position: a.position, levels: a.levels, desktop: a.desktop, mobile: a.mobile ?? null, focus: a.focus, safeArea: a.safeArea, status: r ? "integrado" : "pendente", image: r?.image ?? null, imageMobile: r?.imageMobile || null, source: r ? idOf(r.image) : null }; });
  const json = {
    family: d.family, name: FAMILY_INFO[d.family].name, demoStore: d.storeName, package: { slug: pkg.slug, status: pkg.status, generated: pkg.generated, expected: pkg.expected },
    themes: themes.map((t) => ({ key: t.key, name: t.name, level: t.level, release: t.release, priceCents: t.priceCents })),
    slots, categoryImages: categoryImages(d.family),
    products: d.products.map((p) => ({ sku: p.sku, name: p.name, category: p.category, photos: p.photos, soldOut: !!p.soldOut })),
    campaigns: pkg.campaigns,
  };
  writeFileSync(join(OUT, `${d.family}.json`), JSON.stringify(json, null, 2) + "\n");
  const done = slots.filter((s) => s.status === "integrado").length;
  const md = [
    `# Manifesto de incorporação · Família ${FAMILY_INFO[d.family].name} (${d.storeName})`, "",
    "> Gerado por `npx tsx scripts/manifesto-temas.ts`. Os quatro níveis usam o mesmo catálogo e as mesmas imagens; o nível decide quais posições aparecem.", "",
    `Pacote visual \`${pkg.slug}\`: ${pkg.generated} de ${pkg.expected} imagens prontas (${pkg.status}). Posições dos temas com imagem do pacote: ${done} de ${slots.length}.`, "",
    `Temas: ${themes.map((t) => `${t.name} (${LEVEL_INFO[t.level].short})`).join(" · ")}`, "",
    "## Posições de imagem dos temas", "",
    "| Posição | Onde | Níveis | Computador | Celular | Estado | Imagem do pacote |", "|---|---|---|---|---|---|---|",
    ...slots.map((s) => `| ${s.id} | ${s.position} | ${s.levels.map((l) => `N${l}`).join(", ")} | ${size(s.desktop)} | ${s.mobile ? size(s.mobile) : "usa a do computador"} | ${s.status} | ${s.image ? `\`${s.source}\`<br>\`${s.image}\`${s.imageMobile ? `<br>celular: \`${s.imageMobile}\`` : ""}` : "(fundo nas cores do tema)"} |`),
    "", "## Categorias com imagem própria", "",
    ...(Object.keys(json.categoryImages).length ? Object.entries(json.categoryImages).map(([k, v]) => `- ${k}: \`${v}\``) : ["- Nenhuma (as categorias usam a foto do primeiro produto)."]),
    "", "## Fotos de produto (só as prontas, na ordem do pacote)", "",
    "| SKU | Produto | Categoria | Fotos | Esgotado |", "|---|---|---|---|---|",
    ...json.products.map((p) => `| ${p.sku} | ${p.name} | ${p.category} | ${p.photos.length} | ${p.soldOut ? "sim" : ""} |`),
    "", "## Campanhas (texto da página; o link mostra exatamente estes SKUs)", "",
    ...pkg.campaigns.map((c) => `- **${c.headline}** · ${c.cta} → \`/catalog?produtos=${c.skus.join(",")}\``), "",
  ];
  writeFileSync(join(OUT, `${d.family}.md`), md.join("\n"));
  console.log(`${d.family}: ${done}/${slots.length} posições com imagem do pacote`);
}
