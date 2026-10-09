import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { auditLog, organizations, users } from "@/db/schema";
import type { Actor } from "@/lib/domain/access";
import { brasCommercialAccessFor, formatCnpj, getBrasMemberByUser, isValidCnpj, listBrasMembers, setBrasMemberStatus, signupBrasMember } from "@/lib/domain/bras/membros";
import { canViewBrasCommercialData, projectBrasCommercial } from "@/lib/bras/access";
import { verifyPassword } from "@/lib/security/password";
import { NAV } from "@/lib/nav";

/** D92: membro comprador da Brás com cadastro grátis por CNPJ, liberado na hora; o Master pode bloquear. */
let ctx: Awaited<ReturnType<typeof freshDb>>;
const CNPJ = "11.222.333/0001-81"; // válido (dígitos verificadores)
const base = { name: "Ana Lojista", companyName: "Ana Utilidades LTDA", cnpj: CNPJ, whatsapp: "(11) 98888-7777", email: "ana@utilidades.teste", password: "senha-forte-1", acceptTerms: true as const };

beforeEach(async () => { ctx = await freshDb(); });

describe("CNPJ", () => {
  it("confere os dígitos verificadores e recusa sequências repetidas", () => {
    expect(isValidCnpj(CNPJ)).toBe(true);
    expect(isValidCnpj("11222333000181")).toBe(true);
    expect(isValidCnpj("11.222.333/0001-82")).toBe(false);
    expect(isValidCnpj("00.000.000/0000-00")).toBe(false);
    expect(isValidCnpj("1122233300018")).toBe(false);
    expect(formatCnpj("11222333000181")).toBe(CNPJ);
  });
});

describe("cadastro do membro Brás", () => {
  it("cria empresa da marca Brás, usuário membro com senha e libera na hora", async () => {
    const r = await signupBrasMember(ctx.db, base);
    const user = (await ctx.db.query.users.findFirst({ where: eq(users.id, r.userId) }))!;
    expect(user.role).toBe("BRAS_MEMBER");
    expect(user.email).toBe("ana@utilidades.teste");
    expect(verifyPassword("senha-forte-1", user.passwordHash)).toBe(true);
    const org = (await ctx.db.query.organizations.findFirst({ where: eq(organizations.id, user.organizationId) }))!;
    expect(org.brand).toBe("BRAS_DIGITAL");
    const m = (await getBrasMemberByUser(ctx.db, r.userId))!;
    expect(m.cnpj).toBe("11222333000181");
    expect(m.whatsapp).toBe("11988887777");
    expect(m.status).toBe("ACTIVE");
    expect(NAV[user.role].base).toBe("/meu-bras");
  });

  it("um cadastro por CNPJ e por e-mail; CNPJ inválido não entra", async () => {
    await signupBrasMember(ctx.db, base);
    await expect(signupBrasMember(ctx.db, { ...base, email: "outra@teste.com" })).rejects.toMatchObject({ code: "CNPJ_TAKEN" });
    await expect(signupBrasMember(ctx.db, { ...base, cnpj: "11444777000161", email: "ANA@utilidades.teste" })).rejects.toMatchObject({ code: "EMAIL_TAKEN" });
    await expect(signupBrasMember(ctx.db, { ...base, cnpj: "11.222.333/0001-00", email: "x@teste.com" })).rejects.toThrow(/CNPJ inválido/);
    await expect(signupBrasMember(ctx.db, { ...base, cnpj: "11444777000161", email: "y@teste.com", whatsapp: "123" })).rejects.toThrow(/WhatsApp/);
  });
});

describe("acesso a preço e estoque vem do banco", () => {
  it("membro ativo vê; bloqueado, visitante e outros papéis não", async () => {
    const r = await signupBrasMember(ctx.db, base);
    const sess = { user: { id: r.userId, role: "BRAS_MEMBER" } };
    expect(canViewBrasCommercialData(await brasCommercialAccessFor(ctx.db, sess))).toBe(true);
    expect(await brasCommercialAccessFor(ctx.db, null)).toEqual({ authenticated: false, approvedMember: false });
    // Um lojista do SuperDrop logado não vira membro da Brás.
    expect(canViewBrasCommercialData(await brasCommercialAccessFor(ctx.db, { user: { id: ctx.actors.mantos.userId, role: "STORE_OWNER" } }))).toBe(false);
    // Papel forjado sem registro de membro: não vê.
    expect(canViewBrasCommercialData(await brasCommercialAccessFor(ctx.db, { user: { id: ctx.actors.arena.userId, role: "BRAS_MEMBER" } }))).toBe(false);

    const m = (await getBrasMemberByUser(ctx.db, r.userId))!;
    await setBrasMemberStatus(ctx.db, ctx.actors.master, m.id, "BLOCKED", "Concorrente");
    const bloqueado = await brasCommercialAccessFor(ctx.db, sess);
    expect(canViewBrasCommercialData(bloqueado)).toBe(false);
    expect(projectBrasCommercial({ id: "p1", title: "Caixa", priceCents: 48000, importerName: "X" }, bloqueado)).toEqual({ id: "p1", title: "Caixa", locked: true });
  });

  it("só o Master lista e bloqueia; bloqueio exige motivo e fica na auditoria", async () => {
    const r = await signupBrasMember(ctx.db, base);
    const m = (await getBrasMemberByUser(ctx.db, r.userId))!;
    const member: Actor = { userId: r.userId, role: "BRAS_MEMBER", organizationId: m.organizationId, supplierId: null, storeId: null };
    for (const a of [ctx.actors.supplier, ctx.actors.mantos, member]) {
      await expect(listBrasMembers(ctx.db, a)).rejects.toThrow();
      await expect(setBrasMemberStatus(ctx.db, a, m.id, "BLOCKED", "x")).rejects.toThrow();
    }
    await expect(setBrasMemberStatus(ctx.db, ctx.actors.master, m.id, "BLOCKED", " ")).rejects.toMatchObject({ code: "REASON" });
    await setBrasMemberStatus(ctx.db, ctx.actors.master, m.id, "BLOCKED", "Importadora se passando por lojista");
    expect((await listBrasMembers(ctx.db, ctx.actors.master))[0]).toMatchObject({ status: "BLOCKED", blockedReason: "Importadora se passando por lojista", email: "ana@utilidades.teste" });
    await setBrasMemberStatus(ctx.db, ctx.actors.master, m.id, "ACTIVE");
    expect((await getBrasMemberByUser(ctx.db, r.userId))!).toMatchObject({ status: "ACTIVE", blockedReason: null, blockedAt: null });
    const trilha = await ctx.db.select().from(auditLog).where(eq(auditLog.entityId, m.id));
    expect(trilha.map((t) => t.action).sort()).toEqual(["BRAS_MEMBER_ACTIVATED", "BRAS_MEMBER_BLOCKED"]);
    // A trilha guarda o status, nunca o motivo nem contato do membro.
    expect(JSON.stringify(trilha)).not.toContain("Importadora se passando");
    expect(JSON.stringify(trilha)).not.toContain("ana@utilidades.teste");
  });
});
