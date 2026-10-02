import { describe, expect, it } from "vitest";
import {
  PRODUCT_AREAS,
  hasAreaAccess,
  legacyRoleDefaultGrants,
  rolesForArea,
  type AccessGrant,
} from "@/lib/ecosystem";
import { requireStoreId, requireSupplierId, requireSupplierOperationalId, type Actor } from "@/lib/domain/access";

describe("NextLevel Ecosystem", () => {
  it("mantém um único catálogo oficial de áreas", () => {
    expect(PRODUCT_AREAS).toEqual([
      "NEXTLEVEL_COMMERCE",
      "SUPERDROP",
      "BRAS_DIGITAL",
      "CREATORS_HUB",
      "CHINA_HUB",
    ]);
  });

  it("permite múltiplas verticais para o mesmo usuário/organização", () => {
    const grants: AccessGrant[] = [
      { area: "SUPERDROP", role: "SUPPLIER_ADMIN", organizationId: "org-1" },
      { area: "BRAS_DIGITAL", role: "SUPPLIER_ADMIN", organizationId: "org-1" },
      { area: "CREATORS_HUB", role: "VERTICAL_ADMIN", organizationId: "org-1" },
    ];

    expect(hasAreaAccess(grants, "SUPERDROP")).toBe(true);
    expect(hasAreaAccess(grants, "BRAS_DIGITAL")).toBe(true);
    expect(hasAreaAccess(grants, "CHINA_HUB")).toBe(false);
  });

  it("não considera grant desativado como acesso", () => {
    const grants: AccessGrant[] = [
      { area: "CHINA_HUB", role: "PARTNER", organizationId: "org-1", active: false },
    ];
    expect(hasAreaAccess(grants, "CHINA_HUB")).toBe(false);
  });

  it("separa os papéis por vertical", () => {
    const grants: AccessGrant[] = [
      { area: "SUPERDROP", role: "MERCHANT_OWNER", organizationId: "org-1" },
      { area: "SUPERDROP", role: "VIEWER", organizationId: "org-1" },
      { area: "BRAS_DIGITAL", role: "PARTNER", organizationId: "org-1" },
    ];
    expect(rolesForArea(grants, "SUPERDROP")).toEqual(["MERCHANT_OWNER", "VIEWER"]);
    expect(rolesForArea(grants, "BRAS_DIGITAL")).toEqual(["PARTNER"]);
  });

  it("preserva compatibilidade do master antigo dando acesso às cinco áreas", () => {
    const grants = legacyRoleDefaultGrants({
      role: "NEXTLEVEL_MASTER",
      organizationId: "nextlevel",
    });
    expect(grants).toHaveLength(5);
    expect(PRODUCT_AREAS.every((area) => hasAreaAccess(grants, area))).toBe(true);
  });

  it("preserva fornecedor e lojista antigos inicialmente no SuperDrop", () => {
    const supplier = legacyRoleDefaultGrants({
      role: "SUPPLIER_ADMIN",
      organizationId: "supplier-org",
      supplierId: "supplier-1",
    });
    const merchant = legacyRoleDefaultGrants({
      role: "STORE_OWNER",
      organizationId: "merchant-org",
      storeId: "store-1",
    });

    expect(hasAreaAccess(supplier, "SUPERDROP")).toBe(true);
    expect(hasAreaAccess(supplier, "BRAS_DIGITAL")).toBe(false);
    expect(hasAreaAccess(merchant, "SUPERDROP")).toBe(true);
    expect(hasAreaAccess(merchant, "CREATORS_HUB")).toBe(false);
  });
});


describe("SuperDrop grant-aware scopes", () => {
  const baseActor = {
    userId: "user-1",
    role: "NEXTLEVEL_MASTER",
    organizationId: "org-1",
    supplierId: null,
    storeId: null,
  } satisfies Omit<Actor, "grants">;

  it("resolve a loja pelo grant MERCHANT_OWNER sem depender de users.store_id", () => {
    const actor: Actor = {
      ...baseActor,
      grants: [{ area: "SUPERDROP", role: "MERCHANT_OWNER", organizationId: "org-1", storeId: "store-1" }],
    };
    expect(requireStoreId(actor)).toBe("store-1");
  });

  it("resolve o fornecedor pelo grant SUPPLIER_ADMIN sem depender de users.supplier_id", () => {
    const actor: Actor = {
      ...baseActor,
      grants: [{ area: "SUPERDROP", role: "SUPPLIER_ADMIN", organizationId: "org-1", supplierId: "supplier-1" }],
    };
    expect(requireSupplierId(actor)).toBe("supplier-1");
  });

  it("permite OPERATOR na operação sem conceder administração do fornecedor", () => {
    const actor: Actor = {
      ...baseActor,
      grants: [{ area: "SUPERDROP", role: "OPERATOR", organizationId: "org-1", supplierId: "supplier-1" }],
    };
    expect(requireSupplierOperationalId(actor)).toBe("supplier-1");
    expect(() => requireSupplierId(actor)).toThrow();
  });
});
