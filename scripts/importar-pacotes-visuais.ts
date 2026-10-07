/**
 * Importa os pacotes visuais das lojas de demonstração (ZIPs do dono, já extraídos numa pasta).
 * Uso: npx tsx scripts/importar-pacotes-visuais.ts <pasta-com-os-pacotes-extraidos> [...outras pastas]
 *
 * Regras do contrato dos pacotes: só assets com status GENERATED; cada arquivo conferido pelo SHA-256 e pelo tamanho;
 * caminhos preservados (public/demos/<loja>/v1/...); URL pública sem /public; AVIF e WebP da mesma imagem são UM asset;
 * PENDING não ganha caminho. Gera um resumo compacto por loja em src/lib/themes/pacotes/<loja>.json, lido pelo sistema.
 */
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

/** Loja do pacote → família do motor de temas. */
const FAMILY: Record<string, string> = { "trama-urbana": "moda", "linha-de-jogo": "sport", "casa-em-ordem": "casa", "bela-essencia": "beauty", "ponto-conecta": "conecta", "giro-distribuidora": "atacado" };

type FileRec = { path: string; dimensions: [number, number]; format: string; bytes: number; sha256: string };
type Asset = { id: string; kind: string; status: string; alt?: string; sku?: string; qualifiedId?: string; files?: FileRec[]; preferredFile?: string; publicUrl?: string; requiresLayoutReview?: boolean; needsVectorFinalization?: boolean };
const url = (p: string) => "/" + p.replace(/^public\//, "");
const sha = (p: string) => createHash("sha256").update(readFileSync(p)).digest("hex");

const roots = process.argv.slice(2);
if (!roots.length) { console.error("Informe a pasta com os pacotes extraídos."); process.exit(1); }
mkdirSync("src/lib/themes/pacotes", { recursive: true });
/** WebP → AVIF de todas as lojas (lido também no navegador, por isso fica num arquivo pequeno à parte). */
const avifMap: Record<string, string> = existsSync("src/lib/themes/pacotes/avif.json") ? JSON.parse(readFileSync("src/lib/themes/pacotes/avif.json", "utf8")) : {};

for (const root of roots) for (const name of readdirSync(root)) {
  const dir = join(root, name);
  if (!statSync(dir).isDirectory() || !existsSync(join(dir, "manifesto-final.json"))) continue;
  const m = JSON.parse(readFileSync(join(dir, "manifesto-final.json"), "utf8"));
  const slug: string = m.namespace ?? m.slug ?? name;
  const family = FAMILY[slug]; if (!family) { console.error(`Loja desconhecida: ${slug}`); process.exit(1); }
  const catalog = JSON.parse(readFileSync(join(dir, "catalogo-pronto.json"), "utf8"));
  const rawCampaigns = JSON.parse(readFileSync(join(dir, "campanhas-produtos.json"), "utf8"));
  const campaignsIn: { id: string; headline: string; cta: string; skus: string[] }[] = Array.isArray(rawCampaigns) ? rawCampaigns : Object.entries(rawCampaigns).map(([id, c]) => ({ id, ...(c as object) }) as never);
  const identity = existsSync(join(dir, "identidade.json")) ? JSON.parse(readFileSync(join(dir, "identidade.json"), "utf8")) : null;

  const assets: Record<string, { qualifiedId: string; kind: string; sku?: string; alt: string; src: string; avif?: string; width: number; height: number; layoutReview?: boolean; vector?: boolean }> = {};
  let copied = 0;
  for (const a of (m.assets as Asset[]).filter((x) => x.status === "GENERATED")) {
    for (const f of a.files ?? []) {
      const from = join(dir, f.path);
      if (!existsSync(from)) throw new Error(`${slug}: arquivo ausente ${f.path}`);
      if (sha(from) !== f.sha256 || statSync(from).size !== f.bytes) throw new Error(`${slug}: hash ou tamanho diferente em ${f.path}`);
      mkdirSync(dirname(f.path), { recursive: true }); copyFileSync(from, f.path); copied++;
    }
    const pref = (a.files ?? []).find((f) => f.path === a.preferredFile) ?? (a.files ?? [])[0];
    if (!pref) throw new Error(`${slug}: ${a.id} sem arquivo`);
    const avif = (a.files ?? []).find((f) => f.format === "HEIF" || f.path.endsWith(".avif"));
    assets[a.id] = { qualifiedId: a.qualifiedId ?? `${slug}:${a.id}`, kind: a.kind, ...(a.sku ? { sku: a.sku } : {}), alt: a.alt ?? "", src: url(pref.path), ...(avif && avif !== pref ? { avif: url(avif.path) } : {}), width: pref.dimensions[0], height: pref.dimensions[1], ...(a.requiresLayoutReview ? { layoutReview: true } : {}), ...(a.needsVectorFinalization ? { vector: true } : {}) };
  }
  const out = {
    slug, family, store: m.store, status: m.status, generated: Object.keys(assets).length, expected: (m.assets as Asset[]).length,
    palette: identity?.palette ?? null,
    products: catalog.map((c: { sku: string; slug: string; name: string; category: string; priceCents: number; inventoryDemo: number; sizes?: string[]; description: string; imageAssetIds: string[] }) => ({
      sku: c.sku, slug: c.slug, name: c.name, category: c.category, priceCents: c.priceCents, inventoryDemo: c.inventoryDemo, ...(c.sizes ? { sizes: c.sizes } : {}), description: c.description,
      // Só as imagens que existem, na ordem do catálogo (a principal primeiro); nada é inventado para lacunas.
      images: c.imageAssetIds.filter((id) => assets[id]),
    })),
    campaigns: campaignsIn.map((c) => ({ id: c.id, headline: c.headline, cta: c.cta, skus: c.skus })),
    assets,
  };
  for (const a of Object.values(assets)) if (a.avif) avifMap[a.src] = a.avif;
  writeFileSync(join("src/lib/themes/pacotes", `${slug}.json`), JSON.stringify(out, null, 1) + "\n");
  console.log(`${slug}: ${out.generated}/${out.expected} assets prontos, ${copied} arquivos copiados, ${out.products.length} SKUs`);
}
writeFileSync("src/lib/themes/pacotes/avif.json", JSON.stringify(Object.fromEntries(Object.entries(avifMap).sort()), null, 1) + "\n");
