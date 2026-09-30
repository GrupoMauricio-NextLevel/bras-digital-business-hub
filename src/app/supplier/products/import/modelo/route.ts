import { getSession } from "@/lib/auth";
import { buildTemplateXlsx } from "@/lib/domain/product-import-server";

/** Baixa o modelo de planilha (.xlsx) com exemplos, listas suspensas e instruções. Só o gestor do fornecedor. */
export async function GET() {
  const s = await getSession();
  if (!s || s.user.role !== "SUPPLIER_ADMIN") return new Response("Não autorizado", { status: 403 });
  const buf = await buildTemplateXlsx();
  return new Response(new Uint8Array(buf), { headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": 'attachment; filename="modelo-produtos-superdrop.xlsx"', "Cache-Control": "no-store" } });
}
