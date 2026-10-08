/**
 * Importa os banners gerados pelo dono para as lojas de demonstração.
 * Uso: npx tsx scripts/importar-banners.ts <pasta com as imagens extraídas do ZIP> [<outra pasta>...]
 *
 * Pacote atual (2026-10): 6 imagens por loja, sem texto embutido (a copy é HTML):
 *   <loja>__hero-<campanha>__desktop.png  →  public/demos/<loja>/v1/banners/hero-<campanha>__desktop.webp (+ .avif)
 *   <loja>__hero-<campanha>__mobile.png   →  .../hero-<campanha>__mobile.webp (+ .avif)
 *   <loja>__atalho-<categoria>.png        →  .../atalho-<categoria>.webp (+ .avif)
 * Onde cada uma aparece: src/lib/themes/banners-demo.ts. Nomes antigos do D88 (docs/prompts/banners-navegacao-temas-gpt.md,
 * ex.: hero-camadas__fundo-desktop) continuam aceitos.
 * Conversão com pouca perda (WebP 90, AVIF 60) e sem ampliar (só reduz acima de 2400 px de largura); recortes mantêm a
 * transparência. O PNG original não entra no repositório. No fim, confere o pacote: destaque de computador e de celular
 * e um atalho por categoria do catálogo (atalho sem categoria correspondente é avisado).
 * Depois: reinicie a demonstração; as lojas usam sozinhas os arquivos que existirem (showcase.ts).
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, extname, join } from "node:path";
import sharp from "sharp";
import { slugify } from "../src/lib/ids";
import { PACKAGES } from "../src/lib/themes/pacotes";

const dirs = process.argv.slice(2);
if (!dirs.length || dirs.some((d) => !existsSync(d))) { console.error("Informe a pasta com as imagens: npx tsx scripts/importar-banners.ts <pasta>"); process.exit(1); }
const bySlug = new Map(Object.values(PACKAGES).map((p) => [p!.slug, p!]));
const files = (dir: string): string[] => readdirSync(dir).flatMap((f) => { const p = join(dir, f); return statSync(p).isDirectory() ? files(p) : [p]; });
const AVIF = "src/lib/themes/pacotes/avif.json";
const avifMap: Record<string, string> = existsSync(AVIF) ? JSON.parse(readFileSync(AVIF, "utf8")) : {};
const NAME = /^[a-z0-9-]+(__[a-z0-9-]+)?$/;

const done: string[] = []; const skipped: string[] = []; const got = new Map<string, Set<string>>(); let bytes = 0;
async function main() {
  for (const file of dirs.flatMap(files).sort()) {
    const ext = extname(file).toLowerCase(); if (![".png", ".jpg", ".jpeg", ".webp"].includes(ext)) continue;
    const base = basename(file, ext).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    const cut = base.indexOf("__"); const slug = base.slice(0, cut); const name = base.slice(cut + 2);
    if (cut < 0 || !bySlug.has(slug) || !NAME.test(name)) { skipped.push(`${basename(file)} (nome fora do padrão <loja>__<nome>)`); continue; }
    const dir = join("public", "demos", slug, "v1", "banners"); mkdirSync(dir, { recursive: true });
    const img = sharp(file).rotate().resize({ width: 2400, withoutEnlargement: true });
    const { width, height, size } = await img.clone().webp({ quality: 90, effort: 6 }).toFile(join(dir, `${name}.webp`));
    const avif = await img.clone().avif({ quality: 60, effort: 6 }).toFile(join(dir, `${name}.avif`));
    bytes += size + avif.size;
    avifMap[`/demos/${slug}/v1/banners/${name}.webp`] = `/demos/${slug}/v1/banners/${name}.avif`;
    (got.get(slug) ?? got.set(slug, new Set()).get(slug)!).add(name);
    done.push(`${slug}/${name} (${width}×${height}, WebP ${Math.round(size / 1024)} KB, AVIF ${Math.round(avif.size / 1024)} KB)`);
  }
}

/** Confere o pacote de 6 imagens de cada loja importada. */
function check(): string[] {
  const out: string[] = [];
  for (const [slug, names] of got) {
    const p = bySlug.get(slug)!; const c1 = p.campaigns[0]?.id;
    const cats = new Set([...new Set(p.products.map((x) => x.category))].map((c) => slugify(c)));
    const heroes = [...names].filter((n) => /^hero-[a-z0-9-]+__(desktop|mobile)$/.test(n));
    if (heroes.length && c1 && !names.has(`hero-${c1}__desktop`)) out.push(`${slug}: o destaque precisa ser da 1ª campanha do pacote (hero-${c1}__desktop); veio ${heroes.join(", ")}`);
    if (heroes.length && c1 && names.has(`hero-${c1}__desktop`) && !names.has(`hero-${c1}__mobile`)) out.push(`${slug}: falta hero-${c1}__mobile (o celular usa o recorte do computador)`);
    const shortcuts = [...names].filter((n) => n.startsWith("atalho-")).map((n) => n.slice(7));
    for (const s of shortcuts) if (!cats.has(s)) out.push(`${slug}: atalho-${s} não corresponde a nenhuma categoria do catálogo (${[...cats].join(", ")}); fica sem uso`);
    if (shortcuts.length) for (const c of cats) if (!shortcuts.includes(c)) out.push(`${slug}: categoria ${c} sem atalho (usa a imagem do pacote ou a foto do 1º produto)`);
  }
  return out;
}

main().then(() => {
  writeFileSync(AVIF, JSON.stringify(Object.fromEntries(Object.entries(avifMap).sort()), null, 1) + "\n");
  console.log(`Importados ${done.length} (${(bytes / 1048576).toFixed(1)} MB em WebP + AVIF):\n- ${done.join("\n- ")}`);
  if (skipped.length) console.log(`\nIgnorados ${skipped.length}:\n- ${skipped.join("\n- ")}`);
  const warn = check();
  if (warn.length) console.log(`\nAvisos:\n- ${warn.join("\n- ")}`);
});
