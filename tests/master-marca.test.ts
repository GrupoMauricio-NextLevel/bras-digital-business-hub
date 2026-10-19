import { describe, expect, it } from "vitest";
import { NAV, navDoMasterPorMarca } from "@/lib/nav";
import { MASTER_MARCAS, ehMarcaMaster } from "@/lib/master-marca";

/** Master único com seletor de marca (R2, decisão do dono 19/10). */
describe("Master: seletor de marca", () => {
  const itens = NAV.NEXTLEVEL_MASTER.items;
  const menu = (m: Parameters<typeof navDoMasterPorMarca>[1]) => navDoMasterPorMarca(itens, m).filter((i) => !i.pinned);

  it("'Todas as marcas' mostra o menu inteiro, como antes", () => {
    expect(navDoMasterPorMarca(itens, null)).toEqual(itens);
  });

  it("cada marca vê no máximo 12 itens e nada que seja só de outra marca", () => {
    for (const { code } of MASTER_MARCAS) {
      const m = menu(code);
      expect(m.length, code).toBeLessThanOrEqual(12);
      for (const i of m) expect(!i.marcas || i.marcas.includes(code), `${code}: ${i.label}`).toBe(true);
      expect(m.some((i) => i.soTodas), code).toBe(false);
    }
  });

  it("cada marca acha o que é dela", () => {
    const hrefs = (code: Parameters<typeof menu>[0]) => menu(code).map((i) => i.href);
    expect(hrefs("NEXTLEVEL_COMMERCE")).toEqual(expect.arrayContaining(["/commerce", "/master/stores", "/master/orders"]));
    expect(hrefs("NEXTLEVEL_COMMERCE")).not.toContain("/master/suppliers");
    expect(hrefs("SUPERDROP")).toEqual(expect.arrayContaining(["/master/suppliers", "/master/networks", "/master/financeiro/operacao"]));
    expect(hrefs("SUPERDROP")).not.toContain("/commerce");
    expect(hrefs("BRAS_DIGITAL")).toContain("/bras");
    expect(hrefs("NEXTLEVEL_CARGAS")).toContain("/bras");
  });

  it("só aceita as marcas do seletor", () => {
    expect(ehMarcaMaster("SUPERDROP")).toBe(true);
    expect(["todas", "NEXTLEVEL", "", undefined, "CHINA_HUB"].some(ehMarcaMaster)).toBe(false);
  });
});
