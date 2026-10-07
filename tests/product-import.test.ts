import { describe, it, expect, beforeEach } from "vitest";
import { eq } from "drizzle-orm";
import JSZip from "jszip";
import { freshDb } from "./setup";
import { products, supplierOps } from "@/db/schema";
import { parseProductRows, parseStock } from "@/lib/domain/product-import";
import { buildTemplateXlsx, importRows, previewImport, readSpreadsheet } from "@/lib/domain/product-import-server";
import { activationCheck, parseSizeGrid, SIZE_GRIDS } from "@/lib/domain/size-grids";
import { checkProductActivation } from "@/lib/domain/catalog";
import { createProduct } from "@/lib/domain/products";

let ctx: Awaited<ReturnType<typeof freshDb>>;
beforeEach(async () => { ctx = await freshDb(); });
const head = ["nome", "sku", "categoria", "publico", "custo", "preco_sugerido", "preco_minimo", "estoque"];

describe("grades de tamanho", () => {
  it("grades do dono: adulto P M G GG XX1 2XL e infantil 18 a 28", () => {
    expect(SIZE_GRIDS.ADULT_MALE.sizes).toEqual(["P", "M", "G", "GG", "XX1", "2XL"]);
    expect(SIZE_GRIDS.ADULT_FEMALE.sizes).toEqual(["P", "M", "G", "GG", "XX1", "2XL"]);
    expect(SIZE_GRIDS.KIDS.sizes).toEqual(["18", "20", "22", "24", "26", "28"]);
    expect(parseSizeGrid("Masculino")).toBe("ADULT_MALE"); expect(parseSizeGrid("fem")).toBe("ADULT_FEMALE"); expect(parseSizeGrid("Infantil")).toBe("KIDS"); expect(parseSizeGrid("xyz")).toBeNull();
  });
  it("estoque mínimo por tamanho para ativar", () => {
    expect(activationCheck([{ size: "P", available: 4 }, { size: "M", available: 3 }], 4)).toEqual({ ok: false, min: 4, short: [{ size: "M", available: 3 }] });
    expect(activationCheck([{ size: "P", available: 4 }], 4).ok).toBe(true);
    expect(activationCheck([], 4).ok).toBe(false);
  });
});

