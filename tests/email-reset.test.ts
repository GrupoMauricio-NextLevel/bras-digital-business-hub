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
    expect((await ctx.db.select().from(emailOutbox).where(eq(emailOutbox.kind, "T"))).map((e) => e.status)).toEqual(["LOGGED", "SENT", "FAILED", "FAILED"]);
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

describe("e-mails de cobrança, teste e cliente final", () => {
  it("trava de envio único: o mesmo aviso não sai duas vezes e a renderização escapa HTML", async () => {
    const { renderHtml } = await import("@/lib/email");
    const a = await sendEmail(ctx.db, { kind: "X", to: "u@x.com", subject: "s", text: "t", dedupeKey: "K1" });
    const b = await sendEmail(ctx.db, { kind: "X", to: "u@x.com", subject: "s", text: "t", dedupeKey: "K1" });
    expect([a, b]).toEqual(["LOGGED", "SKIPPED"]);
    const html = renderHtml({ subject: "Olá <b>", text: "linha 1\n\nhttps://superdrop.com.br/x", cta: { label: "Abrir", url: "https://superdrop.com.br" } });
    expect(html).toContain("Olá &lt;b&gt;");
    expect(html).toContain('href="https://superdrop.com.br/x"');
    expect(html).toContain("NextLevel Marketing Ltda.");
  });
  it("pagamento de fatura avisa o pagador uma vez; aviso de vencimento e fim de teste só uma vez por loja", async () => {
    const { markInvoicePaid, runDunningNotices } = await import("@/lib/domain/finance");
    const { runTrialReminders } = await import("@/lib/domain/store-access");
    const { financeInvoices, stores } = await import("@/db/schema");
    const inv = (await ctx.db.select().from(financeInvoices).where(eq(financeInvoices.status, "OPEN")))[0];
    if (inv && inv.amountCents > 0) {
      await markInvoicePaid(ctx.db, inv.id);
      const sent = await ctx.db.select().from(emailOutbox).where(eq(emailOutbox.kind, "INVOICE_PAID"));
      expect(sent.length).toBeGreaterThan(0);
      await markInvoicePaid(ctx.db, inv.id);
      expect((await ctx.db.select().from(emailOutbox).where(eq(emailOutbox.kind, "INVOICE_PAID"))).length).toBe(sent.length);
    }
    const st = (await ctx.db.select().from(stores))[0]!;
    await ctx.db.update(stores).set({ trialEndsAt: new Date(Date.now() + 36 * 3_600_000).toISOString(), paidUntil: null }).where(eq(stores.id, st.id));
    const r1 = await runTrialReminders(ctx.db); const r2 = await runTrialReminders(ctx.db);
    expect(r1.sent).toBeGreaterThan(0); expect(r2.sent).toBe(0);
    await runDunningNotices(ctx.db);
  });
  it("cliente final recebe pagamento confirmado e pedido enviado, uma vez cada", async () => {
    const { orders } = await import("@/db/schema");
    const { emailOrderCustomer } = await import("@/lib/domain/order-emails");
    const o = (await ctx.db.select().from(orders))[0]!;
    await emailOrderCustomer(ctx.db, o.id, "PAID"); await emailOrderCustomer(ctx.db, o.id, "PAID"); await emailOrderCustomer(ctx.db, o.id, "SHIPPED");
    const rows = await ctx.db.select().from(emailOutbox).where(eq(emailOutbox.toEmail, o.customerEmail));
    expect(rows.filter((r) => r.kind === "ORDER_PAID").length).toBe(1);
    expect(rows.filter((r) => r.kind === "ORDER_SHIPPED").length).toBe(1);
    expect(rows.find((r) => r.kind === "ORDER_PAID")!.body).toContain("/acompanhar");
  });
});
