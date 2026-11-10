import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { contratos, emailOutbox, stores, users } from "@/db/schema";
import type { Actor } from "@/lib/domain/access";
import { signupMember } from "@/lib/domain/store-access";
import { createMasterMember } from "@/lib/domain/equipe-master";
import { aceitarContrato, cancelarContrato, contratosDaLoja, contratosPendentes, enviarContratoLojaPronta, verContrato } from "@/lib/domain/contratos";
import { gerarPdfContrato } from "@/lib/contratos/pdf";
import { conferirDados, impressaoDigital, jsonEstavel, montarSecoes, type DadosLojaPronta } from "@/lib/contratos/loja-pronta-express";

const BASE: DadosLojaPronta = {
  contratada: { razao: "NextLevel Marketing Ltda - ME", cnpj: "51.392.006/0001-92", banco: "Itaú", chavePix: "51.392.006/0001-92", favorecido: "NextLevel Marketing Ltda", representante: "Fulano", emailRepresentante: "agencia@nl.teste" },
  cliente: { nome: "Cliente Teste", documento: "529.982.247-25", email: "cliente@loja.teste" },
  loja: { nome: "Loja Teste", slug: "loja-teste" },
  valorCheioCents: 300_000, valorCents: 150_000, sinalCents: 50_000, dataSinal: "2026-11-10", restanteCents: 100_000, dataRestante: "2026-11-16",
  produtos: 40, prazoDias: 5, cortesiaMeses: 3,
};

describe("contrato Loja Pronta Express (puro)", () => {
  it("confere a conta e as datas", () => {
    expect(conferirDados(BASE)).toEqual([]);
    expect(conferirDados({ ...BASE, restanteCents: 90_000 }).join()).toMatch(/somar/);
    expect(conferirDados({ ...BASE, dataRestante: "2026-11-09" }).join()).toMatch(/antes/);
  });
  it("texto com os números certos, cortesia numerada e impressão digital estável", () => {
    const s = montarSecoes(BASE);
    const texto = JSON.stringify(s);
    expect(texto).toContain("Cadastro inicial de 40 produtos");
    expect(texto).toContain("5 (cinco) dias corridos");
    expect(texto).toContain("R$ 500,00");
    expect(texto).toContain("Cláusula 2 · Cortesia");
    expect(texto).toContain("Cláusula 9 · Foro");
    expect(JSON.stringify(montarSecoes({ ...BASE, cortesiaMeses: 0 }))).toContain("Cláusula 8 · Foro");
    // a ordem das chaves não muda a impressão digital (o banco reordena o jsonb)
    const invertido = Object.fromEntries(Object.entries(BASE).reverse());
    expect(impressaoDigital(invertido, s)).toBe(impressaoDigital(BASE, s));
    expect(jsonEstavel({ b: 1, a: [2, { d: 1, c: 2 }] })).toBe('{"a":[2,{"c":2,"d":1}],"b":1}');
  });
});

