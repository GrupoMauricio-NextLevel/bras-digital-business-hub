import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { trCarriers, users } from "@/db/schema";
import { actorFromUser, type Actor } from "@/lib/domain/access";
import { addBrasImporter } from "@/lib/domain/bras/catalogo";
import { createImporterAccess } from "@/lib/domain/bras/importadora";
import {
  carrierCatalog, carrierDocsQueue, createCarrier, createCarrierAccess, deleteCarrierDocument, listCarrierDocuments, listCarriers, reviewCarrierDocument,
  saveCarrierDocument, updateCarrierProfile,
} from "@/lib/domain/cargas/cargas";
import { DEFAULT_EXCURSION_RULES, excursionFeeCents, getExcursionRules, saveExcursionRules } from "@/lib/domain/cargas/regras-excursao";
import { DEFAULT_GROUP_COMPANIES, getGroupCompanies, saveGroupCompanies } from "@/lib/domain/grupo";
import { cargasDocsSeal } from "@/lib/cargas/rotulos";

/** D112 (fase E0 do Club): ônibus de excursão, autorizações com selo, empresas do grupo e regras da Excursão. */
let ctx: Awaited<ReturnType<typeof freshDb>>;
let dono: Actor;
const loginComo = async (userId: string) => actorFromUser((await ctx.db.query.users.findFirst({ where: eq(users.id, userId) }))!);
const starline = { name: "Mauricio Turismo", docType: "CNPJ" as const, document: "47.173.173/0001-75", contactName: "Mauricio", phone: "11999990000", ufs: ["SP", "MG"] as ("SP" | "MG")[], vehicles: ["ONIBUS_EXCURSAO"] as "ONIBUS_EXCURSAO"[], operation: "EXCURSAO" as const };
const outra = { name: "Rápido Brás Transportes", docType: "CNPJ" as const, document: "11.444.777/0001-61", contactName: "Antônio", phone: "11977776666", ufs: ["SP", "PR"] as ("SP" | "PR")[], vehicles: ["TRUCK"] as "TRUCK"[] };

beforeEach(async () => {
  ctx = await freshDb();
  const imp = (await addBrasImporter(ctx.db, ctx.actors.master, { name: "XDX Importadora" })).id;
  dono = await loginComo((await createImporterAccess(ctx.db, ctx.actors.master, imp, { name: "Dono", email: "dono@xdx.teste", password: "senha-forte-1" })).userId);
});

describe("ônibus de excursão e empresas do grupo", () => {
  it("cadastra a Starline como ônibus de excursão; o selo 'empresa do grupo' vem do CNPJ; a ordem não favorece o grupo", async () => {
    const { id } = await createCarrier(ctx.db, ctx.actors.master, starline);
    await createCarrier(ctx.db, dono, outra);
    const c = (await ctx.db.query.trCarriers.findFirst({ where: eq(trCarriers.id, id) }))!;
    expect(c.operation).toBe("EXCURSAO");
    const lista = await listCarriers(ctx.db, dono);
    expect(lista.map((x) => x.name)).toEqual(["Mauricio Turismo", "Rápido Brás Transportes"]); // ordem alfabética, pública
    expect(lista.find((x) => x.id === id)!.groupCompany).toBe(true);
    expect(lista.find((x) => x.id !== id)!.groupCompany).toBe(false);
    expect((await carrierCatalog(ctx.db, { operation: "EXCURSAO" })).map((x) => x.id)).toEqual([id]);
    expect(await carrierCatalog(ctx.db, { uf: "MG", operation: "CARGA" })).toEqual([]);
  });

  it("tipo (carga ou excursão) só o Master muda", async () => {
    const { id } = await createCarrier(ctx.db, ctx.actors.master, outra);
    const t = await loginComo((await createCarrierAccess(ctx.db, ctx.actors.master, id, { name: "Antônio", email: "a@t.teste", password: "senha-forte-1" })).userId);
    await updateCarrierProfile(ctx.db, t, null, { operation: "EXCURSAO" });
    expect((await ctx.db.query.trCarriers.findFirst({ where: eq(trCarriers.id, id) }))!.operation).toBe("CARGA");
    await updateCarrierProfile(ctx.db, ctx.actors.master, id, { operation: "EXCURSAO" });
    expect((await ctx.db.query.trCarriers.findFirst({ where: eq(trCarriers.id, id) }))!.operation).toBe("EXCURSAO");
  });

  it("empresas do grupo: padrão do dono, CNPJ conferido, sem repetição, só o Master grava", async () => {
    expect((await getGroupCompanies(ctx.db)).map((c) => c.key)).toEqual(["STARLINE", "MEGATRON", "NEXTLEVEL"]);
    expect(DEFAULT_GROUP_COMPANIES[0]!.cnpj).toBe("47173173000175");
    await expect(saveGroupCompanies(ctx.db, ctx.actors.master, [{ ...DEFAULT_GROUP_COMPANIES[0]!, cnpj: "47.173.173/0001-00" }])).rejects.toThrow(/CNPJ inválido/);
    await expect(saveGroupCompanies(ctx.db, ctx.actors.master, [DEFAULT_GROUP_COMPANIES[0]!, { ...DEFAULT_GROUP_COMPANIES[1]!, key: "STARLINE" }])).rejects.toThrow(/repetida/);
    await expect(saveGroupCompanies(ctx.db, dono, DEFAULT_GROUP_COMPANIES)).rejects.toThrow();
    await saveGroupCompanies(ctx.db, ctx.actors.master, [...DEFAULT_GROUP_COMPANIES.slice(0, 2), { ...DEFAULT_GROUP_COMPANIES[2]!, cnpj: "11.222.333/0001-81" }]);
    expect((await getGroupCompanies(ctx.db))[2]!.cnpj).toBe("11222333000181");
  });
});

