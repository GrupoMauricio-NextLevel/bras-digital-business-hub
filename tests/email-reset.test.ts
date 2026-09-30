import { beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { emailOutbox, passwordResets, users } from "@/db/schema";
import { sendEmail } from "@/lib/email";
import { checkResetToken, requestPasswordReset, resetPassword } from "@/lib/domain/password-reset";
import { verifyPassword } from "@/lib/security/password";

let ctx: Awaited<ReturnType<typeof freshDb>>;
beforeAll(async () => { ctx = await freshDb(); });
const tokenOf = (link: string) => link.split("/redefinir-senha/")[1]!;

describe("e-mail transacional", () => {
  it("sem provedor só registra (LOGGED); com provedor envia e registra falha sem lançar", async () => {
    delete process.env.RESEND_API_KEY; delete process.env.EMAIL_FROM;
    expect(await sendEmail(ctx.db, { kind: "T", to: "a@b.com", subject: "x", text: "y" })).toBe("LOGGED");
    process.env.RESEND_API_KEY = "re_test"; process.env.EMAIL_FROM = "NextLevel <no-reply@superdrop.com.br>";
    let body = ""; const ok = async (_u: string, init?: RequestInit) => { body = String(init?.body); return new Response("{}", { status: 200 }); };
    expect(await sendEmail(ctx.db, { kind: "T", to: "a@b.com", subject: "x", text: "y" }, ok as typeof fetch)).toBe("SENT");
    expect(JSON.parse(body).to).toEqual(["a@b.com"]);
    expect(await sendEmail(ctx.db, { kind: "T", to: "a@b.com", subject: "x", text: "y" }, (async () => new Response("no", { status: 500 })) as typeof fetch)).toBe("FAILED");
    expect(await sendEmail(ctx.db, { kind: "T", to: "a@b.com", subject: "x", text: "y" }, (async () => { throw new Error("rede"); }) as typeof fetch)).toBe("FAILED");
    delete process.env.RESEND_API_KEY; delete process.env.EMAIL_FROM;
    expect((await ctx.db.select().from(emailOutbox)).map((e) => e.status)).toEqual(["LOGGED", "SENT", "FAILED", "FAILED"]);
  });
});

describe("recuperar senha", () => {
  it("token de uso único: troca a senha, invalida o link e guarda só o hash", async () => {
    const email = (await ctx.db.select().from(users))[0]!.email;
    const { link } = await requestPasswordReset(ctx.db, email.toUpperCase(), "https://app.superdrop.com.br");
    expect(link).toMatch(/^https:\/\/app\.superdrop\.com\.br\/redefinir-senha\//);
    const token = tokenOf(link!);
    const row = (await ctx.db.select().from(passwordResets))[0]!;
    expect(row.tokenHash).not.toContain(token);
    expect(await checkResetToken(ctx.db, token)).toBe(true);
    await expect(resetPassword(ctx.db, token, "curta")).rejects.toThrow(/8 caracteres/);
    await resetPassword(ctx.db, token, "nova-senha-forte");
    const u = (await ctx.db.query.users.findFirst({ where: eq(users.email, email) }))!;
    expect(verifyPassword("nova-senha-forte", u.passwordHash)).toBe(true);
    expect(await checkResetToken(ctx.db, token)).toBe(false);
    await expect(resetPassword(ctx.db, token, "outra-senha-forte")).rejects.toThrow(/expirou/);
    expect((await ctx.db.select().from(emailOutbox).where(eq(emailOutbox.kind, "PASSWORD_RESET"))).length).toBe(1);
  });
  it("e-mail inexistente responde igual e não envia nada; pedido novo invalida o anterior; expira em 1 hora", async () => {
    const before = (await ctx.db.select().from(emailOutbox)).length;
    expect(await requestPasswordReset(ctx.db, "ninguem@nada.com", "https://x")).toEqual({ link: null });
    expect((await ctx.db.select().from(emailOutbox)).length).toBe(before);
    const email = (await ctx.db.select().from(users))[1]!.email;
    const a = await requestPasswordReset(ctx.db, email, "https://x");
    const b = await requestPasswordReset(ctx.db, email, "https://x");
    expect(await checkResetToken(ctx.db, tokenOf(a.link!))).toBe(false);
    expect(await checkResetToken(ctx.db, tokenOf(b.link!))).toBe(true);
    expect(await checkResetToken(ctx.db, tokenOf(b.link!), new Date(Date.now() + 61 * 60_000))).toBe(false);
  });
});
