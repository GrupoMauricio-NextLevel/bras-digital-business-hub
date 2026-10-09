import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { brandLeads } from "@/db/schema";
import { brandForHost, brandsFrom } from "@/lib/brand";
import { routeHost } from "@/lib/host-routing";
import { registerCargasInterest } from "@/lib/domain/cargas/interesse";
import { themeKeyForBrand } from "@/design-system/themes";

/** D108: NextLevel Cargas no endereço próprio, com página pública e lista de interesse no CRM do Master. */
describe("marca NextLevel Cargas", () => {
  it("o endereço cargas.nextlevelgroup.com.br é da Cargas (não cai mais no SuperDrop)", () => {
    expect(brandForHost("cargas.nextlevelgroup.com.br", {}).code).toBe("NEXTLEVEL_CARGAS");
    expect(brandForHost("www.cargas.nextlevelgroup.com.br", {}).code).toBe("NEXTLEVEL_CARGAS");
    expect(brandForHost("lojas.nextlevelgroup.com.br", {}).code).toBe("NEXTLEVEL_COMMERCE");
    const b = brandsFrom({}).NEXTLEVEL_CARGAS;
    expect(b).toMatchObject({ landing: "cargas", signupOpen: false, soon: null, partnersOpen: false });
    expect(themeKeyForBrand("NEXTLEVEL_CARGAS")).toBe("cargas");
  });

  it("só a página inicial é pública; páginas de loja das outras marcas voltam para o início; painéis e API passam", () => {
    const r = (pathname: string) => routeHost({ host: "cargas.nextlevelgroup.com.br", pathname }, {});
    expect(r("/")).toEqual({ kind: "next" });
    expect(r("/planos")).toEqual({ kind: "redirect", url: "/" });
    expect(r("/solucoes")).toEqual({ kind: "redirect", url: "/" });
    expect(r("/cadastro")).toEqual({ kind: "redirect", url: "/" });
    expect(r("/login")).toEqual({ kind: "next" });
    expect(r("/master")).toEqual({ kind: "next" });
    expect(r("/api/health")).toEqual({ kind: "next" });
  });
});

describe("cadastro de interesse da Cargas", () => {
  const base = { kind: "TRANSPORTADORA" as const, name: "Carlos Souza", company: "Rota Sul Transportes", document: "11.222.333/0001-81", phone: "(41) 98888-7777", email: "carlos@rotasul.teste", ufs: ["PR", "SC"] as ("PR" | "SC")[], vehicles: ["TRUCK" as const], rntrc: true, insurance: false };
  it("grava no CRM (marca Cargas), com estados e veículos, e repetir o e-mail atualiza", async () => {
    const { db } = await freshDb();
    const r = await registerCargasInterest(db, base);
    expect(r.created).toBe(true);
    const l = (await db.query.brandLeads.findFirst({ where: eq(brandLeads.id, r.id) }))!;
    expect(l).toMatchObject({ brand: "NEXTLEVEL_CARGAS", segment: "TRANSPORTADORA", storeName: "Rota Sul Transportes", phone: "41988887777" });
    expect(l.needs).toEqual(["UF:PR", "UF:SC", "VEICULO:TRUCK"]);
    expect(l.message).toContain("RNTRC: sim");
    expect((await registerCargasInterest(db, { ...base, ufs: ["SP"] })).created).toBe(false);
  });

  it("valida documento, estados e veículos da transportadora; importadora não precisa de rota", async () => {
    const { db } = await freshDb();
    await expect(registerCargasInterest(db, { ...base, document: "11.222.333/0001-82" })).rejects.toThrow(/CNPJ/);
    await expect(registerCargasInterest(db, { ...base, ufs: [] })).rejects.toThrow(/estado/);
    await expect(registerCargasInterest(db, { ...base, vehicles: [] })).rejects.toThrow(/veículo/);
    await expect(registerCargasInterest(db, { ...base, kind: "AUTONOMO", company: undefined, document: "123.456.789-00" })).rejects.toThrow(/CPF/);
    expect((await registerCargasInterest(db, { ...base, kind: "AUTONOMO", company: undefined, document: "529.982.247-25", email: "a@b.teste" })).created).toBe(true);
    expect((await registerCargasInterest(db, { ...base, kind: "IMPORTADORA", ufs: [], vehicles: [], email: "imp@b.teste" })).created).toBe(true);
  });
});
