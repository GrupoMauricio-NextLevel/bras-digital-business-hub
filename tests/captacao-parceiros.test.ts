import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { partnerActivities, partners } from "@/db/schema";
import { registerPartner } from "@/lib/domain/partners";
import { cartoesDeParceiros } from "@/lib/domain/crm-parceiros";
import { dadosDaCaptacao, escadaDoPerfil, ganhoNoMes, registrarCandidatura } from "@/lib/domain/captacao-parceiros";

/** Página de captação de parceiros (D252, PV4). */
describe("captação de parceiros", () => {
  let ctx: Awaited<ReturnType<typeof freshDb>>;
  beforeEach(async () => { ctx = await freshDb(); });
  const r = { primeiraBps: 5000, recorrenteBps: 2000, meses: 600 };

  it("simulador: 1ª mensalidade + carteira acumulada com o nível subindo; bônus do vendedor", () => {
    expect(ganhoNoMes(r, "AFFILIATE", 3, 14_700, 1)).toMatchObject({ cents: 22_050, tier: "INICIAL" });
    // mês 12: 3 novas (50%) + 33 na carteira, nível Diamante (20+) = 26% para criador
    const m12 = ganhoNoMes(r, "AFFILIATE", 3, 14_700, 12);
    expect([m12.tier, m12.recBps]).toEqual(["DIAMANTE", 2600]);
    expect(m12.cents).toBe(22_050 + Math.round(33 * 14_700 * 0.26));
    expect(ganhoNoMes({ ...r, recorrenteBps: 2500 }, "AGENCY", 1, 14_700, 21).recBps).toBe(3200);
    expect(ganhoNoMes(r, "REPRESENTATIVE", 10, 14_700, 1).bonusCents).toBe(10 * 3_000 + 10_000);
    expect(ganhoNoMes(r, "AFFILIATE", 10, 14_700, 1).bonusCents).toBe(0);
  });

  it("escada usa as regras reais do catálogo para cada perfil", async () => {
    const d = await dadosDaCaptacao(ctx.db);
    expect([d.regras.criador.primeiraBps, d.regras.criador.recorrenteBps, d.regras.agencia.recorrenteBps]).toEqual([5000, 2000, 2500]);
    expect(escadaDoPerfil(d.regras.agencia, "AGENCY", 14_700).map((n) => n.recBps)).toEqual([2500, 2700, 2900, 3200]);
    expect(d.planos.length).toBeGreaterThan(0);
  });

  it("candidatura entra no funil como Candidato, com a qualificação; agência vira pedido de agência", async () => {
    const u = await registerPartner(ctx.db, { name: "Agência Brás Digital", email: "agencia@exemplo.com", password: "senha-forte-1", taxId: "52998224725", phone: "11999990000", acceptTerms: true });
    await registrarCandidatura(ctx.db, u.partnerId, { perfil: "agencia", region: "São Paulo - Brás", channels: "@agenciabras", carteira: 12 });
    const c = (await cartoesDeParceiros(ctx.db, ctx.actors.master)).find((x) => x.id === u.partnerId)!;
    expect([c.etapa, c.regiao]).toEqual(["CANDIDATO", "São Paulo - Brás"]);
    const p = (await ctx.db.query.partners.findFirst({ where: eq(partners.id, u.partnerId) }))!;
    expect(p.agencyRequestedAt).not.toBeNull();
    expect(p.agencyInfo).toContain("12 clientes");
    const notas = await ctx.db.select().from(partnerActivities).where(eq(partnerActivities.partnerId, u.partnerId));
    expect(notas[0]!.text).toContain("Candidatura: sou agência");
    await expect(registrarCandidatura(ctx.db, u.partnerId, { perfil: "criador", region: "" })).rejects.toThrow();
  });
});
