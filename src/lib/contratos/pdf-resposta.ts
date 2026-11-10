import { getDb } from "@/db/client";
import { getSession } from "@/lib/auth";
import { verContrato } from "@/lib/domain/contratos";
import { gerarPdfContrato } from "./pdf";
import type { DadosLojaPronta } from "./loja-pronta-express";

/** Baixar o PDF do contrato (Master ou o dono da loja dele). Permissão no domínio (verContrato). */
export async function respostaPdfDoContrato(id: string): Promise<Response> {
  const s = await getSession();
  if (!s) return new Response("Entre na sua conta.", { status: 401 });
  try {
    const c = await verContrato(await getDb(), s.actor, id);
    const pdf = await gerarPdfContrato({ numero: c.numero, titulo: c.titulo, hash: c.hash, dados: c.dados as unknown as DadosLojaPronta, secoes: c.conteudo.secoes, enviadoEm: c.enviadoEm, aceitoEm: c.aceitoEm, aceitoNome: c.aceitoNome, aceitoIp: c.aceitoIp, aceitoAparelho: c.aceitoAparelho });
    return new Response(Buffer.from(pdf), { headers: { "content-type": "application/pdf", "content-disposition": `inline; filename="Contrato-${c.numero}.pdf"`, "cache-control": "private, no-store" } });
  } catch { return new Response("Contrato não encontrado.", { status: 404 }); }
}
