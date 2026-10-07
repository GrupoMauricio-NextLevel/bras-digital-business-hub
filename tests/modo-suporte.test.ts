import { beforeAll, describe, expect, it } from "vitest";
import { eq, inArray } from "drizzle-orm";
import { freshDb } from "./setup";
import { auditLog, users } from "@/db/schema";
import { checkSupport, enableSupportActing, endSupport, listClients, listSupportHistory, startSupport, SUPPORT_TOKEN_PURPOSE, SUPPORT_TTL_MS, type SupportGrant } from "@/lib/domain/support";
import { listAudit } from "@/lib/domain/audit";
import { signSession, signToken, verifySession, verifyToken } from "@/lib/security/crypto";
import { DomainError, ForbiddenError } from "@/lib/domain/errors";

let ctx: Awaited<ReturnType<typeof freshDb>>;
beforeAll(async () => { ctx = await freshDb(); }, 120_000);

describe("modo suporte: assinatura", () => {
  it("permissão assinada não pode ser forjada nem reaproveitada como sessão", () => {
    const g: SupportGrant = { op: "m1", target: "u1", reason: "Conferir pedido", act: false, back: "/master/clientes", exp: Date.now() + 60_000 };
    const tok = signToken(SUPPORT_TOKEN_PURPOSE, g);
    expect(verifyToken<SupportGrant>(SUPPORT_TOKEN_PURPOSE, tok)?.target).toBe("u1");
    // trocar o conteúdo invalida a assinatura
    const [, sig] = tok.split(".");
    const forged = Buffer.from(JSON.stringify({ ...g, act: true, op: "outro" })).toString("base64url") + "." + sig;
    expect(verifyToken(SUPPORT_TOKEN_PURPOSE, forged)).toBeNull();
    // propósito diferente não vale, e a sessão não vale como permissão (nem o contrário)
    expect(verifyToken("outro-proposito", tok)).toBeNull();
    expect(verifyToken(SUPPORT_TOKEN_PURPOSE, signSession({ uid: "u1", exp: Date.now() + 60_000 }))).toBeNull();
    expect(verifySession(tok)).toBeNull();
    // vencida não vale
    expect(verifyToken(SUPPORT_TOKEN_PURPOSE, signToken(SUPPORT_TOKEN_PURPOSE, { ...g, exp: Date.now() - 1 }))).toBeNull();
  });
});

describe("modo suporte: regras do domínio", () => {
  it("só o Master entra, com motivo, nunca em outra conta Master, e tudo fica registrado", async () => {
    const { db, actors } = ctx;
    await expect(startSupport(db, actors.mantos, { targetUserId: actors.arena.userId, reason: "Quero ver a outra loja" })).rejects.toBeInstanceOf(ForbiddenError);
    await expect(startSupport(db, actors.master, { targetUserId: actors.mantos.userId, reason: "oi" })).rejects.toBeInstanceOf(DomainError);
    await expect(startSupport(db, actors.master, { targetUserId: actors.master.userId, reason: "Conferir conta" })).rejects.toBeInstanceOf(ForbiddenError);

    const { grant, target } = await startSupport(db, actors.master, { targetUserId: actors.mantos.userId, reason: "Cliente pediu ajuda com o pedido", back: "https://site-malicioso.com" });
    expect(target.id).toBe(actors.mantos.userId);
    expect(grant.act).toBe(false);
    expect(grant.back).toBe("/master/clientes"); // volta só para caminho interno
    expect(grant.exp - Date.now()).toBeLessThanOrEqual(SUPPORT_TTL_MS);

    const active = await checkSupport(db, grant, actors.mantos.userId);
    expect(active?.operator.id).toBe(actors.master.userId);
    expect(await checkSupport(db, grant, actors.arena.userId)).toBeNull(); // permissão é só para aquele cliente
    expect(await checkSupport(db, { ...grant, exp: Date.now() - 1 }, actors.mantos.userId)).toBeNull();

    const acting = await enableSupportActing(db, active!);
    expect(acting.act).toBe(true);
    await endSupport(db, { ...active!, grant: acting });

    // o dono da loja enxerga o acesso de suporte na própria trilha
    const mine = await listAudit(db, actors.mantos);
    expect(mine.map((a) => a.action)).toEqual(expect.arrayContaining(["SUPPORT_START", "SUPPORT_ACT_ENABLED", "SUPPORT_END"]));
    const start = mine.find((a) => a.action === "SUPPORT_START")!;
    expect(start.actorUserId).toBe(actors.master.userId);
    expect(JSON.stringify(start.changes)).toContain("Cliente pediu ajuda com o pedido");
    expect((await listSupportHistory(db, actors.master)).length).toBeGreaterThanOrEqual(3);
  });

  it("operador que perde o acesso Master derruba o suporte em andamento", async () => {
    const { db, actors } = ctx;
    const { grant } = await startSupport(db, actors.master, { targetUserId: actors.arena.userId, reason: "Investigar erro" });
    await db.update(users).set({ disabledAt: new Date().toISOString() }).where(eq(users.id, actors.master.userId));
    expect(await checkSupport(db, grant, actors.arena.userId)).toBeNull();
    await db.update(users).set({ disabledAt: null }).where(eq(users.id, actors.master.userId));
  });

  it("central de clientes: só o Master lista; busca por nome, loja e papel; sem contas Master", async () => {
    const { db, actors } = ctx;
    await expect(listClients(db, actors.mantos)).rejects.toBeInstanceOf(ForbiddenError);
    const all = await listClients(db, actors.master);
    expect(all.length).toBeGreaterThan(2);
    expect(all.some((r) => r.role === ("NEXTLEVEL_MASTER" as never))).toBe(false);
    const sup = await listClients(db, actors.master, { role: "SUPPLIER_ADMIN" });
    expect(sup.length).toBeGreaterThan(0);
    expect(sup.every((r) => r.role === "SUPPLIER_ADMIN")).toBe(true);
    const mantosName = all.find((r) => r.userId === actors.mantos.userId)!.tenantName!;
    const found = await listClients(db, actors.master, { q: mantosName.slice(0, 5) });
    expect(found.some((r) => r.userId === actors.mantos.userId)).toBe(true);
    expect(JSON.stringify(all)).not.toMatch(/passwordHash|scrypt/);
    const rows = await db.select().from(auditLog).where(inArray(auditLog.action, ["SUPPORT_START"]));
    expect(rows.length).toBeGreaterThan(0);
  });
});
