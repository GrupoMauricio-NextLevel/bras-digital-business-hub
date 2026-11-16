import { describe, it, expect, beforeEach } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { businessContatos, stores } from "@/db/schema";
import {
  ativarAcademia, contatosDaAcademia, diasDisponiveis, etapaDe, linksDaAcademia, paginaDaAcademia, pedirAulaExperimental,
  registrarResultado, resumoDaCaptacao, salvarConfigAcademia, lerConfig,
} from "@/lib/domain/business/academia";

let ctx: Awaited<ReturnType<typeof freshDb>>;
const AGORA = new Date("2026-11-16T15:00:00Z"); // segunda-feira, meio-dia em Brasília
const slugDe = async (id: string) => (await ctx.db.query.stores.findFirst({ where: eq(stores.id, id) }))!.slug;

beforeEach(async () => {
  ctx = await freshDb();
  await ativarAcademia(ctx.db, ctx.seed.stores.mantos.id, { bairro: "Guacuri", modalidades: ["Musculação", "Funcional"] });
});

describe("Business para academia: captação (A1, D307)", () => {
  it("só loja ligada como academia tem página pública", async () => {
    const p = await paginaDaAcademia(ctx.db, await slugDe(ctx.seed.stores.mantos.id));
    expect(p?.config.bairro).toBe("Guacuri");
    expect(await paginaDaAcademia(ctx.db, await slugDe(ctx.seed.stores.arena.id))).toBeNull();
  });

  it("dias da experimental seguem os dias da semana configurados", () => {
    const dias = diasDisponiveis(lerConfig({ diasExperimental: [1, 3] }), AGORA, 4);
    expect(dias).toEqual(["2026-11-16", "2026-11-18", "2026-11-23", "2026-11-25"]);
    expect(diasDisponiveis(lerConfig({ diasExperimental: [1] }), new Date("2026-11-16T23:30:00Z"), 1)).toEqual(["2026-11-23"]);
  });

  it("pedido grava a origem, valida o WhatsApp e não duplica a mesma pessoa", async () => {
    const slug = await slugDe(ctx.seed.stores.mantos.id);
    const a = await pedirAulaExperimental(ctx.db, slug, { nome: "Carla Dias", whatsapp: "+55 (11) 98888-7777", interesse: "Funcional", dia: "2026-11-18", consentimento: true }, { origem: "instagram", campanha: "bio" }, AGORA);
    expect(a.novo).toBe(true);
    const b = await pedirAulaExperimental(ctx.db, slug, { nome: "Carla Dias", whatsapp: "11988887777", dia: "2026-11-19" }, { origem: "google" }, AGORA);
    expect(b).toEqual({ id: a.id, novo: false });
    const [c] = await ctx.db.select().from(businessContatos).where(eq(businessContatos.id, a.id));
    expect(c!.origem).toBe("instagram"); // a primeira origem fica
    expect(c!.experimentalDia).toBe("2026-11-19");
    await expect(pedirAulaExperimental(ctx.db, slug, { nome: "X Y", whatsapp: "1234" }, { origem: "direto" }, AGORA)).rejects.toThrow(/WhatsApp/);
    await expect(pedirAulaExperimental(ctx.db, slug, { nome: "Zé Lima", whatsapp: "11977776666", dia: "2026-11-22" }, { origem: "direto" }, AGORA)).rejects.toThrow(/dias disponíveis/);
    await expect(pedirAulaExperimental(ctx.db, await slugDe(ctx.seed.stores.arena.id), { nome: "Zé Lima", whatsapp: "11977776666" }, { origem: "direto" }, AGORA)).rejects.toThrow(/não encontrada/);
  });

  it("a etapa vem dos fatos e a recepção confirma com um toque", async () => {
    const slug = await slugDe(ctx.seed.stores.mantos.id);
    const { id } = await pedirAulaExperimental(ctx.db, slug, { nome: "Rui Melo", whatsapp: "11966665555", dia: "2026-11-16" }, { origem: "whatsapp" }, AGORA);
    const ver = async (agora: Date) => (await contatosDaAcademia(ctx.db, ctx.actors.mantos, agora)).find((c) => c.id === id)!;
    expect((await ver(AGORA)).etapa).toBe("marcada");
    expect((await ver(new Date("2026-11-17T15:00:00Z"))).etapa).toBe("confirmar");
    expect((await ver(AGORA)).whatsappHref).toMatch(/^https:\/\/wa\.me\/5511966665555\?text=/);
    expect((await registrarResultado(ctx.db, ctx.actors.mantos, id, "veio", {}, AGORA)).etapa).toBe("veio");
    expect((await registrarResultado(ctx.db, ctx.actors.mantos, id, "matriculou", {}, AGORA)).etapa).toBe("matriculou");
    expect((await registrarResultado(ctx.db, ctx.actors.mantos, id, "reabrir", { dia: "2026-11-20" }, AGORA)).etapa).toBe("marcada");
    expect(etapaDe({ perdidoEm: "x", matriculouEm: null, veioEm: "y", naoVeioEm: null, experimentalDia: null })).toBe("perdido");
  });

  it("uma academia nunca vê nem mexe nos interessados de outra", async () => {
    await ativarAcademia(ctx.db, ctx.seed.stores.arena.id);
    const { id } = await pedirAulaExperimental(ctx.db, await slugDe(ctx.seed.stores.mantos.id), { nome: "Lia Nunes", whatsapp: "11955554444" }, { origem: "direto" }, AGORA);
    expect(await contatosDaAcademia(ctx.db, ctx.actors.arena, AGORA)).toHaveLength(0);
    await expect(registrarResultado(ctx.db, ctx.actors.arena, id, "matriculou", {}, AGORA)).rejects.toThrow(/não encontrado/);
    await expect(contatosDaAcademia(ctx.db, ctx.actors.master, AGORA)).rejects.toThrow(/painel da academia/);
  });

  it("loja comum (sem conta Business) não abre a área de academia", async () => {
    await expect(contatosDaAcademia(ctx.db, ctx.actors.arena, AGORA)).rejects.toThrow(/não é de academia/);
  });

  it("resumo conta interessados, matrículas, conversão e origem", async () => {
    const slug = await slugDe(ctx.seed.stores.mantos.id);
    const um = await pedirAulaExperimental(ctx.db, slug, { nome: "Ana Paz", whatsapp: "11911112222", dia: "2026-11-16" }, { origem: "instagram" }, AGORA);
    const dois = await pedirAulaExperimental(ctx.db, slug, { nome: "Bia Reis", whatsapp: "11933334444", dia: "2026-11-16" }, { origem: "instagram" }, AGORA);
    await pedirAulaExperimental(ctx.db, slug, { nome: "Caio Luz", whatsapp: "11955556666" }, { origem: "google" }, AGORA);
    await registrarResultado(ctx.db, ctx.actors.mantos, um.id, "matriculou", {}, AGORA);
    await registrarResultado(ctx.db, ctx.actors.mantos, dois.id, "nao_veio", {}, AGORA);
    const r = await resumoDaCaptacao(ctx.db, ctx.actors.mantos, 30, AGORA);
    expect(r.interessados).toBe(3);
    expect(r.matriculas).toBe(1);
    expect(r.conversao).toBe(33);
    expect(r.comparecimento).toBe(50);
    expect(r.origens[0]).toMatchObject({ origem: "instagram", nome: "Instagram", interessados: 2, matriculas: 1 });
  });

  it("só o dono muda a página; a equipe não", async () => {
    const cfg = await salvarConfigAcademia(ctx.db, ctx.actors.mantos, { bairro: "Guacuri", cidade: "São Paulo", modalidades: ["Lutas"] });
    expect(cfg.modalidades).toEqual(["Lutas"]);
    await expect(salvarConfigAcademia(ctx.db, { ...ctx.actors.mantos, storeRole: "STAFF" }, {})).rejects.toThrow(/Só o dono/);
  });

  it("links rastreados levam a origem de cada canal", () => {
    const l = linksDaAcademia("https://exemplo.com/", "renner");
    expect(l.map((x) => x.url)).toContain("https://exemplo.com/academia/renner?utm_source=instagram");
  });
});
