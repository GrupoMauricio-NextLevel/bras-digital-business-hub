import { and, eq, inArray, isNull, not, sql, like } from "drizzle-orm";
import type { Database } from "./client";
import { organizations, platformSettings, users } from "./schema";

/** Marca do recomeço aplicado (D199): guarda o código usado, para rodar uma vez só por código. */
export const RECOMECO_KEY = "recomeco.aplicado";

/**
 * Configuração e referência que ficam: temas, planos, catálogo e preços do Master, ofertas, regras de comissão,
 * experimentos, serviços e produtos digitais da NextLevel, vídeos da Brás, ajustes da plataforma e histórico financeiro.
 */
const MANTER = new Set([
  "themes", "theme_versions", "plans", "platform_settings", "services", "digital_products",
  "catalog_products", "catalog_price_versions", "catalog_offers", "commission_rules", "experiments",
  "financial_audit_log", "bd_videos", "job_runs",
]);

type Linhas<T> = T[];

/**
 * "Começar do zero" (D199, pedido do dono: não há clientes reais em nenhuma marca). Apaga contas, lojas, fornecedores,
 * pedidos, parceiros, conversas, interessados e tudo o que pende deles; mantém os usuários Master que não são de
 * demonstração (e a organização deles) e a configuração (`MANTER`). Tudo numa transação:
 * se algum dado a manter dependesse do que vai sair, nada é apagado. Roda uma vez por `codigo`.
 */
export async function recomecarDoZero(db: Database, codigo: string): Promise<string[]> {
  const log: string[] = [];
  const marca = await db.query.platformSettings.findFirst({ where: eq(platformSettings.key, RECOMECO_KEY) });
  if ((marca?.value as { codigo?: string } | undefined)?.codigo === codigo) return ["recomeço já aplicado com este código"];

  await db.transaction(async (tx) => {
    // Quem fica: Master de verdade (sem e-mail .demo, sem loja nem fornecedor) e a organização dele.
    const mestres: Linhas<typeof users.$inferSelect> = await tx.select().from(users).where(and(eq(users.role, "NEXTLEVEL_MASTER"), not(like(users.email, "%.demo")), isNull(users.storeId), isNull(users.supplierId)));
    if (!mestres.length) throw new Error("Recomeço cancelado: nenhum usuário Master real encontrado (defina MASTER_EMAIL antes).");
    const orgs = await tx.select().from(organizations).where(inArray(organizations.id, [...new Set(mestres.map((u) => u.organizationId))]));

    const todas = ((await tx.execute(sql`select table_name as t from information_schema.tables where table_schema = 'public' and table_type = 'BASE TABLE'`)) as unknown as { rows: { t: string }[] }).rows.map((r) => r.t);
    const limpar = todas.filter((t) => !MANTER.has(t));
    // Trava: nenhuma tabela mantida pode apontar para uma que será esvaziada.
    const refs = ((await tx.execute(sql`select tc.table_name as de, ccu.table_name as para from information_schema.table_constraints tc join information_schema.constraint_column_usage ccu on ccu.constraint_name = tc.constraint_name and ccu.table_schema = tc.table_schema where tc.constraint_type = 'FOREIGN KEY' and tc.table_schema = 'public'`)) as unknown as { rows: { de: string; para: string }[] }).rows;
    const conflito = refs.find((r) => MANTER.has(r.de) && !MANTER.has(r.para));
    if (conflito) throw new Error(`Recomeço cancelado: ${conflito.de} depende de ${conflito.para}.`);

    await tx.execute(sql.raw(`truncate table ${limpar.map((t) => `"${t}"`).join(", ")}`));
    log.push(`${limpar.length} tabelas esvaziadas (contas, lojas, pedidos, parceiros, conversas e interessados)`);

    await tx.insert(organizations).values(orgs);
    await tx.insert(users).values(mestres);
    log.push(`mantidos: ${mestres.length} acesso(s) Master, temas, planos, preços, ofertas e configurações`);

    await tx.delete(platformSettings).where(eq(platformSettings.key, "demo.ambiente"));
    await tx.insert(platformSettings).values({ key: RECOMECO_KEY, value: { codigo, em: new Date().toISOString() } })
      .onConflictDoUpdate({ target: platformSettings.key, set: { value: { codigo, em: new Date().toISOString() } } });
  });
  return log;
}
