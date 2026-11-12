import { beforeEach, describe, expect, it } from "vitest";
import { desc } from "drizzle-orm";
import { freshDb } from "./setup";
import { emailOutbox } from "@/db/schema";
import { renderHtml, sendEmail } from "@/lib/email";
import { getEcoSettings, groupSegments, saveEcoSettings } from "@/lib/domain/ecossistema/lancador";

/** D132 (fase P5U): fio do grupo na captação e rodapé do grupo nos e-mails, desligados por padrão. */
let ctx: Awaited<ReturnType<typeof freshDb>>;
beforeEach(async () => { ctx = await freshDb(); });
const last = async () => (await ctx.db.select().from(emailOutbox).orderBy(desc(emailOutbox.createdAt)).limit(1))[0]!;

describe("captação e e-mails do grupo", () => {
  it("e-mail sem rodapé por padrão; com a chave, rodapé do grupo no texto e no HTML", async () => {
    await sendEmail(ctx.db, { kind: "TESTE", to: "a@x.teste", subject: "Oi", text: "Corpo" });
    expect((await last()).body).not.toMatch(/Grupo NextLevel/);
    await saveEcoSettings(ctx.db, ctx.actors.master, { emailFooter: true });
    await sendEmail(ctx.db, { kind: "TESTE", to: "b@x.teste", subject: "Oi", text: "Corpo", brand: "SUPERDROP" });
    expect((await last()).body).toMatch(/Grupo NextLevel: /); // D285: SuperDrop em pausa assina pela E-commerce
    expect((await last()).body).not.toMatch(/Club/); // pontos são do Brás Digital Club (D173): fora do rodapé do grupo
    expect(renderHtml({ subject: "Oi", text: "Corpo" }, undefined, { segments: groupSegments("SUPERDROP") })).not.toMatch(/pontos do Club/);
  });
  it("gravar uma chave não apaga as outras", async () => {
    await saveEcoSettings(ctx.db, ctx.actors.master, { brands: ["SUPERDROP"] });
    await saveEcoSettings(ctx.db, ctx.actors.master, { capture: true });
    expect(await getEcoSettings(ctx.db)).toMatchObject({ brands: ["SUPERDROP"], capture: true, emailFooter: false, publicPages: false });
  });
});

describe("D285: e-mail assina pela marca aberta", () => {
  it("marca em pausa ou sem marca vira NextLevel E-commerce; a equipe do Master assina como NextLevel", async () => {
    const { freshDb } = await import("./setup");
    const { emailOutbox } = await import("@/db/schema");
    const { brandOfUser, sendEmail: enviar } = await import("@/lib/email");
    const ctx2 = await freshDb();
    await enviar(ctx2.db, { kind: "T1", to: "x@x.teste", subject: "Redefinir a sua senha {marca}", text: "Oi", brand: "SUPERDROP" });
    await enviar(ctx2.db, { kind: "T2", to: "y@x.teste", subject: "Oi {marca}", text: "Oi" });
    const rows = (await ctx2.db.select().from(emailOutbox)).filter((r) => r.kind === "T1" || r.kind === "T2");
    expect(rows).toHaveLength(2);
    for (const r of rows) { expect(r.subject).not.toMatch(/SuperDrop/); expect(r.subject).toMatch(/NextLevel E-commerce/); }
    expect(await brandOfUser(ctx2.db, ctx2.actors.master.userId)).toBe("NEXTLEVEL");
  });
});
