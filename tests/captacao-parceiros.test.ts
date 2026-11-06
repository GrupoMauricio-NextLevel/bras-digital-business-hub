import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { partnerActivities, partners } from "@/db/schema";
import { registerPartner } from "@/lib/domain/partners";
import { cartoesDeParceiros } from "@/lib/domain/crm-parceiros";
import { dadosDaCaptacao, escadaDoPerfil, ganhoNoMes, registrarCandidatura } from "@/lib/domain/captacao-parceiros";
import { BARREIRA_CNPJ, comparativoDeParceiros, PROGRAMAS_CONCORRENTES, RAIO_X_CONCORRENTES, SHOPIFY_BR_CENTS } from "@/lib/finance/captacao-regras";

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

  it("comparativo (D262): Shopify em destaque, Nuvemshop pelo programa que mais paga, Tray a 20%, WBuy; virada", () => {
    const r = { primeiraBps: 2000, recorrenteBps: 2000, meses: 600 };
    const c = comparativoDeParceiros(r, 2, 14_700, 24);
    const por = (id: string) => c.find((x) => x.id === id)!;
    expect(c.map((x) => x.id)).toEqual(["nextlevel", "shopify", "nuvemshop", "tray", "wbuy"]);
    expect(por("nextlevel").total).toBe(2_366_112);
    expect(SHOPIFY_BR_CENTS).toBe(13_655); // US$ 25 × PTAX 5,4621
    expect(por("shopify").total).toBe(2 * 24 * 13_655);
    expect([por("nuvemshop").programa, por("nuvemshop").total]).toEqual(["Especialistas", 1_764_000]);
    expect(por("tray").total).toBe(1_764_000);
    expect(por("wbuy").total).toBe(882_000);
    for (const x of c.slice(1)) expect(por("nextlevel").total).toBeGreaterThan(x.total);
    // 5 lojas/mês em 12 meses: o Associados (2 mensalidades de uma vez) sai na frente, e a página mostra a virada.
    const c12 = comparativoDeParceiros(r, 5, 14_700, 12);
    const nuvem = c12.find((x) => x.id === "nuvemshop")!;
    expect(nuvem.programa).toBe("Associados");
    expect(nuvem.total).toBeGreaterThan(c12[0]!.total);
    expect(nuvem.virada).toBeGreaterThan(12);
    expect(comparativoDeParceiros(r, 5, 14_700, nuvem.virada!)[0]!.total).toBeGreaterThanOrEqual(comparativoDeParceiros(r, 5, 14_700, nuvem.virada!).find((x) => x.id === "nuvemshop")!.total);
    for (const p of PROGRAMAS_CONCORRENTES) expect(p.fonte).toMatch(/^https:\/\//);
    expect(PROGRAMAS_CONCORRENTES.some((p) => /loja integrada/i.test(p.nome))).toBe(false); // fora, por escolha do dono
    // D261: todo ponto fraco exposto tem fato e fonte oficial; nunca "mais barato".
    for (const g of RAIO_X_CONCORRENTES) { expect(g.fonte).toMatch(/^https:\/\/(www\.|atendimento\.|help\.)?(nuvemshop|wbuy|tray|shopify)\.com(\.br)?\//); expect(g.fato.length).toBeGreaterThan(30); expect(`${g.golpe} ${g.fato} ${g.resposta}`).not.toMatch(/mais barat/i); }
    for (const b of BARREIRA_CNPJ) expect(b.fonte).toMatch(/^https:\/\//);
  });

  it("escada usa a regra única do catálogo, igual para todos os perfis", async () => {
    const d = await dadosDaCaptacao(ctx.db);
    for (const k of ["criador", "vendedor", "agencia"] as const) expect([d.regras[k].primeiraBps, d.regras[k].recorrenteBps]).toEqual([2000, 2000]);
    expect(escadaDoPerfil(d.regras.agencia, 14_700).map((n) => n.recBps)).toEqual([2000, 2400, 2800]);
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
