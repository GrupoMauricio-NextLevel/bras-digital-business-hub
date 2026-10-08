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
  it("as três cascas existem, todas sob /master e com a pendência registrada", () => {
    expect(BRAS_PANELS.map((p) => p.key)).toEqual(["estudio", "balcao", "meu-bras"]);
    for (const p of BRAS_PANELS) { expect(p.path.startsWith("/master/bras/")).toBe(true); expect(p.pending.length).toBeGreaterThan(20); }
  });
});
