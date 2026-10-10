import { eq } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { platformSettings } from "@/db/schema";
import { requireMaster, type Actor } from "./access";
import { recordAudit } from "./audit";
import { isValidCnpj } from "./bras/membros";

/**
 * Empresas do grupo do dono (D112): quem fatura e responde juridicamente (Starline, Mega Tron, NextLevel). Não são
 * marcas: a Starline é uma transportadora como as outras e a Mega Tron uma loja como as outras. Daqui saem o selo
 * "empresa do grupo" (transparência, seção 3.4 do prompt do Club) e, depois, as partes do acerto de benefícios.
 * A ligação com o cadastro é pelo CNPJ: nenhuma coluna nova nas tabelas das marcas.
 */
import { GROUP_ROLES } from "./grupo-rotulos";
export { GROUP_ROLES, GROUP_ROLE_LABEL } from "./grupo-rotulos";

const digits = (v: string) => v.replace(/\D/g, "");
export const groupCompanySchema = z.object({
  key: z.string().trim().regex(/^[A-Z0-9_]{2,30}$/, "Chave em maiúsculas, sem espaço"),
  legalName: z.string().trim().min(3, "Informe a razão social").max(160),
  tradeName: z.string().trim().max(120).default(""),
  cnpj: z.string().transform(digits).refine((v) => v === "" || isValidCnpj(v), "CNPJ inválido"),
  role: z.enum(GROUP_ROLES),
  notes: z.string().trim().max(500).default(""),
});
export type GroupCompany = z.output<typeof groupCompanySchema>;
const listSchema = z.array(groupCompanySchema).max(20).superRefine((list, ctx) => {
  const keys = new Set<string>(); const docs = new Set<string>();
  list.forEach((c, i) => {
    if (keys.has(c.key)) ctx.addIssue({ code: "custom", path: [i, "key"], message: "Chave repetida" });
    if (c.cnpj && docs.has(c.cnpj)) ctx.addIssue({ code: "custom", path: [i, "cnpj"], message: "CNPJ repetido" });
    keys.add(c.key); if (c.cnpj) docs.add(c.cnpj);
  });
});

/** Padrão informado pelo dono em 2026-10-10. CNPJ vazio = a completar no Master. */
export const DEFAULT_GROUP_COMPANIES: GroupCompany[] = [
  { key: "STARLINE", legalName: "Starline Viagens e Turismo Ltda - ME", tradeName: "Mauricio Turismo", cnpj: "47173173000175", role: "TRANSPORTE", notes: "Ônibus de excursão e transporte de carga. Primeira transportadora da NextLevel Cargas." },
  { key: "MEGATRON", legalName: "Mega Tron Comércio Eletrônico Ltda", tradeName: "Mega Tron", cnpj: "", role: "ATACADO", notes: "Atacado, distribuidor e importador." },
  { key: "NEXTLEVEL", legalName: "NextLevel Marketing Ltda", tradeName: "NextLevel", cnpj: "", role: "TECNOLOGIA", notes: "Todas as marcas e sistemas." },
];

const KEY = "grupo.empresas";

export async function getGroupCompanies(db: Database): Promise<GroupCompany[]> {
  const row = await db.query.platformSettings.findFirst({ where: eq(platformSettings.key, KEY) });
  const parsed = listSchema.safeParse((row?.value as { list?: unknown } | undefined)?.list);
  return parsed.success ? parsed.data : DEFAULT_GROUP_COMPANIES;
}

export async function saveGroupCompanies(db: Database, actor: Actor, raw: z.input<typeof groupCompanySchema>[]) {
  requireMaster(actor);
  const before = await getGroupCompanies(db);
  const list = listSchema.parse(raw);
  await db.insert(platformSettings).values({ key: KEY, value: { list }, updatedBy: actor.userId }).onConflictDoUpdate({ target: platformSettings.key, set: { value: { list }, updatedBy: actor.userId, updatedAt: new Date().toISOString() } });
  await recordAudit(db, actor, { action: "GROUP_COMPANIES_SAVED", entityType: "platform_settings", entityId: KEY, before: { list: before }, after: { list } }, { force: true });
  return list;
}

/** CNPJs das empresas do grupo (só dígitos), para o selo. */
export function groupDocuments(list: GroupCompany[]): Set<string> {
  return new Set(list.map((c) => c.cnpj).filter(Boolean));
}
