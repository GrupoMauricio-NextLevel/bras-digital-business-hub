import { eq } from "drizzle-orm";
import type { Database } from "@/db/client";
import { organizations, suppliers } from "@/db/schema";
import { brandByCode, isClosedCommerceBrand } from "@/lib/brand";

/**
 * Fronteira pública das marcas de operação fechada (hoje a Brás Digital).
 * Fornecedor (importadora) cuja organização é de marca fechada não aparece em nenhuma superfície pública:
 * página de vendas `/f/[slug]`, lista de fornecedores do cadastro de loja e escolha de fornecedor no cadastro.
 * A decisão vem da configuração da marca (`closedCommerce`), não de comparação com o nome da empresa.
 */
export async function isClosedCommerceOrganization(db: Database, organizationId: string): Promise<boolean> {
  const org = await db.query.organizations.findFirst({ where: eq(organizations.id, organizationId), columns: { brand: true } });
  return !!org && isClosedCommerceBrand(brandByCode(org.brand));
}

export async function isClosedCommerceSupplier(db: Database, supplierId: string): Promise<boolean> {
  const sup = await db.query.suppliers.findFirst({ where: eq(suppliers.id, supplierId), columns: { organizationId: true } });
  return !!sup && (await isClosedCommerceOrganization(db, sup.organizationId));
}
