/**
 * Chaves de liberação do financeiro Master (D90). Padrão seguro; desligar no Render reverte o comportamento novo
 * sem reverter código (ver docs/financeiro-master.md, seção 4).
 */
export type FinFlag = "FIN_CATALOG_MASTER" | "FIN_COMMERCE_PLANS" | "FIN_PAGARME" | "FIN_PARTNER_COMMISSIONS_V2" | "FIN_PUBLIC_SOLUTIONS" | "FIN_SOLUTIONS_V2";
const DEFAULT_ON: Record<FinFlag, boolean> = { FIN_CATALOG_MASTER: true, FIN_COMMERCE_PLANS: true, FIN_PAGARME: false, FIN_PARTNER_COMMISSIONS_V2: true, FIN_PUBLIC_SOLUTIONS: true, /** Vitrine imersiva de Soluções (D162): desligada até o dono aprovar; o Master vê em /solucoes?previa=v2. */ FIN_SOLUTIONS_V2: false };

export function finFlag(name: FinFlag, env: Record<string, string | undefined> = process.env): boolean {
  const v = env[name]?.trim().toLowerCase();
  if (v === "true" || v === "1") return true;
  if (v === "false" || v === "0") return false;
  return DEFAULT_ON[name];
}
