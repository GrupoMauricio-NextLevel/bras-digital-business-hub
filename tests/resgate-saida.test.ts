import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { brandLeads, emailOutbox } from "@/db/schema";
import { capturarLeadSaida } from "@/lib/domain/brand-leads";
import { sectionSchema } from "@/lib/themes/sections";

describe("janela de resgate na saída (D280)", () => {
  let ctx: Awaited<ReturnType<typeof freshDb>>;
  beforeEach(async () => { ctx = await freshDb(); });

  it("só com consentimento; vira interessado SAIDA, manda o caminho por e-mail e não duplica", async () => {
    const cad = "https://loja.teste/cadastro";
    await expect(capturarLeadSaida(ctx.db, { brand: "NEXTLEVEL_COMMERCE", email: "a@b.com", consent: false as true, pagina: "/" }, cad)).rejects.toThrow(/concordar/);
    await expect(capturarLeadSaida(ctx.db, { brand: "NEXTLEVEL_COMMERCE", email: "não é e-mail", consent: true, pagina: "/" }, cad)).rejects.toThrow(/inválido/);
    expect((await capturarLeadSaida(ctx.db, { brand: "NEXTLEVEL_COMMERCE", email: "Visitante@Loja.com ", consent: true, pagina: "/planos" }, cad)).created).toBe(true);
    expect((await capturarLeadSaida(ctx.db, { brand: "NEXTLEVEL_COMMERCE", email: "visitante@loja.com", consent: true, pagina: "/temas" }, cad)).created).toBe(false);
    const l = await ctx.db.select().from(brandLeads).where(eq(brandLeads.email, "visitante@loja.com"));
    expect(l).toHaveLength(1);
    expect(l[0]).toMatchObject({ kind: "SAIDA", brand: "NEXTLEVEL_COMMERCE" });
    expect(l[0]!.attribution).toMatchObject({ origem: "janela-saida", pagina: "/temas" });
    const mails = await ctx.db.select().from(emailOutbox).where(eq(emailOutbox.kind, "LEAD_SAIDA"));
    expect(mails).toHaveLength(1);
    expect(mails[0]!.body).toContain(cad);
    expect(mails[0]!.body).not.toMatch(/R\$\s?\d/); // sem preço fixo no e-mail
  });

  it("o lojista escolhe quando a janela do cupom abre (padrão: tempo ou saída)", () => {
    const def = sectionSchema("welcome-coupon")!.settings.find((x) => x.id === "trigger")!;
    expect(def.default).toBe("ambos");
    expect((def as { options: { value: string }[] }).options.map((o) => o.value)).toEqual(["ambos", "saida", "tempo"]);
  });
});