describe("leitura da planilha", () => {
  it("estoque: único, na ordem ou por nome; erros claros", () => {
    expect(parseStock("10", ["P", "M"]).stock).toEqual([10, 10]);
    expect(parseStock("1|2", ["P", "M"]).stock).toEqual([1, 2]);
    expect(parseStock("M:5|P:3", ["P", "M"]).stock).toEqual([3, 5]);
    expect(parseStock("1|2|3", ["P", "M"]).error).toMatch(/3 valores para 2/);
    expect(parseStock("G:1", ["P", "M"]).error).toMatch(/não existe/);
  });
  it("aceita apelidos de cabeçalho, preço internacional e detecta erros e avisos", () => {
    const rows = parseProductRows([["Produto", "Código", "Cat", "Gênero", "Custo R$", "Preço", "Mínimo", "Qtd"], ["Manto A", "a-1", "Times", "Masculino", "59.00", "149,90", "", "2"], ["Manto B", "a-1", "Times", "", "100", "90", "", "10"]], { minActivationStock: 4 });
    expect(rows[0]!.errors).toEqual([]);
    expect(rows[0]!.input?.costCents).toBe(5900);
    expect(rows[0]!.warnings.join()).toMatch(/estoque abaixo de 4/);
    expect(rows[1]!.errors.join()).toMatch(/sku repetido/);
    expect(rows[1]!.errors.join()).toMatch(/custo maior/);
  });
  it("peso e medidas têm padrão e são validados", () => {
    const [r] = parseProductRows([[...head, "peso_g", "altura_cm"], ["Manto", "b-1", "Times", "infantil", "40", "100", "", "5", "250", "abc"]]);
    expect(r!.errors.join()).toMatch(/altura inválido/);
  });
  it("modelo .xlsx gerado é lido de volta sem erros", async () => {
    const buf = await buildTemplateXlsx();
    const matrix = await readSpreadsheet({ kind: "xlsx", base64: buf.toString("base64") });
    const rows = parseProductRows(matrix);
    expect(rows.length).toBe(3);
    expect(rows.every((r) => r.errors.length === 0)).toBe(true);
    expect(rows[0]!.input?.sizes.map((s) => s.size)).toEqual(["P", "M", "G", "GG", "XX1", "2XL"]);
    expect(rows[2]!.input?.sizes.map((s) => s.size)).toEqual(["18", "20", "22", "24", "26", "28"]);
  });
  it("medida com casas decimais (altura 0.2 cm, como na wBuy) vira 1 cm em vez de erro", () => {
    const [r] = parseProductRows([[...head, "altura_cm"], ["Manto", "b-1", "Times", "infantil", "40", "100", "", "5", "0.2"]]);
    expect(r!.errors).toEqual([]); expect(r!.input!.heightCm).toBe(1);
    const [z] = parseProductRows([[...head, "altura_cm"], ["Manto", "b-1", "Times", "infantil", "40", "100", "", "5", "0"]]);
    expect(z!.errors.join()).toMatch(/altura inválido/);
  });
  it("lê planilha gravada com prefixo nas tags (<x:worksheet>, gerada por outros sistemas) e recusa arquivo quebrado com mensagem clara", async () => {
    // Recria o formato da planilha adaptada da wBuy: mesmas abas, tags com prefixo "x:", BOM e caminhos absolutos.
    const zip = await JSZip.loadAsync(await buildTemplateXlsx());
    const NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
    for (const f of Object.values(zip.files)) {
      if (f.dir || !/\.(xml|rels)$/.test(f.name)) continue;
      let xml = await f.async("string");
      if (xml.includes(`xmlns="${NS}"`)) xml = xml.replace(`xmlns="${NS}"`, `xmlns:x="${NS}"`).replace(/<(\/?)(?![?!])([A-Za-z])/g, (m, slash: string, c: string, off: number, all: string) => (/^[A-Za-z]+:/.test(all.slice(off + 1 + slash.length)) ? m : `<${slash}x:${c}`));
      xml = xml.replace(/Target="(?!\/)(xl\/|worksheets|styles|theme|sharedStrings)/g, (_m, p: string) => `Target="/${f.name.startsWith("xl/") ? "xl/" : ""}${p}`);
      zip.file(f.name, "\uFEFF" + xml);
    }
    const buf = await zip.generateAsync({ type: "nodebuffer" });
    expect((await zip.file("xl/workbook.xml")!.async("string"))).toContain("<x:workbook");
    const rows = parseProductRows(await readSpreadsheet({ kind: "xlsx", base64: buf.toString("base64") }));
    expect(rows.length).toBe(3);
    expect(rows.every((r) => r.errors.length === 0)).toBe(true);
    expect(rows[0]!.raw.nome).toBe("Manto Exemplo 2025");
    await expect(readSpreadsheet({ kind: "xlsx", base64: Buffer.from("não é planilha").toString("base64") })).rejects.toMatchObject({ code: "INVALID_FILE" });
  });
});

describe("importação com conferência", () => {
  const matrix = (rows: string[][]) => [head, ...rows];
  it("prévia não grava; importar cria; SKU existente é ignorado ou atualizado sem mexer no estoque", async () => {
    const sup = ctx.seed.supplierId;
    const m = matrix([["Manto Novo", "IMP-1", "Times", "masculino", "59,00", "149,90", "119,90", "10"], ["Manto Ruim", "IMP-2", "", "masculino", "59,00", "149,90", "", "10"]]);
    const pv = await previewImport(ctx.db, sup, m, "skip");
    expect(pv).toMatchObject({ total: 2, create: 1, errors: 1 });
    expect((await ctx.db.select().from(products).where(eq(products.sku, "IMP-1"))).length).toBe(0);
    const r = await importRows(ctx.db, sup, m, "skip");
    expect(r).toMatchObject({ created: 1, updated: 0, failed: [expect.objectContaining({ line: 3 })] });
    const created = (await ctx.db.select().from(products).where(eq(products.sku, "IMP-1")))[0]!;
    expect(created.sizeGrid).toBe("ADULT_MALE");
    const again = await importRows(ctx.db, sup, m, "skip");
    expect(again.skipped).toBe(1);
    const upd = matrix([["Manto Novo V2", "IMP-1", "Times", "masculino", "60,00", "159,90", "129,90", "99"]]);
    expect((await importRows(ctx.db, sup, upd, "update")).updated).toBe(1);
    const after = (await ctx.db.select().from(products).where(eq(products.sku, "IMP-1")))[0]!;
    expect(after.name).toBe("Manto Novo V2"); expect(after.suggestedPriceCents).toBe(15990);
    const chk = await checkProductActivation(ctx.db, after.id);
    expect(chk.ok).toBe(true); // estoque continua 10 por tamanho (a atualização não mexe nele)
  });
  it("ativação exige o mínimo definido pelo fornecedor por tamanho", async () => {
    const sup = ctx.seed.supplierId;
    const { productId } = await createProduct(ctx.db, sup, { name: "Manto Baixo", sku: "LOW-1", categoryName: "Times", costCents: 5000, suggestedPriceCents: 12000, minimumPriceCents: 9000, sizes: [{ size: "P", initialStock: 3 }, { size: "M", initialStock: 9 }] });
    expect((await checkProductActivation(ctx.db, productId)).short.map((s) => s.size)).toEqual(["P"]);
    await ctx.db.insert(supplierOps).values({ supplierId: sup, timezone: "America/Sao_Paulo", cutoffs: { mon: null, tue: null, wed: null, thu: null, fri: null, sat: null, sun: null }, holidays: [], minActivationStock: 2 }).onConflictDoUpdate({ target: supplierOps.supplierId, set: { minActivationStock: 2 } });
    expect((await checkProductActivation(ctx.db, productId)).ok).toBe(true);
  });
});
