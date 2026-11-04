import { beforeEach, describe, expect, it } from "vitest";
import { freshDb } from "./setup";
import { platformSettings } from "@/db/schema";
import { encryptSecret } from "@/lib/security/crypto";
import { getIaConfig } from "@/lib/domain/ia";
import { fonteDeIa, registrarUsoIa, removerChaveDaLoja, salvarChaveDaLoja, situacaoIa } from "@/lib/domain/ia-por-plano";
import { signupMember } from "@/lib/domain/store-access";

/** IA por plano (D243): cota paga pela NextLevel, chave própria do lojista, chat da loja só Pro/Scale ou com chave. */
describe("IA por plano", () => {
  let ctx: Awaited<ReturnType<typeof freshDb>>;
  const AGORA = new Date("2026-11-15T12:00:00Z");
  beforeEach(async () => {
    ctx = await freshDb();
    await ctx.db.insert(platformSettings).values({ key: "ia", value: { usoReal: true, chaveEnc: encryptSecret("sk-nextlevel-teste-0000000000"), testeOk: true, cotas: { COMMERCE_START: 3, COMMERCE_PRO: 200, COMMERCE_SCALE: 1000 } } }).onConflictDoUpdate({ target: platformSettings.key, set: { value: { usoReal: true, chaveEnc: encryptSecret("sk-nextlevel-teste-0000000000"), testeOk: true, cotas: { COMMERCE_START: 3, COMMERCE_PRO: 200, COMMERCE_SCALE: 1000 } } } });
  });
  const loja = (plan: "COMMERCE_START" | "COMMERCE_PRO", n: number) => signupMember(ctx.db, { storeName: `IA ${n}`, ownerName: "Ana Lima", email: `ia${n}@loja.com`, password: "senha-segura-1", taxId: n === 1 ? "529.982.247-25" : "111.444.777-35", brand: "NEXTLEVEL_COMMERCE", independent: true, plan, cycle: "MONTHLY" } as never, AGORA);

  it("cotas de fábrica antigas viram 40/350/1.200", async () => {
    expect((await getIaConfig(ctx.db)).cotas).toMatchObject({ COMMERCE_START: 40, COMMERCE_PRO: 350, COMMERCE_SCALE: 1200 });
  });
  it("Start: painel pela cota; chat da loja só com a chave do lojista", async () => {
    const { storeId } = await loja("COMMERCE_START", 1);
    expect((await fonteDeIa(ctx.db, storeId, "painel", AGORA))?.origem).toBe("plano");
    expect(await fonteDeIa(ctx.db, storeId, "chat-loja", AGORA)).toBeNull();
    expect((await situacaoIa(ctx.db, storeId, AGORA)).iaNoChat).toBe("regras");
    const ok = (async () => new Response("{}", { status: 200 })) as never;
    await salvarChaveDaLoja(ctx.db, storeId, "sk-loja-propria-1234567890abcd", ok);
    const f = await fonteDeIa(ctx.db, storeId, "chat-loja", AGORA);
    expect(f).toMatchObject({ origem: "loja", chave: "sk-loja-propria-1234567890abcd" });
    await registrarUsoIa(ctx.db, storeId, f!, AGORA);
    expect((await situacaoIa(ctx.db, storeId, AGORA)).usados).toBe(0); // chave própria não gasta a cota
    await expect(salvarChaveDaLoja(ctx.db, storeId, "sk-recusada-1234567890abcdef", (async () => new Response("{}", { status: 401 })) as never)).rejects.toThrow(/não aceitou/);
    await removerChaveDaLoja(ctx.db, storeId);
    expect((await situacaoIa(ctx.db, storeId, AGORA)).chaveLoja).toBeNull();
  });
  it("Pro: chat pela cota; acabou a cota, volta às regras (sem chave) e o aviso acende aos 80%", async () => {
    const { storeId } = await loja("COMMERCE_PRO", 2);
    const f = (await fonteDeIa(ctx.db, storeId, "chat-loja", AGORA))!;
    expect(f.origem).toBe("plano");
    await ctx.db.insert(platformSettings).values({ key: `ia.uso.${storeId}.2026-11`, value: { usos: 280 } });
    expect((await situacaoIa(ctx.db, storeId, AGORA)).alerta).toBe(true);
    await ctx.db.insert(platformSettings).values({ key: `ia.uso.${storeId}.2026-11`, value: { usos: 349 } }).onConflictDoUpdate({ target: platformSettings.key, set: { value: { usos: 349 } } });
    await registrarUsoIa(ctx.db, storeId, f, AGORA);
    const s = await situacaoIa(ctx.db, storeId, AGORA);
    expect([s.usados, s.restantes, s.iaNoChat]).toEqual([350, 0, "regras"]);
    expect(await fonteDeIa(ctx.db, storeId, "painel", AGORA)).toBeNull();
    expect((await situacaoIa(ctx.db, storeId, new Date("2026-12-02T12:00:00Z"))).usados).toBe(0); // mês novo
  });
});
