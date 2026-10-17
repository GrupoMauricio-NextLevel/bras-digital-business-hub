import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { bdImporters, users } from "@/db/schema";
import { actorFromUser, type Actor } from "@/lib/domain/access";
import { getBrasMemberByUser, setBrasMemberStatus, signupBrasMember } from "@/lib/domain/bras/membros";
import { addBrasImporter } from "@/lib/domain/bras/catalogo";
import { myImporter } from "@/lib/domain/bras/importadora";
import { listPendingSuppliers, listSupplierDirectory, reviewSupplier, signupSupplier, SUPPLIER_PENDING_MESSAGE, type SupplierSignupInput } from "@/lib/domain/bras/fornecedores";
import { CLOSED_PUBLIC_PATHS } from "@/lib/host-routing";

/** D160: rede aberta. Fornecedor se cadastra sozinho, espera aprovação, entra no diretório; comprador ativo vê o perfil comercial. */
let ctx: Awaited<ReturnType<typeof freshDb>>;
let ana: Actor; let anaSession: { user: { id: string; role: string } };
const fornecedor = (over: Partial<SupplierSignupInput> = {}): SupplierSignupInput => ({
  supplierType: "DISTRIBUIDOR", polo: "CANINDE", tradeName: "Canindé Utilidades", legalName: "Canindé Utilidades Comércio LTDA", cnpj: "45.723.174/0001-10",
  categories: ["Utilidades domésticas", "Casa e decoração"], description: "Potes, garrafas e organização.", minBoxes: 2, paymentMethods: ["Pix", "Boleto"],
  name: "Carlos", email: "carlos@caninde.teste", whatsapp: "(11) 98888-7777", password: "senha-forte-1", acceptTerms: true, ...over,
});
const loginComo = async (userId: string) => actorFromUser((await ctx.db.query.users.findFirst({ where: eq(users.id, userId) }))!);

beforeEach(async () => {
  ctx = await freshDb();
  const r = await signupBrasMember(ctx.db, { name: "Ana", companyName: "Ana Utilidades LTDA", cnpj: "11222333000181", whatsapp: "11988887777", email: "ana@u.teste", password: "senha-forte-1", acceptTerms: true });
  const m = (await getBrasMemberByUser(ctx.db, r.userId))!;
  ana = { userId: r.userId, role: "BRAS_MEMBER", organizationId: m.organizationId, supplierId: null, storeId: null };
  anaSession = { user: { id: r.userId, role: "BRAS_MEMBER" } };
});

describe("cadastro do fornecedor", () => {
  it("entra PENDENTE, com login de dono, e o painel mostra 'em análise' até a aprovação", async () => {
    const { importerId, userId } = await signupSupplier(ctx.db, fornecedor());
    const imp = (await ctx.db.query.bdImporters.findFirst({ where: eq(bdImporters.id, importerId) }))!;
    expect([imp.approvalStatus, imp.active, imp.signupSource, imp.supplierType, imp.polo, imp.cnpj]).toEqual(["PENDENTE", false, "AUTOCADASTRO", "DISTRIBUIDOR", "CANINDE", "45723174000110"]);
    const dono = await loginComo(userId);
    expect(dono.role).toBe("BRAS_IMPORTER");
    await expect(myImporter(ctx.db, dono)).rejects.toThrow(SUPPLIER_PENDING_MESSAGE);
    expect((await listPendingSuppliers(ctx.db, ctx.actors.master)).map((p) => p.id)).toEqual([importerId]);
    await expect(listPendingSuppliers(ctx.db, ana)).rejects.toThrow();
  });

  it("CNPJ, e-mail e aceite são conferidos; CNPJ repetido e e-mail em uso são recusados", async () => {
    await expect(signupSupplier(ctx.db, fornecedor({ cnpj: "11.111.111/1111-11" }))).rejects.toThrow(/CNPJ/);
    await expect(signupSupplier(ctx.db, fornecedor({ acceptTerms: false as true }))).rejects.toThrow();
    await expect(signupSupplier(ctx.db, fornecedor({ categories: [] }))).rejects.toThrow(/categoria/);
    await signupSupplier(ctx.db, fornecedor());
    await expect(signupSupplier(ctx.db, fornecedor({ email: "outro@x.teste" }))).rejects.toThrow(/CNPJ/);
    await expect(signupSupplier(ctx.db, fornecedor({ cnpj: "11.444.777/0001-61", email: "ana@u.teste" }))).rejects.toThrow(/e-mail/);
  });
});

