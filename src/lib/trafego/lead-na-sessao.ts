import { cookies, headers } from "next/headers";
import type { Database } from "@/db/client";
import { registrarOrigemDoContato, type Via } from "@/lib/domain/trafego/origem-contato";

const json = (v: string | undefined): Record<string, string> => {
  if (!v) return {};
  try { let x = v; for (let i = 0; i < 3 && x.startsWith("%"); i++) x = decodeURIComponent(x); const o = JSON.parse(x) as unknown; return o && typeof o === "object" ? o as Record<string, string> : {}; } catch { return {}; }
};

/**
 * Depois que um contato é aceito (formulário, janela de saída, diagnóstico, cadastro da loja): guarda de onde a pessoa veio
 * para o Comercial e marca a visita como lead (TR2/TR3, D291/D294). Lê só cookies próprios. Nunca lança.
 */
export async function registrarOrigemDaVisita(db: Database, d: { chave: string; brand: string; via: Via; pagina?: string }): Promise<void> {
  try {
    const c = await cookies();
    const pagina = d.pagina ?? (await headers()).get("x-nl-path") ?? "/";
    await registrarOrigemDoContato(db, d.chave, d.brand, d.via, { ultimo: json(c.get("nl-attr")?.value), primeiro: json(c.get("nl-first")?.value), sessaoId: c.get("nl-sid")?.value ?? null }, pagina);
  } catch { /* medição nunca derruba o formulário */ }
}
