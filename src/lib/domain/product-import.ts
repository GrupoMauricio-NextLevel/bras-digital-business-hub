import type { CreateProductInput } from "./products";
import { SIZE_GRIDS, parseSizeGrid, type SizeGridKey } from "./size-grids";

/**
 * Importação de produtos por planilha (CSV ou XLSX). A leitura devolve linhas validadas com erros (impedem a linha)
 * e avisos (não impedem). A checagem contra o banco (SKU existente, categoria nova) é feita na ação de pré-visualização.
 */
export const CSV_COLUMNS = ["nome", "sku", "categoria", "publico", "custo", "preco_sugerido", "preco_minimo", "tamanhos", "estoque", "grade", "descricao", "imagens", "seo_titulo", "seo_descricao", "peso_g", "comprimento_cm", "largura_cm", "altura_cm", "status"] as const;

export type ImportRow = { line: number; input: CreateProductInput | null; errors: string[]; warnings: string[]; raw: Record<string, string> };
export type CsvRow = ImportRow;

/** Apelidos aceitos nos cabeçalhos (sem acento, minúsculos, com _). */
const ALIASES: Record<string, (typeof CSV_COLUMNS)[number]> = {
  produto: "nome", titulo: "nome", nome_do_produto: "nome", codigo: "sku", ref: "sku", referencia: "sku", cat: "categoria",
  grade_de_tamanhos: "publico", genero: "publico", tipo: "publico", custo_rs: "custo", preco_custo: "custo", preco: "preco_sugerido", preco_venda: "preco_sugerido", preco_sugerido_rs: "preco_sugerido",
  minimo: "preco_minimo", preco_min: "preco_minimo", tamanho: "tamanhos", estoque_inicial: "estoque", quantidade: "estoque", qtd: "estoque",
  descricao_do_produto: "descricao", fotos: "imagens", imagem: "imagens", foto: "imagens", peso: "peso_g", comprimento: "comprimento_cm", largura: "largura_cm", altura: "altura_cm", situacao: "status",
};
const norm = (h: string) => h.trim().toLowerCase().replace(/r\$/g, "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

export function brl(v: string | undefined): number {
  if (!v) return 0;
  const clean = v.replace(/[^\d,.-]/g, "");
  // "1.234,56" (BR) ou "1234.56" (planilha em formato internacional)
  const n = clean.includes(",") ? Number(clean.replace(/\./g, "").replace(",", ".")) : Number(clean);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}
const int = (v: string | undefined) => { const n = Number(String(v ?? "").replace(/[^\d.-]/g, "")); return Number.isFinite(n) ? Math.round(n) : NaN; };

/** Estoque: "10" (igual em todos os tamanhos), "10|20|20|10" (na ordem) ou "P:10|M:20". */
export function parseStock(raw: string, sizes: string[]): { stock: number[]; error?: string } {
  const v = raw.trim();
  if (!v) return { stock: sizes.map(() => 0) };
  if (v.includes(":")) {
    const map = new Map<string, number>();
    for (const part of v.split("|")) { const [k, q] = part.split(":"); if (!k) continue; map.set(k.trim().toUpperCase(), Number(q)); }
    const unknown = [...map.keys()].filter((k) => !sizes.includes(k));
    if (unknown.length) return { stock: [], error: `estoque cita tamanho que não existe: ${unknown.join(", ")}` };
    return { stock: sizes.map((sz) => (Number.isFinite(map.get(sz)) ? map.get(sz)! : 0)) };
  }
  const parts = v.split("|").map((x) => Number(x.trim() || 0));
  if (parts.some((n) => !Number.isFinite(n) || n < 0)) return { stock: [], error: "estoque inválido" };
  if (parts.length === 1) return { stock: sizes.map(() => parts[0]!) };
  if (parts.length !== sizes.length) return { stock: [], error: `estoque tem ${parts.length} valores para ${sizes.length} tamanhos` };
  return { stock: parts };
}

/** Converte uma matriz (CSV ou XLSX) em linhas validadas. `minActivationStock` gera aviso quando o estoque é menor. */
export function parseProductRows(matrix: string[][], opts: { minActivationStock?: number } = {}): ImportRow[] {
  const rows = matrix;
  if (rows.length < 2) return [];
  const header = rows[0]!.map((h) => { const n = norm(String(h ?? "")); return ALIASES[n] ?? n; });
  const seenSku = new Map<string, number>();
  return rows.slice(1).map((cells, idx) => {
    const raw: Record<string, string> = {};
    header.forEach((h, i) => { raw[h] = String(cells[i] ?? "").trim(); });
    const errors: string[] = []; const warnings: string[] = [];
    const line = idx + 2;
    if (!raw.nome) errors.push("nome vazio"); else if (raw.nome.length < 3) errors.push("nome muito curto");
    if (!raw.sku) errors.push("sku vazio");
    if (!raw.categoria) errors.push("categoria vazia");
    const skuKey = (raw.sku ?? "").toUpperCase();
    if (skuKey) { if (seenSku.has(skuKey)) errors.push(`sku repetido na planilha (linha ${seenSku.get(skuKey)})`); else seenSku.set(skuKey, line); }
    const grid: SizeGridKey = raw.publico ? parseSizeGrid(raw.publico) ?? (errors.push(`público "${raw.publico}" não reconhecido (use masculino, feminino ou infantil)`), "CUSTOM") : "CUSTOM";
    const sizes = (raw.tamanhos ? raw.tamanhos.split(/[|;,]/) : grid !== "CUSTOM" ? SIZE_GRIDS[grid].sizes : ["P", "M", "G", "GG"]).map((s) => s.trim().toUpperCase()).filter(Boolean);
    if (sizes.length === 0) errors.push("sem tamanhos");
    if (new Set(sizes).size !== sizes.length) errors.push("tamanhos repetidos");
    if (sizes.some((s) => s.length > 6)) errors.push("tamanho com mais de 6 caracteres");
    const st = parseStock(raw.estoque ?? "", sizes);
    if (st.error) errors.push(st.error);
    const grade = (raw.grade || "").split("|").map((s) => Number(s.trim() || 0));
    if (grade.some((n) => !Number.isFinite(n) || n < 0)) errors.push("grade inválida");
    const hasPack = grade.some((n) => n > 0);
    if (hasPack && grade.length !== sizes.length) errors.push(`grade tem ${grade.length} valores para ${sizes.length} tamanhos`);
    const cost = brl(raw.custo), sug = brl(raw.preco_sugerido), min = brl(raw.preco_minimo);
    if (cost <= 0) errors.push("custo inválido");
    if (sug <= 0) errors.push("preço sugerido inválido");
    if (min && min > sug) errors.push("preço mínimo maior que o sugerido");
    if (cost > 0 && (min || sug) && cost > (min || sug)) errors.push("custo maior que o preço mínimo");
    if (cost > 0 && sug > 0 && (sug - cost) / sug < 0.15) warnings.push("margem do lojista abaixo de 15%");
    const min4 = opts.minActivationStock ?? 0;
    if (min4 > 0 && st.stock.some((q) => q < min4)) warnings.push(`estoque abaixo de ${min4} em algum tamanho: as lojas não conseguirão ativar`);
    // Medidas com casas decimais (ex.: altura 0.2 cm vinda da wBuy) arredondam para no mínimo 1.
    const num = (v: string | undefined, d: number, label: string) => { if (!v) return d; const n = int(v); const raw = Number(String(v).replace(/[^\d.-]/g, "")); if (!Number.isFinite(n) || raw <= 0) { errors.push(`${label} inválido`); return d; } return Math.max(1, n); };
    const status = /^(rascunho|draft|inativo)$/i.test(raw.status ?? "") ? "DRAFT" : "ACTIVE";
    const gsum = grade.reduce((a, b) => a + b, 0);
    const input: CreateProductInput = {
      name: raw.nome ?? "", sku: raw.sku ?? "", description: raw.descricao ?? "", categoryName: raw.categoria ?? "",
      images: (raw.imagens || "").split("|").map((s) => s.trim()).filter(Boolean),
      costCents: cost, suggestedPriceCents: sug, minimumPriceCents: min || sug,
      sellsUnit: true, sellsPack: hasPack, distribution: "ALL_NETWORK", status, sizeGrid: grid,
      seoTitle: (raw.seo_titulo ?? "").slice(0, 120), seoDescription: (raw.seo_descricao ?? "").slice(0, 320),
      weightG: num(raw.peso_g, 300, "peso"), lengthCm: num(raw.comprimento_cm, 30, "comprimento"), widthCm: num(raw.largura_cm, 25, "largura"), heightCm: num(raw.altura_cm, 3, "altura"),
      sizes: sizes.map((size, i) => ({ size, initialStock: st.stock[i] ?? 0, packQuantity: hasPack ? grade[i] ?? 0 : 0 })),
      pack: hasPack ? { name: `Grade ${gsum} peças`, costCents: cost * gsum, suggestedPriceCents: (min || sug) * gsum, minimumPriceCents: cost * gsum } : undefined,
    };
    return { line, input: errors.length ? null : input, errors, warnings, raw };
  });
}

/** CSV com cabeçalho. Separador `;`, `,` ou tabulação; aspas e BOM tratados. */
export function csvToMatrix(text: string): string[][] {
  const lines = text.replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];
  const first = lines[0]!;
  const count = (c: string) => first.split(c).length - 1;
  const sep = count(";") >= count(",") && count(";") >= count("\t") ? ";" : count("\t") > count(",") ? "\t" : ",";
  return lines.map((l) => splitCsvLine(l, sep));
}

