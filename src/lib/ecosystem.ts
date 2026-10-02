/**
 * NextLevel Ecosystem — produtos/verticais construídos sobre o mesmo Commerce Core.
 *
 * Regra arquitetural:
 * - NEXTLEVEL_MASTER governa o ecossistema;
 * - NEXTLEVEL_COMMERCE é o motor compartilhado;
 * - SUPERDROP, BRAS_DIGITAL, CREATORS_HUB e CHINA_HUB são superfícies de negócio;
 * - produto, estoque, cliente e pedido continuam sendo entidades únicas do core.
 */

export const PRODUCT_AREAS = [
  "NEXTLEVEL_COMMERCE",
  "SUPERDROP",
  "BRAS_DIGITAL",
  "CREATORS_HUB",
  "CHINA_HUB",
] as const;

export type ProductArea = (typeof PRODUCT_AREAS)[number];

export const ECOSYSTEM_SURFACES = ["NEXTLEVEL_MASTER", ...PRODUCT_AREAS] as const;
export type EcosystemSurface = (typeof ECOSYSTEM_SURFACES)[number];

export const ACCESS_ROLES = [
  "PLATFORM_ADMIN",
  "VERTICAL_ADMIN",
  "SUPPLIER_ADMIN",
  "MERCHANT_OWNER",
  "CREATOR",
  "PARTNER",
  "OPERATOR",
  "VIEWER",
] as const;

export type EcosystemAccessRole = (typeof ACCESS_ROLES)[number];

export type AccessGrant = {
  area: ProductArea;
  role: EcosystemAccessRole;
  organizationId: string;
  supplierId?: string | null;
  storeId?: string | null;
  active?: boolean;
};

export const ECOSYSTEM = {
  NEXTLEVEL_MASTER: {
    label: "Master",
    description: "Governança, receita, organizações, acessos e saúde de todo o ecossistema.",
    base: "/master",
  },
  NEXTLEVEL_COMMERCE: {
    label: "NextLevel Commerce",
    description: "Core compartilhado de catálogo, estoque, pedidos, checkout, financeiro e integrações.",
    base: "/commerce",
  },
  SUPERDROP: {
    label: "SuperDrop",
    description: "Distribuição por rede de fornecedores e lojistas/drop.",
    base: "/superdrop",
  },
  BRAS_DIGITAL: {
    label: "Brás Digital",
    description: "Marketplace B2B/atacado e rede digital de fornecedores.",
    base: "/bras-digital",
  },
  CREATORS_HUB: {
    label: "Creators Hub",
    description: "Campanhas, creators, atribuição de vendas e comissões.",
    base: "/creators-hub",
  },
  CHINA_HUB: {
    label: "China Hub",
    description: "Onboarding e distribuição de importadores/fornecedores chineses no Brasil.",
    base: "/china-hub",
  },
} as const satisfies Record<EcosystemSurface, { label: string; description: string; base: string }>;

export function isProductArea(value: string): value is ProductArea {
  return (PRODUCT_AREAS as readonly string[]).includes(value);
}

export function hasAreaAccess(grants: readonly AccessGrant[], area: ProductArea): boolean {
  return grants.some((grant) => grant.area === area && grant.active !== false);
}

export function rolesForArea(grants: readonly AccessGrant[], area: ProductArea): EcosystemAccessRole[] {
  return grants
    .filter((grant) => grant.area === area && grant.active !== false)
    .map((grant) => grant.role);
}

/**
 * Ponte temporária: usuários antigos continuam entrando normalmente enquanto
 * a base é migrada para grants multi-produto.
 */
export function legacyRoleDefaultGrants(input: {
  role: "NEXTLEVEL_MASTER" | "SUPPLIER_ADMIN" | "SUPPLIER_DISPATCH" | "STORE_OWNER";
  organizationId: string;
  supplierId?: string | null;
  storeId?: string | null;
}): AccessGrant[] {
  if (input.role === "NEXTLEVEL_MASTER") {
    return PRODUCT_AREAS.map((area) => ({
      area,
      role: "PLATFORM_ADMIN" as const,
      organizationId: input.organizationId,
      active: true,
    }));
  }

  if (input.role === "SUPPLIER_ADMIN") {
    return [{
      area: "SUPERDROP",
      role: "SUPPLIER_ADMIN",
      organizationId: input.organizationId,
      supplierId: input.supplierId,
      active: true,
    }];
  }

  if (input.role === "SUPPLIER_DISPATCH") {
    return [{
      area: "SUPERDROP",
      role: "OPERATOR",
      organizationId: input.organizationId,
      supplierId: input.supplierId,
      active: true,
    }];
  }

  return [{
    area: "SUPERDROP",
    role: "MERCHANT_OWNER",
    organizationId: input.organizationId,
    storeId: input.storeId,
    active: true,
  }];
}
