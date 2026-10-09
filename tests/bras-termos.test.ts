import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { auditLog, bdMembers } from "@/db/schema";
import type { Actor } from "@/lib/domain/access";
import { BRAS_TERMS_VERSION, acceptBrasTerms, brasNeedsTermsAcceptance, cleanSource, getBrasMemberByUser, signupBrasMember } from "@/lib/domain/bras/membros";
import { addBrasVideo } from "@/lib/domain/bras/videos";

/** D99: termos e política da Brás com aceite obrigatório no cadastro, aceite posterior e origem do cadastro. */
let ctx: Awaited<ReturnType<typeof freshDb>>;
const base = { name: "Ana", companyName: "Ana Utilidades", cnpj: "11222333000181", whatsapp: "11988887777", email: "ana@u.teste", password: "senha-forte-1", acceptTerms: true as const };
const memberActor = (userId: string, organizationId: string): Actor => ({ userId, role: "BRAS_MEMBER", organizationId, supplierId: null, storeId: null });

beforeEach(async () => { ctx = await freshDb(); });

describe("aceite dos termos no cadastro", () => {
  it("sem aceite o cadastro não passa, com mensagem clara", async () => {
    await expect(signupBrasMember(ctx.db, { ...base, acceptTerms: false as unknown as true })).rejects.toThrow(/aceite os termos de uso e a política de privacidade/);
    const semCampo: Partial<typeof base> = { ...base }; delete semCampo.acceptTerms;
    await expect(signupBrasMember(ctx.db, semCampo as typeof base)).rejects.toThrow(/aceite os termos/);
    expect(await ctx.db.select().from(bdMembers)).toHaveLength(0);
  });

  it("com aceite grava a data e a versão em vigor", async () => {
    const r = await signupBrasMember(ctx.db, base);
    const m = (await getBrasMemberByUser(ctx.db, r.userId))!;
    expect(m.termsVersion).toBe(BRAS_TERMS_VERSION);
    expect(m.termsAcceptedAt).toBeTruthy();
    expect(brasNeedsTermsAcceptance(m)).toBe(false);
  });
});

describe("aceite posterior (cadastro anterior aos termos)", () => {
  it("o membro sem versão aceita uma vez; fica na auditoria; repetir não duplica", async () => {
    const r = await signupBrasMember(ctx.db, base);
    await ctx.db.update(bdMembers).set({ termsAcceptedAt: null, termsVersion: null }).where(eq(bdMembers.userId, r.userId));
    const antes = (await getBrasMemberByUser(ctx.db, r.userId))!;
    expect(brasNeedsTermsAcceptance(antes)).toBe(true);
    const actor = memberActor(r.userId, antes.organizationId);
    expect(await acceptBrasTerms(ctx.db, actor)).toEqual({ ok: true, already: false });
    expect(await acceptBrasTerms(ctx.db, actor)).toEqual({ ok: true, already: true });
    const depois = (await getBrasMemberByUser(ctx.db, r.userId))!;
    expect(depois.termsVersion).toBe(BRAS_TERMS_VERSION);
    const aud = await ctx.db.select().from(auditLog).where(eq(auditLog.action, "BRAS_TERMS_ACCEPTED"));
    expect(aud).toHaveLength(1);
  });

  it("só o próprio membro aceita: Master e lojista não", async () => {
    await expect(acceptBrasTerms(ctx.db, ctx.actors.master)).rejects.toThrow();
    await expect(acceptBrasTerms(ctx.db, ctx.actors.mantos)).rejects.toThrow();
  });

  it("sem cadastro não há o que aceitar", () => {
    expect(brasNeedsTermsAcceptance(null)).toBe(false);
  });
});

describe("origem do cadastro", () => {
  it("cadastro vindo de uma descoberta conta para ela", async () => {
    const v = await addBrasVideo(ctx.db, ctx.actors.master, { url: "dQw4w9WgXcQ", title: "Garrafa térmica" });
    const r = await signupBrasMember(ctx.db, { ...base, videoId: v.id });
    const m = (await getBrasMemberByUser(ctx.db, r.userId))!;
    expect(m.sourceVideoId).toBe(v.id);
    expect(m.source).toBe("descoberta");
  });

  it("descoberta inexistente ou parâmetro estranho é ignorado sem erro; utm é saneado", async () => {
    const r = await signupBrasMember(ctx.db, { ...base, videoId: "bdv_naoexiste123", source: "Insta Gram<script>" });
    const m = (await getBrasMemberByUser(ctx.db, r.userId))!;
    expect(m.sourceVideoId).toBeNull();
    expect(m.source).toBe("instagramscript");
    const r2 = await signupBrasMember(ctx.db, { ...base, cnpj: "11444777000161", email: "b@u.teste", videoId: "../../etc" });
    expect((await getBrasMemberByUser(ctx.db, r2.userId))!).toMatchObject({ sourceVideoId: null, source: "direto" });
    expect(cleanSource("")).toBeNull();
    expect(cleanSource("x".repeat(80))).toHaveLength(40);
  });
});
