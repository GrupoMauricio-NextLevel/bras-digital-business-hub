import ExcelJS from "exceljs";
import JSZip from "jszip";
import { and, eq } from "drizzle-orm";
import type { Database } from "@/db/client";
import { categories, products } from "@/db/schema";
import { csvToMatrix, parseProductRows, CSV_COLUMNS, type ImportRow } from "./product-import";
import { SIZE_GRIDS } from "./size-grids";
import { createProduct, ensureCategory } from "./products";
import { getMinActivationStock } from "./catalog";
import { DomainError } from "./errors";

export const MAX_IMPORT_ROWS = 500;
export type ImportSource = { kind: "csv"; text: string } | { kind: "xlsx"; base64: string };

/** Lê o arquivo enviado e devolve uma matriz de textos (primeira aba de dados). */
export async function readSpreadsheet(src: ImportSource): Promise<string[][]> {
  if (src.kind === "csv") return csvToMatrix(src.text);
  const buf = Buffer.from(src.base64, "base64");
  if (buf.length > 6_000_000) throw new DomainError("FILE_TOO_BIG", "Arquivo maior que 6 MB.");
  const wb = new ExcelJS.Workbook();
  try { await wb.xlsx.load((await normalizeXlsx(buf)) as unknown as ArrayBuffer); }
  catch { throw new DomainError("INVALID_FILE", "Não conseguimos ler esta planilha. Abra no Excel ou Google Planilhas, salve como .xlsx (ou exporte em .csv) e envie de novo."); }
  const ws = wb.getWorksheet("Produtos") ?? wb.worksheets[0];
  if (!ws) throw new DomainError("EMPTY_FILE", "A planilha não tem abas.");
  const out: string[][] = [];
  ws.eachRow({ includeEmpty: false }, (row) => {
    const cells: string[] = [];
    for (let c = 1; c <= Math.min(ws.columnCount, 40); c++) {
      const cell = row.getCell(c);
      const v = cell.value;
      cells.push(v === null || v === undefined ? "" : typeof v === "object" && v !== null && "result" in v ? String((v as { result: unknown }).result ?? "") : typeof v === "object" && "text" in (v as object) ? String((v as { text: unknown }).text) : String(cell.text ?? v));
    }
    out.push(cells);
  });
  return out;
}

const SHEET_NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";

/**
 * Planilhas geradas por outros sistemas (ex.: exportações adaptadas da wBuy, feitas com a biblioteca OpenXML do .NET)
 * escrevem as tags com prefixo (`<x:worksheet>`, `<x:row>`). O Excel aceita, mas o leitor (ExcelJS) não reconhece e quebra.
 * Aqui o prefixo do namespace da planilha é removido antes da leitura; o conteúdo não muda.
 */
export async function normalizeXlsx(buf: Buffer): Promise<Buffer> {
  let zip: JSZip;
  try { zip = await JSZip.loadAsync(buf); } catch { return buf; }
  let changed = false;
  for (const entry of Object.values(zip.files)) {
    if (entry.dir || !/\.(xml|rels)$/i.test(entry.name)) continue;
    const xml = await entry.async("string");
    const prefix = new RegExp(`xmlns:([A-Za-z_][\\w.-]*)="${SHEET_NS}"`).exec(xml)?.[1];
    const noBom = xml.replace(/^\uFEFF/, "");
    if (!prefix && noBom === xml) continue;
    let out = noBom;
    if (prefix) {
      const hasDefault = new RegExp(`xmlns="${SHEET_NS}"`).test(out);
      out = out.replace(new RegExp(`<(/?)${prefix}:`, "g"), "<$1").replace(new RegExp(`\\sxmlns:${prefix}="${SHEET_NS}"`, "g"), hasDefault ? "" : ` xmlns="${SHEET_NS}"`);
      if (!hasDefault) { let first = true; out = out.replace(new RegExp(` xmlns="${SHEET_NS}"`, "g"), (m) => (first ? ((first = false), m) : "")); }
    }
    zip.file(entry.name, out);
    changed = true;
  }
  return changed ? await zip.generateAsync({ type: "nodebuffer" }) : buf;
}

export type PreviewLine = { line: number; sku: string; name: string; action: "CREATE" | "UPDATE" | "SKIP" | "ERROR"; errors: string[]; warnings: string[]; sizes: string; grid: string; newCategory: boolean };
export type Preview = { lines: PreviewLine[]; total: number; create: number; update: number; errors: number; warnings: number; minActivationStock: number };