describe("autorizações e selo 'documentação em dia'", () => {
  it("a transportadora informa, o Master confere; vencida derruba o selo; outra transportadora não mexe", async () => {
    const { id } = await createCarrier(ctx.db, ctx.actors.master, starline);
    const t = await loginComo((await createCarrierAccess(ctx.db, ctx.actors.master, id, { name: "Mauricio", email: "m@starline.teste", password: "senha-forte-1" })).userId);
    const { id: docId } = await saveCarrierDocument(ctx.db, t, null, { kind: "FRETAMENTO", number: "ANTT-123", issuer: "ANTT", validUntil: "2099-12-31" });
    expect((await listCarrierDocuments(ctx.db, t, null))[0]!.status).toBe("PENDENTE");
    expect((await carrierCatalog(ctx.db))[0]!.docsOk).toBe(false);
    expect((await carrierDocsQueue(ctx.db, ctx.actors.master)).pending).toHaveLength(1);
    await expect(reviewCarrierDocument(ctx.db, t, docId, "VERIFICADA")).rejects.toThrow();
    await reviewCarrierDocument(ctx.db, ctx.actors.master, docId, "VERIFICADA");
    expect((await carrierCatalog(ctx.db))[0]!.docsOk).toBe(true);
    // Uma conferida vencida derruba o selo.
    await saveCarrierDocument(ctx.db, ctx.actors.master, id, { kind: "ESTADUAL", number: "SP-9", validUntil: "2020-01-01" });
    expect((await carrierCatalog(ctx.db))[0]!.docsOk).toBe(false);
    expect((await carrierDocsQueue(ctx.db, ctx.actors.master)).expiring.some((d) => d.expired)).toBe(true);
    // Outra transportadora não remove a autorização desta.
    const { id: id2 } = await createCarrier(ctx.db, ctx.actors.master, outra);
    const t2 = await loginComo((await createCarrierAccess(ctx.db, ctx.actors.master, id2, { name: "Antônio", email: "a@t.teste", password: "senha-forte-1" })).userId);
    await expect(deleteCarrierDocument(ctx.db, t2, docId)).rejects.toThrow();
    await expect(saveCarrierDocument(ctx.db, t, null, { kind: "OUTRO", number: "x" })).rejects.toThrow(/número/);
  });

  it("selo puro: sem conferida não tem; a vencer em 30 dias avisa", () => {
    expect(cargasDocsSeal([], "2026-10-10").ok).toBe(false);
    expect(cargasDocsSeal([{ status: "PENDENTE", validUntil: null }], "2026-10-10").ok).toBe(false);
    expect(cargasDocsSeal([{ status: "VERIFICADA", validUntil: null }], "2026-10-10")).toEqual({ ok: true, expiringSoon: false });
    expect(cargasDocsSeal([{ status: "VERIFICADA", validUntil: "2026-10-30" }], "2026-10-10")).toEqual({ ok: true, expiringSoon: true });
    expect(cargasDocsSeal([{ status: "VERIFICADA", validUntil: "2026-10-09" }], "2026-10-10").ok).toBe(false);
  });
});

describe("regras da Excursão", () => {
  it("padrão em rascunho, grava com versão, valida a ordem dos tamanhos e calcula a taxa", async () => {
    const r = await getExcursionRules(ctx.db);
    expect(r.version).toBe(0);
    expect(r.fee.charging).toBe(false);
    expect(r.sizes.M.units).toBe(2);
    await expect(saveExcursionRules(ctx.db, dono, { cancelHours: 6 })).rejects.toThrow();
    await expect(saveExcursionRules(ctx.db, ctx.actors.master, { sizes: { ...DEFAULT_EXCURSION_RULES.sizes, M: { ...DEFAULT_EXCURSION_RULES.sizes.M, units: 9 } } })).rejects.toThrow(/maior/);
    const v = await saveExcursionRules(ctx.db, ctx.actors.master, { defaultCapacityUnits: 150, fee: { ...DEFAULT_EXCURSION_RULES.fee, mode: "PERCENT", bps: 400 } });
    expect(v.version).toBe(1);
    expect((await getExcursionRules(ctx.db)).defaultCapacityUnits).toBe(150);
    expect(excursionFeeCents(DEFAULT_EXCURSION_RULES, 4_000)).toBe(150);
    expect(excursionFeeCents({ fee: { mode: "PERCENT", perParcelCents: 0, bps: 400, charging: false } }, 4_000)).toBe(160);
  });
});
