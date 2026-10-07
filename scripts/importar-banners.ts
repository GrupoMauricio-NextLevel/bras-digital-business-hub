/**
 * Importa os banners de navegação gerados pelo dono (D88) para as lojas de demonstração.
 * Uso: npx tsx scripts/importar-banners.ts <pasta com as imagens extraídas do ZIP>
 * Nome de cada arquivo (como em docs/prompts/banners-navegacao-temas-gpt.md): <loja>__<nome>.png, ex.:
 *   trama-urbana__hero-camadas__fundo-desktop.png  →  public/demos/trama-urbana/v1/banners/hero-camadas__fundo-desktop.webp (+ .avif)
 * Recortes e primeiro plano mantêm a transparência. Nada é ampliado (só reduzido até 2400 px de largura).
 * Depois: reinicie a demonstração; as lojas usam sozinhas os arquivos que existirem (showcase.ts → bannerMedia).
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, extname, join } from "node:path";
import sharp from "sharp";
import { PACKAGES } from "../src/lib/themes/pacotes";

const src = process.argv[2];
if (!src || !existsSync(src)) { console.error("Informe a pasta com as imagens: npx tsx scripts/importar-banners.ts <pasta>"); process.exit(1); }
const slugs = new Set(Object.values(PACKAGES).map((p) => p!.slug));
const files = (dir: string): string[] => readdirSync(dir).flatMap((f) => { const p = join(dir, f); return statSync(p).isDirectory() ? files(p) : [p]; });
const AVIF = "src/lib/themes/pacotes/avif.json";
const avifMap: Record<string, string> = existsSync(AVIF) ? JSON.parse(readFileSync(AVIF, "utf8")) : {};
const NAME = /^[a-z0-9-]+(__[a-z0-9-]+)?$/;

const done: string[] = []; const skipped: string[] = [];
async function main() {
  for (const file of files(src!)) {
  const ext = extname(file).toLowerCase(); if (![".png", ".jpg", ".jpeg", ".webp"].includes(ext)) continue;
  const base = basename(file, ext).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const cut = base.indexOf("__"); const slug = base.slice(0, cut); const name = base.slice(cut + 2);
  if (cut < 0 || !slugs.has(slug) || !NAME.test(name)) { skipped.push(`${basename(file)} (nome fora do padrão <loja>__<nome>)`); continue; }
  const dir = join("public", "demos", slug, "v1", "banners"); mkdirSync(dir, { recursive: true });
  const img = sharp(file).rotate().resize({ width: 2400, withoutEnlargement: true });
  const { width, height } = await img.clone().webp({ quality: 82 }).toFile(join(dir, `${name}.webp`));
  await img.clone().avif({ quality: 55 }).toFile(join(dir, `${name}.avif`));
  avifMap[`/demos/${slug}/v1/banners/${name}.webp`] = `/demos/${slug}/v1/banners/${name}.avif`;
  done.push(`${slug}/${name} (${width}×${height})`);
}
}
main().then(() => {
writeFileSync(AVIF, JSON.stringify(Object.fromEntries(Object.entries(avifMap).sort()), null, 1) + "\n");
console.log(`Importados ${done.length}:\n- ${done.join("\n- ")}`);
if (skipped.length) console.log(`\nIgnorados ${skipped.length}:\n- ${skipped.join("\n- ")}`);
});