export async function previewImport(db: Database, supplierId: string, matrix: string[][], mode: "skip" | "update"): Promise<Preview> {
  if (matrix.length - 1 > MAX_IMPORT_ROWS) throw new DomainError("TOO_MANY_ROWS", `Limite de ${MAX_IMPORT_ROWS} produtos por importação.`);
  const min = await getMinActivationStock(db, supplierId);
  const rows = parseProductRows(matrix, { minActivationStock: min });
  const existingCats = new Set((await db.select({ n: categories.name }).from(categories).where(eq(categories.supplierId, supplierId))).map((c) => c.n.toLowerCase()));
  const lines: PreviewLine[] = [];
  for (const r of rows) {
    const sku = (r.raw.sku ?? "").toUpperCase();
    const exists = sku ? await db.query.products.findFirst({ where: and(eq(products.supplierId, supplierId), eq(products.sku, sku)) }) : null;
    const action: PreviewLine["action"] = r.errors.length ? "ERROR" : exists ? (mode === "update" ? "UPDATE" : "SKIP") : "CREATE";
    const warnings = [...r.warnings];
    if (exists && mode === "skip" && !r.errors.length) warnings.push("SKU já existe: linha ignorada (troque para “atualizar” para alterar preços e textos)");
    if (exists && mode === "update" && !r.errors.length) warnings.push("Estoque e tamanhos do produto existente não são alterados");
    lines.push({ line: r.line, sku: r.raw.sku ?? "", name: r.raw.nome ?? "", action, errors: r.errors, warnings, sizes: r.input?.sizes.map((s) => s.size).join(" ") ?? "", grid: r.input ? SIZE_GRIDS[r.input.sizeGrid ?? "CUSTOM"].short : "", newCategory: !!r.raw.categoria && !existingCats.has(r.raw.categoria.toLowerCase()) });
  }
  return { lines, total: lines.length, create: lines.filter((l) => l.action === "CREATE").length, update: lines.filter((l) => l.action === "UPDATE").length, errors: lines.filter((l) => l.action === "ERROR").length, warnings: lines.filter((l) => l.warnings.length).length, minActivationStock: min };
}

export type ImportOutcome = { created: number; updated: number; skipped: number; failed: { line: number; name: string; error: string }[] };

export async function importRows(db: Database, supplierId: string, matrix: string[][], mode: "skip" | "update"): Promise<ImportOutcome> {
  if (matrix.length - 1 > MAX_IMPORT_ROWS) throw new DomainError("TOO_MANY_ROWS", `Limite de ${MAX_IMPORT_ROWS} produtos por importação.`);
  const rows = parseProductRows(matrix);
  const out: ImportOutcome = { created: 0, updated: 0, skipped: 0, failed: [] };
  for (const row of rows) {
    if (!row.input) { out.failed.push({ line: row.line, name: row.raw.nome ?? "", error: row.errors.join(", ") }); continue; }
    try {
      const existing = await db.query.products.findFirst({ where: and(eq(products.supplierId, supplierId), eq(products.sku, row.input.sku.trim().toUpperCase())) });
      if (existing) {
        if (mode === "skip") { out.skipped++; continue; }
        await updateFromRow(db, supplierId, existing.id, row);
        out.updated++;
      } else { await createProduct(db, supplierId, row.input); out.created++; }
    } catch (e) { out.failed.push({ line: row.line, name: row.raw.nome ?? "", error: e instanceof Error ? e.message : "erro" }); }
  }
  return out;
}

/** Atualiza dados comerciais de um produto existente; estoque, tamanhos e grade não mudam. */
async function updateFromRow(db: Database, supplierId: string, productId: string, row: ImportRow) {
  const i = row.input!;
  const categoryId = await ensureCategory(db, supplierId, i.categoryName);
  await db.update(products).set({
    name: i.name.trim(), description: i.description ?? "", categoryId, costCents: Number(i.costCents), suggestedPriceCents: Number(i.suggestedPriceCents), minimumPriceCents: Number(i.minimumPriceCents),
    ...(i.images && i.images.length ? { images: i.images } : {}), status: i.status ?? "ACTIVE", sizeGrid: i.sizeGrid ?? "CUSTOM", seoTitle: i.seoTitle ?? "", seoDescription: i.seoDescription ?? "",
    weightG: Number(i.weightG ?? 300), lengthCm: Number(i.lengthCm ?? 30), widthCm: Number(i.widthCm ?? 25), heightCm: Number(i.heightCm ?? 3), updatedAt: new Date().toISOString(),
  }).where(and(eq(products.id, productId), eq(products.supplierId, supplierId)));
}

