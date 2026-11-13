import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { aceitesTermos, emailOutbox, stores, users } from "@/db/schema";
import type { Actor } from "@/lib/domain/access";
import { signupMember } from "@/lib/domain/store-access";
import { aceitarTermos, aceitesDoMaster, precisaAceitarTermos } from "@/lib/domain/termos-plataforma";
import { HASH_TERMOS, SECOES_TERMOS, VERSAO_TERMOS } from "@/lib/contratos/termos-plataforma";
import { impressaoDigital } from "@/lib/contratos/loja-pronta-express";

describe("termos de uso da plataforma (D279)", () => {
  let ctx: Awaited<ReturnType<typeof freshDb>>;
  beforeEach(async () => { ctx = await freshDb(); });
  const AGORA = new Date("2026-11-10T20:00:00Z");
  async function dono(email: string, taxId: string): Promise<Actor> {
    const r = await signupMember(ctx.db, { storeName: `Loja ${email}`, ownerName: "Dono da Loja", email, password: "senha-segura-1", taxId, offer: "STORE_SUBDOMAIN", brand: "NEXTLEVEL_COMMERCE", independent: true } as never);
    const s = (await ctx.db.query.stores.findFirst({ where: eq(stores.id, r.storeId) }))!;
    const u = (await ctx.db.query.users.findFirst({ where: eq(users.email, email) }))!;
    return { userId: u.id, role: "STORE_OWNER", organizationId: s.organizationId, supplierId: null, storeId: r.storeId, storeRole: "OWNER" };
  }

  it("texto estável: a impressão digital confere com o texto e não tem promessa de ganho", () => {
    expect(impressaoDigital({ versao: VERSAO_TERMOS, titulo: "Termos de uso da plataforma NextLevel Commerce" }, SECOES_TERMOS)).toBe(HASH_TERMOS);
    const texto = JSON.stringify(SECOES_TERMOS);
    expect(texto).toMatch(/não são promessa de vendas/);
    expect(texto).toMatch(/sem multa/);
    expect(texto).not.toMatch(/R\$\s?\d/); // preço não fica no contrato: vem da página de planos
  });

  it("dono novo precisa aceitar antes de usar; aceite com prova, uma vez, e o Master vê", async () => {
    const a = await dono("a@loja.teste", "529.982.247-25");
    const b = await dono("b@loja.teste", "111.444.777-35");
    expect(await precisaAceitarTermos(ctx.db, a)).toBe(true);
    expect(await precisaAceitarTermos(ctx.db, a, { contaDemo: true })).toBe(false);
    expect(await precisaAceitarTermos(ctx.db, { ...a, storeRole: "STAFF" })).toBe(false); // equipe não aceita: quem contrata é o dono
    await expect(aceitarTermos(ctx.db, { ...a, storeRole: "STAFF" }, { concordo: true, hashVisto: HASH_TERMOS, nome: "Equipe" }, { ip: null, aparelho: null }, AGORA)).rejects.toThrow(/dono/);
    await expect(aceitarTermos(ctx.db, a, { concordo: false as true, hashVisto: HASH_TERMOS, nome: "Dono da Loja" }, { ip: null, aparelho: null }, AGORA)).rejects.toThrow(/Li e concordo/);
    await expect(aceitarTermos(ctx.db, a, { concordo: true, hashVisto: "0".repeat(64), nome: "Dono da Loja" }, { ip: null, aparelho: null }, AGORA)).rejects.toThrow(/atualizados/);

    expect(await aceitarTermos(ctx.db, a, { concordo: true, hashVisto: HASH_TERMOS, nome: "Dono da Loja" }, { ip: "200.1.2.3", aparelho: "Celular" }, AGORA)).toEqual({ jaAceito: false });
    expect(await aceitarTermos(ctx.db, a, { concordo: true, hashVisto: HASH_TERMOS, nome: "Dono da Loja" }, { ip: null, aparelho: null }, AGORA)).toEqual({ jaAceito: true });
    expect(await precisaAceitarTermos(ctx.db, a)).toBe(false);
    expect(await precisaAceitarTermos(ctx.db, b)).toBe(true); // o aceite de uma loja não vale para outra
    const reg = await ctx.db.select().from(aceitesTermos);
    expect(reg).toHaveLength(1);
    expect(reg[0]).toMatchObject({ userId: a.userId, storeId: a.storeId, versao: VERSAO_TERMOS, hash: HASH_TERMOS, ip: "200.1.2.3", aparelho: "Celular", nome: "Dono da Loja" });
    expect((await ctx.db.select().from(emailOutbox).where(eq(emailOutbox.kind, "TERMOS_ACEITOS"))).map((e) => e.toEmail)).toEqual(["a@loja.teste"]);

    const lista = await aceitesDoMaster(ctx.db, ctx.actors.master);
    expect(lista.find((l) => l.userId === a.userId)!.aceite).not.toBeNull();
    expect(lista.find((l) => l.userId === b.userId)!.aceite).toBeNull();
    await expect(aceitesDoMaster(ctx.db, a)).rejects.toThrow();
  });
});
