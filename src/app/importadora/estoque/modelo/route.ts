import ExcelJS from "exceljs";
import { getSession } from "@/lib/auth";
import { STOCK_SHEET_COLUMNS } from "@/lib/domain/bras/importadora";

/** Planilha modelo de produtos e estoque (só para quem está logado como importadora ou Master). */
export async function GET() {
  const s = await getSession();
  if (!s || (s.user.role !== "BRAS_IMPORTER" && s.user.role !== "NEXTLEVEL_MASTER")) return new Response("Entre na sua conta.", { status: 403 });
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Produtos");
  ws.addRow([...STOCK_SHEET_COLUMNS]);
  ws.addRow(["GT-48", "Garrafa térmica inox 1 L", 24, "300,00", 50, 40, 30, "12,0", 1, "Cozinha", 40]);
  ws.addRow(["PT-5", "Kit 5 potes de vidro", 12, "189,90", 40, 30, 25, "8,5", 1, "Cozinha", 15]);
  ws.getRow(1).font = { bold: true };
  ws.columns.forEach((c) => { c.width = 18; });
  const guia = wb.addWorksheet("Como preencher");
  for (const l of [
    "Uma linha por produto. SKU é o código do produto na sua importadora (obrigatório).",
    "Produto novo: preencha SKU, Produto, Unidades por caixa e Preço da caixa.",
    "Produto que já existe: preencha só o que mudou (ex.: só SKU e Caixas em estoque para a contagem).",
    "Caixas em estoque é a contagem de hoje (substitui o saldo). Deixe vazio para não mexer no estoque.",
    "Medidas em centímetros e peso em quilos. Use vírgula ou ponto para decimais.",
    "Você vê a prévia antes de gravar: nada muda sem a sua confirmação.",
  ]) guia.addRow([l]);
  guia.getColumn(1).width = 110;
  const buf = await wb.xlsx.writeBuffer();
  return new Response(buf as ArrayBuffer, { headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": "attachment; filename=\"bras-produtos-e-estoque.xlsx\"" } });
}
