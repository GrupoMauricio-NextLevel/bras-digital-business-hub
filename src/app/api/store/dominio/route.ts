import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/db/client";
import { lojaPorDominio } from "@/lib/domain/dominio-proprio";

/** Prova de conexão do domínio próprio (D234): pelo domínio da loja, responde qual loja ele abre. Sem dado pessoal. */
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "";
  const loja = host ? await lojaPorDominio(await getDb(), host) : null;
  return NextResponse.json({ loja }, { headers: { "cache-control": "no-store" } });
}
