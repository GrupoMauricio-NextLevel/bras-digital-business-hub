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
    expect((await last()).body).toMatch(/Grupo NextLevel: .*SuperDrop.*pontos do Club/);
    expect(renderHtml({ subject: "Oi", text: "Corpo" }, undefined, { segments: groupSegments("SUPERDROP") })).toMatch(/Seus pontos do Club valem/);
  });
  it("gravar uma chave não apaga as outras", async () => {
    await saveEcoSettings(ctx.db, ctx.actors.master, { brands: ["SUPERDROP"] });
    await saveEcoSettings(ctx.db, ctx.actors.master, { capture: true });
    expect(await getEcoSettings(ctx.db)).toMatchObject({ brands: ["SUPERDROP"], capture: true, emailFooter: false, publicPages: false });
  });
});
