import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { partnerActivities, partners } from "@/db/schema";
import { registerPartner } from "@/lib/domain/partners";
import { cartoesDeParceiros } from "@/lib/domain/crm-parceiros";
import { dadosDaCaptacao, escadaDoPerfil, ganhoNoMes, registrarCandidatura } from "@/lib/domain/captacao-parceiros";
import { BARREIRAS, MESES_DA_DISPUTA, comparativoDeParceiros, PROGRAMAS_CONCORRENTES, RAIO_X_CONCORRENTES, SHOPIFY_BR_CENTS } from "@/lib/finance/captacao-regras";

/** Página de captação de parceiros (D252, PV4; regra única da D260). */
describe("captação de parceiros", () => {
  let ctx: Awaited<ReturnType<typeof freshDb>>;
  beforeEach(async () => { ctx = await freshDb(); });

  it("simulador (D260): toda mensalidade paga o % do nível; o nível sobe com a carteira; sem bônus", () => {
    const r = { primeiraBps: 2000, recorrenteBps: 2000, meses: 600 };
    expect(ganhoNoMes(r, 3, 14_700, 1)).toMatchObject({ cents: Math.round(3 * 14_700 * 0.2), tier: "INICIAL", carteira: 3 });
    // mês 4: 12 clientes = Prata (24%) na carteira toda; mês 9: 27 clientes = Ouro (28%)
    expect(ganhoNoMes(r, 3, 14_700, 4)).toMatchObject({ cents: Math.round(12 * 14_700 * 0.24), tier: "PRATA", recBps: 2400 });
    expect(ganhoNoMes(r, 3, 14_700, 9)).toMatchObject({ cents: Math.round(27 * 14_700 * 0.28), tier: "OURO", recBps: 2800 });
    expect(ganhoNoMes(r, 30, 14_700, 24).recBps).toBe(2800); // teto 28%
  });

  it("comparativo (D263): cada trilha contra o programa equivalente, pela renda do mês; nós na frente nos meses mostrados", () => {
    const r = { primeiraBps: 2000, recorrenteBps: 2000, meses: 600 };
    expect(comparativoDeParceiros(r, 2, 14_700, 12, "cpf").map((x) => x.id)).toEqual(["nextlevel", "shopify", "nuvem-associados"]);
    expect(comparativoDeParceiros(r, 2, 14_700, 12, "cnpj").map((x) => x.id)).toEqual(["nextlevel", "nuvem-especialistas", "tray", "wbuy"]);
    expect(SHOPIFY_BR_CENTS).toBe(13_655); // US$ 25 × PTAX 5,4621
    // Varre 1 a 30 lojas/mês, os 3 planos e os meses que a página mostra: nunca perdemos.
    for (const t of ["cpf", "cnpj"] as const) for (const porMes of [1, 2, 3, 5, 10, 20, 30]) for (const mensal of [5_700, 14_700, 34_700]) for (const mes of MESES_DA_DISPUTA) {
      const c = comparativoDeParceiros(r, porMes, mensal, mes, t);
      for (const x of c.slice(1)) expect(c[0]!.porMesCents, `${t} ${porMes} ${mensal} ${mes} ${x.id}`).toBeGreaterThan(x.porMesCents);
    }
    expect(comparativoDeParceiros(r, 1, 14_700, 12, "cpf")[0]!.porMesCents).toBe(Math.round(12 * 14_700 * 0.19));
    for (const p of PROGRAMAS_CONCORRENTES) expect(p.fonte).toMatch(/^https:\/\//);
    expect(PROGRAMAS_CONCORRENTES.some((p) => /loja integrada/i.test(p.nome))).toBe(false); // fora, por escolha do dono
    for (const g of RAIO_X_CONCORRENTES) { expect(g.fonte).toMatch(/^https:\/\/(www\.|atendimento\.|help\.)?(nuvemshop|wbuy|tray|shopify)\.com(\.br)?\//); expect(g.fato.length).toBeGreaterThan(30); expect(`${g.golpe} ${g.fato} ${g.resposta}`).not.toMatch(/mais barat/i); }
    for (const b of BARREIRAS) expect(b.fonte).toMatch(/^https:\/\//);
  });

  it("escada usa a regra única do catálogo, igual para todos os perfis", async () => {
    const d = await dadosDaCaptacao(ctx.db);
    for (const k of ["indicacao", "criador", "vendedor", "agencia"] as const) expect([d.regras[k].primeiraBps, d.regras[k].recorrenteBps]).toEqual([2000, 2000]);
    expect(escadaDoPerfil(d.regras.agencia, 14_700).map((n) => n.recBps)).toEqual([2000, 2400, 2800]);
    expect(escadaDoPerfil(d.regras.indicacao, 14_700, true).map((n) => n.recBps)).toEqual([1500, 1900, 2300]);
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