export function parseProductsCsv(text: string, opts: { minActivationStock?: number } = {}): ImportRow[] {
  return parseProductRows(csvToMatrix(text), opts);
}

function splitCsvLine(line: string, sep: string): string[] {
  const out: string[] = [];
  let cur = "", quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (ch === '"') { if (quoted && line[i + 1] === '"') { cur += '"'; i++; } else quoted = !quoted; }
    else if (ch === sep && !quoted) { out.push(cur); cur = ""; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}

export const CSV_TEMPLATE = `nome;sku;categoria;publico;custo;preco_sugerido;preco_minimo;tamanhos;estoque;grade;descricao;imagens;seo_titulo;seo_descricao;peso_g;comprimento_cm;largura_cm;altura_cm;status
Manto Exemplo 2025;EX-001;Times Brasileiros;masculino;59,00;149,90;119,90;;10;2|4|4|2|1|1;Camisa de torcedor dry-fit;https://exemplo.com/foto1.jpg|https://exemplo.com/foto2.jpg;Manto Exemplo 2025 original;Camisa de torcedor dry-fit com envio para todo o Brasil;300;30;25;3;ativo
Manto Exemplo Feminino 2025;EX-002;Times Brasileiros;feminino;59,00;149,90;119,90;;P:10|M:20|G:20|GG:10|XX1:5|2XL:5;;Modelagem feminina;;;;300;30;25;3;ativo
Conjunto Infantil Exemplo;EX-003;Infantil;infantil;45,00;119,90;99,90;;8;;Conjunto camisa e short;;;;250;30;25;3;rascunho`;