describe("aprovação e diretório", () => {
  it("só o aprovado aparece; recusa exige motivo e o fornecedor vê o motivo", async () => {
    const a = await signupSupplier(ctx.db, fornecedor());
    const b = await signupSupplier(ctx.db, fornecedor({ tradeName: "Brás Eletrônicos", supplierType: "IMPORTADORA", polo: "BRAS", cnpj: "11.444.777/0001-61", email: "b@b.teste", categories: ["Eletrônicos e acessórios"] }));
    expect(await listSupplierDirectory(ctx.db, anaSession, ana)).toEqual([]);
    await expect(reviewSupplier(ctx.db, ana, a.importerId, { decision: "APROVAR" })).rejects.toThrow();
    await expect(reviewSupplier(ctx.db, ctx.actors.master, b.importerId, { decision: "RECUSAR" })).rejects.toThrow(/motivo/);
    await reviewSupplier(ctx.db, ctx.actors.master, a.importerId, { decision: "APROVAR" });
    await reviewSupplier(ctx.db, ctx.actors.master, b.importerId, { decision: "RECUSAR", note: "CNPJ de outra atividade" });
    expect((await myImporter(ctx.db, await loginComo(a.userId))).importer.id).toBe(a.importerId);
    await expect(myImporter(ctx.db, await loginComo(b.userId))).rejects.toThrow(/CNPJ de outra atividade/);
    const lista = await listSupplierDirectory(ctx.db, anaSession, ana);
    expect(lista.map((f) => f.name)).toEqual(["Canindé Utilidades"]);
    // Perfil comercial, sem contato, CNPJ, anotações, comissão ou plano.
    expect(Object.keys(lista[0]!).sort()).toEqual(["categories", "description", "id", "minBoxes", "minOrderCents", "name", "paymentMethods", "polo", "prepDays", "productsOnSale", "supplierType"]);
  });

  it("filtros por polo, tipo e categoria; os cadastrados pelo Master seguem aprovados no Brás", async () => {
    const a = await signupSupplier(ctx.db, fornecedor());
    await reviewSupplier(ctx.db, ctx.actors.master, a.importerId, { decision: "APROVAR" });
    const antigo = (await addBrasImporter(ctx.db, ctx.actors.master, { name: "XDX Importadora" })).id;
    const xdx = (await ctx.db.query.bdImporters.findFirst({ where: eq(bdImporters.id, antigo) }))!;
    expect([xdx.approvalStatus, xdx.polo, xdx.supplierType, xdx.signupSource]).toEqual(["APROVADO", "BRAS", "IMPORTADORA", "MASTER"]);
    expect((await listSupplierDirectory(ctx.db, anaSession, ana, { polo: "CANINDE" })).map((f) => f.name)).toEqual(["Canindé Utilidades"]);
    expect((await listSupplierDirectory(ctx.db, anaSession, ana, { supplierType: "IMPORTADORA" })).map((f) => f.name)).toEqual(["XDX Importadora"]);
    expect((await listSupplierDirectory(ctx.db, anaSession, ana, { category: "Casa e decoração" })).map((f) => f.name)).toEqual(["Canindé Utilidades"]);
  });

  it("diretório só para membro ativo (bloqueado e visitante não veem)", async () => {
    const m = (await getBrasMemberByUser(ctx.db, ana.userId))!;
    await setBrasMemberStatus(ctx.db, ctx.actors.master, m.id, "BLOCKED", "teste");
    await expect(listSupplierDirectory(ctx.db, anaSession, ana)).rejects.toThrow(/membros/);
    await expect(listSupplierDirectory(ctx.db, null, null)).rejects.toThrow(/membros/);
  });

  it("a página de cadastro do fornecedor é pública no endereço da Brás", () => {
    expect(CLOSED_PUBLIC_PATHS).toContain("/fornecer");
  });
});
