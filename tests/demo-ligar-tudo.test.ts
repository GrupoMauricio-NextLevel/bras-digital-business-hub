import { describe, expect, it } from "vitest";
import { freshDb } from "./setup";
import { turnEverythingOnInDemo } from "@/db/demo-ligar-tudo";
import { readyButOff } from "@/lib/domain/qualidade-desligados";

/** D151: na demonstração, tudo o que está "pronto e desligado" e depende do banco fica ligado, uma vez só. */
describe("tudo ligado na demonstração", () => {
  it("liga roteiro, experimentos, proposta e excursão pelas funções do Master, e não repete", async () => {
    const { db, actors } = await freshDb();
    const done = await turnEverythingOnInDemo(db);
    expect(done.filter((d) => d.includes("não ligado"))).toEqual([]);
    const env = { BRAND_SIGNUP_NEXTLEVEL_COMMERCE: "true", BRAND_PARTNERS_NEXTLEVEL_COMMERCE: "true", BRAND_SIGNUP_BRAS_DIGITAL: "true", BRAS_PANELS: "true", FIN_PAGARME: "true", NEXT_PUBLIC_SUPPORT_EMAIL: "suporte@nextlevel.demo" };
    const groups = await readyButOff(db, actors.master, env);
    const items = groups.flatMap((g) => g.items);
    const off = items.filter((i) => i.state !== "LIGADO").map((i) => i.key);
    // Fora do banco e de propósito: conta Mercado Pago real, e-mail real e os endereços próprios (domínio).
    expect(off.sort()).toEqual(["email", "escritorio", "mp-nextlevel", "site-grupo"]);
    expect(await turnEverythingOnInDemo(db)).toEqual([]);
  });
});
