import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { agenciaOportunidades, emailOutbox, users } from "@/db/schema";
import { actorFromUser, type Actor } from "@/lib/domain/access";
import { convidarMembro, criarAgencia } from "@/lib/agencias/agencias";
import { atualizarOportunidade } from "@/lib/agencias/comercial";
import { contatosSemResposta, origemDoCanal, paginaDeCaptacao, registrarPedidoDaAgencia, salvarCaptacao } from "@/lib/agencias/captacao";

let ctx: Awaited<ReturnType<typeof freshDb>>;
const antes = process.env.AGENCIAS_V1;
beforeAll(() => { process.env.AGENCIAS_V1 = "true"; });
afterAll(() => { process.env.AGENCIAS_V1 = antes; });
async function ator(id: string): Promise<Actor> { return actorFromUser((await ctx.db.query.users.findFirst({ where: eq(users.id, id) }))!); }
const pedido = (chave: string, extra: Record<string, unknown> = {}) => ({ nome: "Carla", empresa: "CCV Vidros", whatsapp: "11 98888-7777", email: null, mensagem: "Quero vídeos", pagina: "/orcamento/x", site: "", tempoMs: 8000, chaveEnvio: chave, servico: "Vídeos para Reels", ...extra });

describe("origem do Comercial pelo canal (puro)", () => {
  it("anúncio, Instagram, WhatsApp, indicação e o resto como site", () => {
    expect(["meta-pago", "google-pago", "instagram-organico", "whatsapp", "indicacao", "google-organico", "direto"].map((c) => origemDoCanal(c as never))).toEqual(["ANUNCIO", "ANUNCIO", "INSTAGRAM", "WHATSAPP", "INDICACAO", "SITE", "SITE"]);
  });
});

describe("página de captação da agência (D322)", () => {
  beforeEach(async () => { ctx = await freshDb(); });

  it("desligada não abre; ligada recebe pedido, vira negociação com o canal, avisa e não duplica; robô não grava", async () => {
    const a = await criarAgencia(ctx.db, ctx.actors.master, { nome: "UPClips", responsavel: { nome: "Léo", email: "leo@up.com.br", senha: "senha-provisoria" } });
    const admin = await ator(a.userId);
    const editor = await ator((await convidarMembro(ctx.db, admin, { nome: "Gu", email: "gu@up.com.br", senha: "senha-provisoria", funcao: "EDICAO" })).userId);
    const slug = (await ctx.db.query.agencias.findFirst())!.slug;
    await expect(paginaDeCaptacao(ctx.db, slug)).rejects.toThrow(/não encontrada/);
    await expect(salvarCaptacao(ctx.db, editor, { ligada: true, titulo: "Fale conosco" })).rejects.toThrow(/administrador, do gestor/);
    await salvarCaptacao(ctx.db, admin, { ligada: true, titulo: "Fale conosco", servicos: ["Vídeos para Reels", "Tráfego pago"], whatsapp: "(11) 97777-6666" });
    expect(await paginaDeCaptacao(ctx.db, slug)).toMatchObject({ nome: "UPClips", servicos: ["Vídeos para Reels", "Tráfego pago"], whatsapp: "11977776666" });

    expect(await registrarPedidoDaAgencia(ctx.db, slug, pedido("robo-0001", { site: "http://spam" }))).toEqual({ novo: false });
    expect(await registrarPedidoDaAgencia(ctx.db, slug, pedido("rapido-001", { tempoMs: 500 }))).toEqual({ novo: false });
    expect(await registrarPedidoDaAgencia(ctx.db, slug, pedido("chave-0001", { origem: { utm_source: "facebook", utm_medium: "cpc", utm_campaign: "black", fbclid: "abc" } }))).toEqual({ novo: true });
    expect(await registrarPedidoDaAgencia(ctx.db, slug, pedido("chave-0001"))).toEqual({ novo: false });
    const ops = await ctx.db.select().from(agenciaOportunidades);
    expect(ops).toHaveLength(1);
    expect(ops[0]).toMatchObject({ empresa: "CCV Vidros", contatoNome: "Carla", whatsapp: "11988887777", origem: "ANUNCIO", canal: "meta-pago", utmCampaign: "black", servicos: "Vídeos para Reels", mensagem: "Quero vídeos", etapa: "PROSPECCAO" });
    expect((await ctx.db.select().from(emailOutbox).where(eq(emailOutbox.kind, "AGENCIA_NOVO_CONTATO"))).map((e) => e.toEmail)).toEqual(["leo@up.com.br"]);

    expect((await contatosSemResposta(ctx.db, admin)).map((x) => x.empresa)).toEqual(["CCV Vidros"]);
    expect(await contatosSemResposta(ctx.db, editor)).toEqual([]);
    await atualizarOportunidade(ctx.db, admin, ops[0]!.id, { registrarContato: true });
    expect(await contatosSemResposta(ctx.db, admin)).toEqual([]);

    await salvarCaptacao(ctx.db, admin, { ligada: false, titulo: "Fale conosco" });
    await expect(registrarPedidoDaAgencia(ctx.db, slug, pedido("chave-0002"))).rejects.toThrow(/não encontrada/);
  });
});
