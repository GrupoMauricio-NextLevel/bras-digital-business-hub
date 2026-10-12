import { eq, inArray } from "drizzle-orm";
import type { Database } from "./client";
import { bdImporterUsers, trCarrierUsers, users } from "./schema";
import { DEMO_PASSWORD } from "./seed-constants";
import { newId } from "@/lib/ids";
import { hashPassword } from "@/lib/security/password";

/**
 * Perfis da família do dono no ambiente de demonstração (D150): Samuel (explorar e testar o sistema inteiro) e Danielle
 * Terceiro (gestão financeira). Cada perfil entra na mesma empresa de um perfil de demonstração que já existe, então vê os
 * mesmos dados fictícios, e troca de papel pelo botão "Demo" do topo. Só roda no seed de demonstração (nunca na produção);
 * idempotente pelo e-mail; perfil cuja referência não existe é pulado. Senha de todos: a mesma da demonstração.
 * Parceiro e membro da Brás ficam de fora: esses cadastros são um por pessoa (código, CPF e CNPJ únicos), então a família
 * usa os perfis de demonstração deles.
 */
type Person = "samuel" | "danielle";
type FamilyRole = { slug: string; label: string; from: string; who: Person[] };

export const FAMILY_PEOPLE: Record<Person, string> = { samuel: "Samuel", danielle: "Danielle Terceiro" };
export const FAMILY_ROLES: FamilyRole[] = [
  { slug: "master", label: "Master", from: "master@nextlevel.demo", who: ["samuel", "danielle"] },
  { slug: "financeiro", label: "Financeiro do Master", from: "financeiro@nextlevel.demo", who: ["danielle"] },
  { slug: "lojista", label: "Lojista SuperDrop", from: "dono@arena10.demo", who: ["samuel", "danielle"] },
  { slug: "commerce", label: "Loja Commerce", from: "completo@commerce.demo", who: ["samuel", "danielle"] },
  { slug: "fornecedor", label: "Fornecedor", from: "megatron@superdrop.demo", who: ["samuel", "danielle"] },
  { slug: "expedicao", label: "Expedição", from: "expedicao@megatron.demo", who: ["samuel"] },
  { slug: "importadora", label: "Importadora", from: "importadora@bras.demo", who: ["samuel", "danielle"] },
  { slug: "transportadora", label: "Transportadora", from: "transportadora@cargas.demo", who: ["samuel", "danielle"] },
];
export const familyEmail = (person: Person, slug: string) => `${person}.${slug}@familia.demo`;

export async function seedDemoFamily(db: Database): Promise<string[]> {
  const refs = await db.select().from(users).where(inArray(users.email, FAMILY_ROLES.map((r) => r.from)));
  const byEmail = new Map(refs.map((u) => [u.email, u]));
  const passwordHash = hashPassword(DEMO_PASSWORD);
  const created: string[] = [];
  for (const role of FAMILY_ROLES) {
    const ref = byEmail.get(role.from);
    if (!ref) continue;
    for (const person of role.who) {
      const email = familyEmail(person, role.slug);
      if (await db.query.users.findFirst({ where: eq(users.email, email), columns: { id: true } })) continue;
      const id = newId("usr");
      await db.insert(users).values({
        id, email, name: `${FAMILY_PEOPLE[person]} · ${role.label}`, role: ref.role, organizationId: ref.organizationId,
        supplierId: ref.supplierId, storeId: ref.storeId, storeRole: ref.storeRole, masterFunction: ref.masterFunction,
        passwordHash, mustChangePassword: false,
      });
      // Importadora e transportadora: o acesso ao painel é pela ligação da pessoa com a empresa.
      const imp = await db.query.bdImporterUsers.findFirst({ where: eq(bdImporterUsers.userId, ref.id) });
      if (imp) await db.insert(bdImporterUsers).values({ id: newId("biu"), importerId: imp.importerId, userId: id, staffRole: imp.staffRole, createdBy: "demonstração" });
      const car = await db.query.trCarrierUsers.findFirst({ where: eq(trCarrierUsers.userId, ref.id) });
      if (car) await db.insert(trCarrierUsers).values({ id: newId("tcu"), carrierId: car.carrierId, userId: id });
      created.push(email);
    }
  }
  return created;
}
