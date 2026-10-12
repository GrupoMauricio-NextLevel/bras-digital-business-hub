import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Imagens das páginas públicas (D143): a lista sai do MANIFESTO.md de cada marca (`public/portal/<marca>/v3/`, a fonte da
 * verdade) e a situação, dos arquivos que existem de verdade (arquivo vazio não conta, igual ao `ImagemEmCriacao`).
 */
export type PublicImage = { brand: "superdrop" | "commerce" | "bras"; name: string; where: string; ratio: string; scene: string | null; formats: string[] };
const BRANDS = ["superdrop", "commerce", "bras"] as const;
const FORMATS = ["avif", "webp", "png", "jpg"];

const cells = (line: string) => line.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());

/** Lê a primeira tabela do manifesto: nome, onde aparece, proporção (ou recorte) e cena, quando houver. */
export function parseManifest(md: string): { name: string; where: string; ratio: string; scene: string | null }[] {
  const lines = md.split("\n");
  const h = lines.findIndex((l) => l.trim().startsWith("|") && /arquivo|nome/i.test(l));
  if (h < 0) return [];
  const head = cells(lines[h]!).map((c) => c.toLowerCase());
  const col = (re: RegExp) => head.findIndex((c) => re.test(c));
  const iWhere = col(/onde/), iRatio = col(/propor|recorte/), iScene = col(/cena/);
  const out: { name: string; where: string; ratio: string; scene: string | null }[] = [];
  for (const l of lines.slice(h + 2)) {
    if (!l.trim().startsWith("|")) break;
    const c = cells(l);
    const name = (c[0] ?? "").replace(/`/g, "").trim();
    if (!/^[a-z0-9-]+$/.test(name)) continue;
    out.push({ name, where: iWhere >= 0 ? c[iWhere] ?? "" : "", ratio: iRatio >= 0 ? (c[iRatio] ?? "").split(" ")[0]! : "", scene: iScene >= 0 ? c[iScene] ?? null : null });
  }
  return out;
}

export function publicImages(root = join(process.cwd(), "public", "portal")): PublicImage[] {
  const out: PublicImage[] = [];
  for (const brand of BRANDS) {
    let md = "";
    try { md = readFileSync(join(root, brand, "v3", "MANIFESTO.md"), "utf8"); } catch { continue; }
    for (const r of parseManifest(md)) {
      const formats = FORMATS.filter((ext) => { try { return statSync(join(root, brand, "v3", `${r.name}.${ext}`)).size > 0; } catch { return false; } });
      out.push({ brand, ...r, formats });
    }
  }
  return out;
}