describe("contrato no banco (CT1+CT2)", () => {
  let ctx: Awaited<ReturnType<typeof freshDb>>;
  beforeEach(async () => { ctx = await freshDb(); const { ensureCatalogSeed } = await import("@/lib/domain/nl-catalog"); await ensureCatalogSeed(ctx.db); });
  const AGORA = new Date("2026-11-10T15:00:00Z");

  async function loja(nome: string, email: string, taxId: string): Promise<{ storeId: string; dono: Actor }> {
    const r = await signupMember(ctx.db, { storeName: nome, ownerName: "Dono da Loja", email, password: "senha-segura-1", taxId, offer: "STORE_SUBDOMAIN", brand: "NEXTLEVEL_COMMERCE", independent: true } as never);
    const s = (await ctx.db.query.stores.findFirst({ where: eq(stores.id, r.storeId) }))!;
    const u = (await ctx.db.query.users.findFirst({ where: eq(users.email, email) }))!;
    return { storeId: r.storeId, dono: { userId: u.id, role: "STORE_OWNER", organizationId: s.organizationId, supplierId: null, storeId: r.storeId, storeRole: "OWNER" } };
  }
  const entrada = (storeId: string) => ({ storeId, cliente: BASE.cliente, valorCheioCents: 300_000, valorCents: 150_000, sinalCents: 50_000, dataSinal: "2026-11-10", restanteCents: 100_000, dataRestante: "2026-11-16", produtos: 40, prazoDias: 5, cortesiaMeses: 3 });

  it("Master envia (com número, e-mail e cortesia de 3 meses); só o dono aceita, uma vez, com prova", async () => {
    const a = await loja("Vestiário Teste", "a@loja.teste", "529.982.247-25");
    const b = await loja("Outra Loja", "b@loja.teste", "111.444.777-35");
    const antes = (await ctx.db.query.stores.findFirst({ where: eq(stores.id, a.storeId) }))!;

    // quem não pode enviar
    const com = await createMasterMember(ctx.db, ctx.actors.master, { name: "Comercial", email: "com@nl.teste", password: "provisoria-123", masterFunction: "COMERCIAL" });
    await expect(enviarContratoLojaPronta(ctx.db, { ...ctx.actors.master, userId: com.id, masterFunction: "COMERCIAL" }, entrada(a.storeId), AGORA)).rejects.toThrow(/dono e o Financeiro/);
    await expect(enviarContratoLojaPronta(ctx.db, a.dono, entrada(a.storeId), AGORA)).rejects.toThrow();
    await expect(enviarContratoLojaPronta(ctx.db, ctx.actors.master, { ...entrada(a.storeId), restanteCents: 1 }, AGORA)).rejects.toThrow(/somar/);

    const env = await enviarContratoLojaPronta(ctx.db, ctx.actors.master, entrada(a.storeId), AGORA);
    expect(env.numero).toBe("LPX-20261110-01");
    expect((await enviarContratoLojaPronta(ctx.db, ctx.actors.master, entrada(b.storeId), AGORA)).numero).toBe("LPX-20261110-02");
    const depois = (await ctx.db.query.stores.findFirst({ where: eq(stores.id, a.storeId) }))!;
    const base = Math.max(AGORA.getTime(), antes.paidUntil ? new Date(antes.paidUntil).getTime() : 0, antes.trialEndsAt ? new Date(antes.trialEndsAt).getTime() : 0);
    expect(new Date(depois.paidUntil!).getTime()).toBe(base + 90 * 86_400_000);
    const mails = await ctx.db.select().from(emailOutbox).where(eq(emailOutbox.kind, "CONTRATO_ENVIADO"));
    expect(mails.length).toBe(2);
    expect(mails[0]!.body).toMatch(/merchant\/contratos\//);

    // isolamento: a loja B não vê nem aceita o contrato da A; a equipe da loja A também não
    expect((await contratosPendentes(ctx.db, a.dono)).map((c) => c.numero)).toEqual(["LPX-20261110-01"]);
    await expect(verContrato(ctx.db, b.dono, env.id)).rejects.toThrow();
    await expect(aceitarContrato(ctx.db, b.dono, env.id, { concordo: true, hashVisto: env.hash, nome: "Intruso" }, { ip: null, aparelho: null }, AGORA)).rejects.toThrow(/não encontrado/);
    await expect(contratosDaLoja(ctx.db, { ...a.dono, storeRole: "STAFF" })).rejects.toThrow(/dono da loja/);
    expect((await verContrato(ctx.db, ctx.actors.master, env.id)).numero).toBe(env.numero);

    // aceite: precisa do "Li e concordo" e do mesmo texto que viu
    await expect(aceitarContrato(ctx.db, a.dono, env.id, { concordo: false as true, hashVisto: env.hash, nome: "Cliente Teste" }, { ip: null, aparelho: null }, AGORA)).rejects.toThrow(/Li e concordo/);
    await expect(aceitarContrato(ctx.db, a.dono, env.id, { concordo: true, hashVisto: "0".repeat(64), nome: "Cliente Teste" }, { ip: null, aparelho: null }, AGORA)).rejects.toThrow(/mudou/);
    await aceitarContrato(ctx.db, a.dono, env.id, { concordo: true, hashVisto: env.hash, nome: "Cliente Teste" }, { ip: "200.1.2.3", aparelho: "Celular de teste" }, AGORA);
    const c = (await ctx.db.query.contratos.findFirst({ where: eq(contratos.id, env.id) }))!;
    expect(c).toMatchObject({ status: "ACEITO", aceitoNome: "Cliente Teste", aceitoIp: "200.1.2.3", aceitoAparelho: "Celular de teste", aceitoHash: env.hash, aceitoPor: a.dono.userId });
    expect(impressaoDigital(c.dados, c.conteudo.secoes)).toBe(c.hash); // conferível depois, no banco
    await expect(aceitarContrato(ctx.db, a.dono, env.id, { concordo: true, hashVisto: env.hash, nome: "Cliente Teste" }, { ip: null, aparelho: null }, AGORA)).rejects.toThrow(/já foi aceito/);
    expect(await contratosPendentes(ctx.db, a.dono)).toEqual([]);
    expect((await contratosDaLoja(ctx.db, a.dono))[0]!.status).toBe("ACEITO");
    expect((await ctx.db.select().from(emailOutbox).where(eq(emailOutbox.kind, "CONTRATO_ACEITO"))).length).toBe(1);
    expect((await ctx.db.select().from(emailOutbox).where(eq(emailOutbox.kind, "CONTRATO_ACEITO_CLIENTE")))[0]!.toEmail).toBe(BASE.cliente.email);
    const pdf = await gerarPdfContrato({ numero: c.numero, titulo: c.titulo, hash: c.hash, dados: c.dados as unknown as DadosLojaPronta, secoes: c.conteudo.secoes, enviadoEm: c.enviadoEm, aceitoEm: c.aceitoEm, aceitoNome: c.aceitoNome, aceitoIp: c.aceitoIp, aceitoAparelho: c.aceitoAparelho });
    expect(Buffer.from(pdf).subarray(0, 5).toString()).toBe("%PDF-");
    expect(pdf.length).toBeGreaterThan(3000);

    // cancelar: só o que não foi aceito
    await expect(cancelarContrato(ctx.db, ctx.actors.master, env.id, AGORA)).rejects.toThrow(/não foi aceito/);
  });
});