/** Modelo .xlsx com exemplos, listas suspensas e uma aba de instruções e tamanhos. */
export async function buildTemplateXlsx(): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "SuperDrop";
  const ws = wb.addWorksheet("Produtos", { views: [{ state: "frozen", ySplit: 1 }] });
  const headers = [...CSV_COLUMNS] as string[];
  ws.addRow(headers);
  ws.addRow(["Manto Exemplo 2025", "EX-001", "Times Brasileiros", "masculino", 59, 149.9, 119.9, "", 10, "2|4|4|2|1|1", "Camisa de torcedor dry-fit", "https://exemplo.com/foto1.jpg|https://exemplo.com/foto2.jpg", "Manto Exemplo 2025 original", "Camisa dry-fit com envio para todo o Brasil", 300, 30, 25, 3, "ativo"]);
  ws.addRow(["Manto Exemplo Feminino 2025", "EX-002", "Times Brasileiros", "feminino", 59, 149.9, 119.9, "", "P:10|M:20|G:20|GG:10|XX1:5|2XL:5", "", "Modelagem feminina", "", "", "", 300, 30, 25, 3, "ativo"]);
  ws.addRow(["Conjunto Infantil Exemplo", "EX-003", "Infantil", "infantil", 45, 119.9, 99.9, "", 8, "", "Conjunto camisa e short", "", "", "", 250, 30, 25, 3, "rascunho"]);
  const head = ws.getRow(1); head.font = { bold: true, color: { argb: "FFFFFFFF" } }; head.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F1C16" } };
  headers.forEach((h, idx) => { ws.getColumn(idx + 1).width = Math.max(14, h.length + 4); });
  ws.getColumn(1).width = 34; ws.getColumn(11).width = 40; ws.getColumn(12).width = 40;
  for (let r = 2; r <= 500; r++) {
    ws.getCell(r, 4).dataValidation = { type: "list", allowBlank: true, formulae: ['"masculino,feminino,infantil"'] };
    ws.getCell(r, 19).dataValidation = { type: "list", allowBlank: true, formulae: ['"ativo,rascunho"'] };
    for (const c of [5, 6, 7]) ws.getCell(r, c).numFmt = '"R$" #,##0.00';
  }
  const help = wb.addWorksheet("Instruções");
  const lines = [
    "COMO PREENCHER",
    "Obrigatórios: nome, sku, categoria, custo, preco_sugerido.",
    "publico: masculino, feminino ou infantil. Preenche os tamanhos sozinho (deixe a coluna tamanhos em branco).",
    "tamanhos: só se quiser outros. Separe com | (ex.: P|M|G).",
    "estoque: um número vale para todos os tamanhos (10); ou na ordem dos tamanhos (10|20|20|10); ou por nome (P:10|M:20).",
    "grade: opcional, peças por tamanho na ordem dos tamanhos (2|4|4|2|1|1). Vazio = sem venda em grade.",
    "imagens: endereços (URLs) separados por |. As fotos também podem ser enviadas depois, em cada produto.",
    "peso_g e medidas em cm: usados na cotação de frete. Se vazio: 300 g e 30 x 25 x 3 cm.",
    "status: ativo ou rascunho.",
    "SKU repetido: escolha ignorar ou atualizar na tela de importação. Atualizar muda preços, textos e medidas; não mexe no estoque.",
    "Estoque mínimo: para uma loja ativar o produto, cada tamanho precisa ter o mínimo definido em Corte e operação (padrão 4).",
    "Limite: 500 produtos por arquivo.",
  ];
  lines.forEach((l, n) => { const row = help.addRow([l]); if (n === 0) row.font = { bold: true, size: 14 }; });
  help.getColumn(1).width = 130;
  const grids = wb.addWorksheet("Tamanhos");
  grids.addRow(["Grade", "Tamanhos"]); grids.getRow(1).font = { bold: true };
  for (const k of ["ADULT_MALE", "ADULT_FEMALE", "KIDS"] as const) grids.addRow([SIZE_GRIDS[k].label, SIZE_GRIDS[k].sizes.join(" | ")]);
  grids.getColumn(1).width = 26; grids.getColumn(2).width = 50;
  return Buffer.from(await wb.xlsx.writeBuffer());
}
