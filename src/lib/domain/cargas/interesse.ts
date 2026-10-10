import { eq } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { brandLeads } from "@/db/schema";
import { BRAS_UFS } from "@/lib/bras/ufs";
import { CARGAS_KINDS, CARGAS_KIND_LABEL, CARGAS_VEHICLES, CARGAS_VEHICLE_LABEL } from "@/lib/cargas/rotulos";
import { isValidCnpj } from "../bras/membros";
import { createBrandLead } from "../brand-leads";

/**
 * NextLevel Cargas (D108), antes do painel da transportadora (fase F2): lista de interesse com o que a equipe precisa
 * para chamar cada transportadora na primeira rodada (regiões, veículos, seguro). Usa os interessados por marca
 * (CRM do Master → Interessados), sem tabela nova. Nada de documento sensível: RNTRC e seguro são declarados.
 */
export { CARGAS_KINDS, CARGAS_KIND_LABEL, CARGAS_VEHICLES, CARGAS_VEHICLE_LABEL };

const digits = (v: string) => v.replace(/\D/g, "");
export function isValidCpf(raw: string) {
  const c = digits(raw);
  if (c.length !== 11 || /^(\d)\1{10}$/.test(c)) return false;
  const dv = (n: number) => { const s = c.slice(0, n).split("").reduce((a, d, i) => a + Number(d) * (n + 1 - i), 0); const r = (s * 10) % 11; return r === 10 ? 0 : r; };
  return dv(9) === Number(c[9]) && dv(10) === Number(c[10]);
}

export const cargasInterestSchema = z.object({
  kind: z.enum(CARGAS_KINDS, { message: "Escolha o tipo de cadastro." }),
  name: z.string().trim().min(3, "Informe o seu nome").max(120),
  company: z.string().trim().max(120).optional(),
  document: z.string().trim().max(20),
  phone: z.string(),
  email: z.string(),
  ufs: z.array(z.enum(BRAS_UFS)).max(27).default([]),
  vehicles: z.array(z.enum(CARGAS_VEHICLES)).max(5).default([]),
  rntrc: z.boolean().default(false),
  insurance: z.boolean().default(false),
  message: z.string().trim().max(600).optional(),
}).superRefine((v, ctx) => {
  const d = digits(v.document);
  const ok = v.kind === "AUTONOMO" ? isValidCpf(d) : isValidCnpj(d);
  if (!ok) ctx.addIssue({ code: "custom", path: ["document"], message: v.kind === "AUTONOMO" ? "CPF inválido. Confira os 11 números." : "CNPJ inválido. Confira os 14 números." });
  if (v.kind !== "IMPORTADORA" && !v.ufs.length) ctx.addIssue({ code: "custom", path: ["ufs"], message: "Marque pelo menos um estado que você atende." });
  if (v.kind !== "IMPORTADORA" && !v.vehicles.length) ctx.addIssue({ code: "custom", path: ["vehicles"], message: "Marque pelo menos um tipo de veículo." });
  if (v.kind !== "AUTONOMO" && !v.company) ctx.addIssue({ code: "custom", path: ["company"], message: "Informe o nome da empresa." });
});
export type CargasInterestInput = z.input<typeof cargasInterestSchema>;

/** Registra (ou atualiza, pelo e-mail) o interesse. O documento fica só em dígitos, para a equipe conferir antes de chamar. */
export async function registerCargasInterest(db: Database, raw: CargasInterestInput, affiliateRef?: string) {
  const v = cargasInterestSchema.parse(raw);
  const detalhes = [
    `${CARGAS_KIND_LABEL[v.kind]} · documento ${digits(v.document)}`,
    v.ufs.length ? `Atende: ${v.ufs.join(", ")}` : null,
    v.vehicles.length ? `Veículos: ${v.vehicles.map((x) => CARGAS_VEHICLE_LABEL[x]).join(", ")}` : null,
    v.kind !== "IMPORTADORA" ? `RNTRC: ${v.rntrc ? "sim" : "não informado"} · Seguro de carga: ${v.insurance ? "sim" : "não informado"}` : null,
    v.message || null,
  ].filter(Boolean).join("\n");
  const r = await createBrandLead(db, { brand: "NEXTLEVEL_CARGAS", name: v.name, email: v.email, phone: v.phone, storeName: v.company || undefined, segment: v.kind, message: detalhes.slice(0, 600), affiliateRef });
  await db.update(brandLeads).set({ needs: [...v.ufs.map((u) => `UF:${u}`), ...v.vehicles.map((x) => `VEICULO:${x}`)], attribution: { origem: "cargas-home" } }).where(eq(brandLeads.id, r.id));
  return r;
}
