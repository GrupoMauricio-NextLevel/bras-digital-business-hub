import { eq } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { partnerActivities, partnerProfiles, partners } from "@/db/schema";
import { newId } from "@/lib/ids";
import { BONUS_ATIVACAO_CENTS, BONUS_META_ATIVACOES, BONUS_META_CENTS } from "@/lib/finance/revisao-d226";
import { regrasDoParceiro } from "./parceiros-ec";
import { commercePlansView } from "./commerce-plans";

/**
 * Página de captação de parceiros da E-commerce (D252, fase PV4): perfis (criador, vendedor, agência), escada de níveis
 * com os números das regras vigentes, simulador e candidatura que entra no funil do Master como Candidato.
 */
export { PERFIS, PERFIL_LISTA, ganhoNoMes, escadaDoPerfil, type PerfilCaptacao, type RegraPerfil } from "@/lib/finance/captacao-regras";
import { PERFIS, type PerfilCaptacao, type RegraPerfil } from "@/lib/finance/captacao-regras";

export async function dadosDaCaptacao(db: Database) {
  const [criador, vendedor, agencia, pv] = await Promise.all([regrasDoParceiro(db, "AFFILIATE"), regrasDoParceiro(db, "REPRESENTATIVE"), regrasDoParceiro(db, "AGENCY"), commercePlansView(db)]);
  const planos = pv.plans.filter((p) => !p.quote && p.monthlyCents).map((p) => ({ nome: p.name.replace(/^Commerce\s+/i, ""), mensalCents: p.monthlyCents! }));
  return { regras: { criador, vendedor, agencia } as Record<PerfilCaptacao, RegraPerfil & { anualBps: number }>, planos, bonus: { ativacaoCents: BONUS_ATIVACAO_CENTS, metaCents: BONUS_META_CENTS, metaAtivacoes: BONUS_META_ATIVACOES } };
}

// ---------------------------------------------------------------------------------------------------------------------
// Candidatura (cadastro em etapas): entra no funil do Master como Candidato
// ---------------------------------------------------------------------------------------------------------------------
export const candidaturaSchema = z.object({
  perfil: z.enum(["criador", "vendedor", "agencia"]),
  region: z.string().trim().min(2, "Informe a sua cidade ou região").max(60),
  channels: z.string().trim().max(200).optional(),
  followers: z.number().int().min(0).max(1_000_000_000).nullable().optional(),
  carteira: z.number().int().min(0).max(100_000).nullable().optional(),
  sobre: z.string().trim().max(400).optional(),
});
export type Candidatura = z.infer<typeof candidaturaSchema>;

export async function registrarCandidatura(db: Database, partnerId: string, raw: unknown, now = new Date()) {
  const c = candidaturaSchema.parse(raw);
  await db.insert(partnerProfiles).values({ partnerId, region: c.region, channels: c.channels || null, followers: c.followers ?? null, manualStage: "CANDIDATO" })
    .onConflictDoUpdate({ target: partnerProfiles.partnerId, set: { region: c.region, channels: c.channels || null, followers: c.followers ?? null, manualStage: "CANDIDATO", updatedAt: now.toISOString() } });
  const resumo = [`Candidatura: ${PERFIS[c.perfil].rotulo.toLowerCase()}`, `região ${c.region}`, c.channels ? `canais ${c.channels}` : null, c.followers != null ? `${c.followers} seguidores` : null, c.carteira != null ? `${c.carteira} lojistas na carteira` : null, c.sobre ? `"${c.sobre}"` : null].filter(Boolean).join(" · ");
  await db.insert(partnerActivities).values({ id: newId("pac"), partnerId, kind: "NOTA", text: resumo, createdAt: now.toISOString() });
  if (c.perfil === "agencia") await db.update(partners).set({ agencyRequestedAt: now.toISOString(), agencyInfo: [c.channels, c.carteira != null ? `${c.carteira} clientes` : null, c.sobre].filter(Boolean).join(" · ") || "Cadastro pela página de agências" }).where(eq(partners.id, partnerId));
  if (c.perfil === "vendedor") await db.insert(partnerActivities).values({ id: newId("pac"), partnerId, kind: "TAREFA", text: "Pediu a trilha de vendedor (representante): conferir e mudar o tipo", dueAt: new Date(now.getTime() + 2 * 86_400_000).toISOString(), createdAt: now.toISOString() });
}
