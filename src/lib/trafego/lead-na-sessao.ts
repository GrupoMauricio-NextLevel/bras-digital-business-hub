import { cookies, headers } from "next/headers";
import type { Database } from "@/db/client";
import { marcarLeadNaSessao } from "@/lib/domain/trafego/coletor";

/** Depois que um formulário de contato é aceito: marca a sessão do visitante como lead (TR2, D291). Nunca lança. */
export async function marcarLeadDaVisita(db: Database, pagina?: string): Promise<void> {
  try {
    const sid = (await cookies()).get("nl-sid")?.value;
    const caminho = pagina ?? (await headers()).get("x-nl-path") ?? "/";
    await marcarLeadNaSessao(db, sid, caminho);
  } catch { /* medição nunca derruba o formulário */ }
}
