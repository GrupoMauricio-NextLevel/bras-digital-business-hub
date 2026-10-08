import { describe, expect, it } from "vitest";
import { BRAS_PANELS, brasPanelsEnabled, canOpenBrasPanelPreview } from "@/lib/bras/panels";
import type { Actor } from "@/lib/domain/access";

const actor = (role: Actor["role"]): Actor => ({ userId: "u", role, organizationId: "o", supplierId: role.startsWith("SUPPLIER") ? "s" : null, storeId: role === "STORE_OWNER" ? "st" : null });

describe("cascas dos painéis da Brás (Fase 0)", () => {
  it("desligadas por padrão; só 'true' liga", () => {
    expect(brasPanelsEnabled({})).toBe(false);
    expect(brasPanelsEnabled({ BRAS_PANELS: "1" })).toBe(false);
    expect(brasPanelsEnabled({ BRAS_PANELS: "TRUE" })).toBe(true);
  });
  it("só o Master abre a prévia, e só com a chave ligada (falha fechada)", () => {
    const on = { BRAS_PANELS: "true" };
    expect(canOpenBrasPanelPreview(actor("NEXTLEVEL_MASTER"), on)).toBe(true);
    expect(canOpenBrasPanelPreview(actor("NEXTLEVEL_MASTER"), {})).toBe(false);
    for (const r of ["SUPPLIER_ADMIN", "SUPPLIER_DISPATCH", "STORE_OWNER", "AFFILIATE"] as const) expect(canOpenBrasPanelPreview(actor(r), on)).toBe(false);
    expect(canOpenBrasPanelPreview(null, on)).toBe(false);
  });
  it("Estúdio no Master e Meu Brás reais (D92); Balcão segue só como prévia, com a regra de dados registrada", () => {
    expect(BRAS_PANELS.map((p) => p.key)).toEqual(["estudio", "balcao", "meu-bras"]);
    const by = Object.fromEntries(BRAS_PANELS.map((p) => [p.key, p]));
    expect(by.estudio).toMatchObject({ path: "/bras", live: true });
    expect(by["meu-bras"]).toMatchObject({ path: "/meu-bras", live: true });
    expect(by.balcao).toMatchObject({ path: "/bras/balcao", live: false });
    expect(by.balcao!.pending).toMatch(/só os dados de envio/);
    for (const r of ["SUPPLIER_ADMIN", "SUPPLIER_DISPATCH", "STORE_OWNER", "AFFILIATE", "BRAS_MEMBER"] as const) expect(canOpenBrasPanelPreview(actor(r), { BRAS_PANELS: "true" })).toBe(false);
  });
});
