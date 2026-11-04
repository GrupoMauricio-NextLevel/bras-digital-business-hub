import { promises as dns } from "node:dns";
import { eq } from "drizzle-orm";
import type { Database } from "@/db/client";
import { stores } from "@/db/schema";
import { DomainError } from "./errors";
import { ehRaiz } from "./dominio-proprio";

/**
 * E-mail com o domínio da loja (D245). Sem custo para a NextLevel: o lojista cria o e-mail no plano GRÁTIS do Zoho Mail
 * (até 5 caixas, conta dele) seguindo o passo a passo do painel; nós só conferimos o DNS (registro MX) e dizemos se está
 * ligado e em qual provedor. O adicional pago "Marca Completa" (caixas criadas por nós) fica bloqueado até ser ativado.
 */
export type ProvedorEmail = "zoho" | "google" | "microsoft" | "hostinger" | "cloudflare" | "outro";
const PADROES: [ProvedorEmail, RegExp][] = [
  ["zoho", /(^|\.)zoho(mail)?\.(com|eu|in|com\.au)$/],
  ["google", /(^|\.)(google|googlemail)\.com$/],
  ["microsoft", /(^|\.)(outlook\.com|protection\.outlook\.com)$/],
  ["hostinger", /(^|\.)hostinger\.(com|com\.br)$/],
  ["cloudflare", /(^|\.)mx\.cloudflare\.net$/],
];
export const NOME_PROVEDOR: Record<ProvedorEmail, string> = { zoho: "Zoho Mail", google: "Google Workspace", microsoft: "Microsoft 365", hostinger: "Hostinger", cloudflare: "Cloudflare (encaminhamento)", outro: "outro provedor" };

/** Domínio do e-mail: o domínio raiz (www.loja.com.br → loja.com.br). */
export function dominioDoEmail(dominio: string): string {
  const d = dominio.toLowerCase().replace(/^www\./, "");
  if (ehRaiz(d)) return d;
  const p = d.split("."); return p.slice(1).join(".");
}

/** Provedor pelo registro MX (puro). */
export function provedorPorMx(mx: string[]): ProvedorEmail | null {
  if (!mx.length) return null;
  const h = mx.map((x) => x.toLowerCase().replace(/\.$/, ""));
  for (const [p, re] of PADROES) if (h.some((x) => re.test(x))) return p;
  return "outro";
}

export type SituacaoEmail = { dominio: string; ligado: boolean; provedor: ProvedorEmail | null; nome: string | null };
export async function verificarEmailDaLoja(db: Database, storeId: string, resolveMx: (d: string) => Promise<string[]> = async (d) => (await dns.resolveMx(d).catch(() => [])).map((r) => r.exchange)): Promise<SituacaoEmail> {
  const s = await db.query.stores.findFirst({ where: eq(stores.id, storeId), columns: { customDomain: true } });
  if (!s?.customDomain) throw new DomainError("SEM_DOMINIO", "Conecte o domínio da loja primeiro.");
  const dominio = dominioDoEmail(s.customDomain);
  const provedor = provedorPorMx(await resolveMx(dominio));
  return { dominio, ligado: !!provedor, provedor, nome: provedor ? NOME_PROVEDOR[provedor] : null };
}

/** Adicional pago (D236): bloqueado até a NextLevel ativar um provedor sem custo de operação ou aprovar o custo. */
export const MARCA_COMPLETA = { disponivel: false, precoCents: 1990, caixas: 3, caixaExtraCents: 690 } as const;
