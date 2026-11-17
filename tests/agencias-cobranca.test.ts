import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { agencias, users } from "@/db/schema";
import { actorFromUser, type Actor } from "@/lib/domain/access";
import { convidarMembro, criarAgencia } from "@/lib/agencias/agencias";
import { criarCliente } from "@/lib/agencias/clientes";
import { cancelarCobranca, conectarMercadoPago, conferirPagamento, criarCobrancaAvulsa, financeiroDaAgencia, gerarCobrancasDoMes, gerarLinkDePagamento, lembreteDoDia, marcarPagaManual, mensagemDeCobranca, pendenciasDeCobranca, situacaoMostrada, vencimentoNoMes } from "@/lib/agencias/cobranca";

let ctx: Awaited<ReturnType<typeof freshDb>>;
const antes = process.env.AGENCIAS_V1;
beforeAll(() => { process.env.AGENCIAS_V1 = "true"; });
afterAll(() => { process.env.AGENCIAS_V1 = antes; });
async function ator(id: string): Promise<Actor> { return actorFromUser((await ctx.db.query.users.findFirst({ where: eq(users.id, id) }))!); }

/** Mercado Pago de mentira: conta, preferência, busca e consulta do pagamento. */
function fakeMp(estado: { pago?: { ref: string; valor: number } }) {
  return (async (url: string) => {
    const j = (b: unknown) => new Response(JSON.stringify(b), { status: 200, headers: { "content-type": "application/json" } });
    if (url.includes("/users/me")) return j({ id: 1, nickname: "UPCLIPS", site_id: "MLB" });
    if (url.includes("/checkout/preferences")) return j({ id: "pref-1", init_point: "https://mp.example/pagar/1" });
    if (url.includes("/v1/payments/search")) return j({ results: estado.pago ? [{ id: 99, status: "approved" }] : [] });
    if (url.includes("/v1/payments/99")) return j({ id: 99, status: "approved", status_detail: "accredited", external_reference: estado.pago!.ref, transaction_amount: estado.pago!.valor / 100 });
    return new Response("{}", { status: 404 });
  }) as typeof fetch;
}

describe("regras puras da cobrança (D318)", () => {
  it("vencimento, situação, lembretes e mensagem", () => {
    expect(vencimentoNoMes("2026-12", 5)).toBe("2026-12-05");
    expect(situacaoMostrada({ situacao: "ABERTA", vencimento: "2026-11-10" }, "2026-11-17")).toBe("ATRASADA");
    expect(situacaoMostrada({ situacao: "PAGA", vencimento: "2026-11-10" }, "2026-11-17")).toBe("PAGA");
    expect(["2026-11-20", "2026-11-17", "2026-11-16", "2026-11-12", "2026-11-07", "2026-11-15"].map((v) => lembreteDoDia(v, "2026-11-17"))).toEqual(["Vence em 3 dias", "Vence hoje", "Venceu há 1 dia", "Venceu há 5 dias", "Venceu há 10 dias", null]);
    expect(mensagemDeCobranca({ descricao: "Mensalidade de novembro de 2026", valorCents: 250_000, vencimento: "2026-11-10", checkoutUrl: "https://mp/x" }, { nome: "CCV Vidros", contatoNome: "Carla Souza" }, "UPClips")).toMatch(/^Olá, Carla! Aqui é da UPClips.*R\$\s?2\.500,00.*10\/11\/2026.*https:\/\/mp\/x/);
  });
});

describe("cobrança da agência (D318)", () => {
  beforeEach(async () => { ctx = await freshDb(); });

  it("gera as mensalidades sem duplicar, cobra pelo Mercado Pago da agência e só dá baixa conferida na API", async () => {
    const a = await criarAgencia(ctx.db, ctx.actors.master, { nome: "UPClips", responsavel: { nome: "Léo", email: "leo@up.com.br", senha: "senha-provisoria" } });
    const admin = await ator(a.userId);
    const editor = await ator((await convidarMembro(ctx.db, admin, { nome: "Gu", email: "gu@up.com.br", senha: "senha-provisoria", funcao: "EDICAO" })).userId);
    await criarCliente(ctx.db, admin, { nome: "CCV Vidros", valorMensalCents: 250_000, diaVencimento: 10, email: "carla@ccv.com.br" });
    await criarCliente(ctx.db, admin, { nome: "Sem Contrato" });
    expect(await gerarCobrancasDoMes(ctx.db, admin, "2026-11")).toEqual({ criadas: 1, semContrato: 1 });
    expect((await gerarCobrancasDoMes(ctx.db, admin, "2026-11")).criadas).toBe(0);
    await expect(gerarCobrancasDoMes(ctx.db, editor, "2026-11")).rejects.toThrow(/financeiro/);
    const fin = await financeiroDaAgencia(ctx.db, admin, "2026-11", "2026-11-17");
    const f = fin.lista[0]!;
    expect(fin.numeros).toMatchObject({ previstoCents: 250_000, atrasadoCents: 250_000, inadimplentes: 1 });
    expect(f).toMatchObject({ mostrada: "ATRASADA", lembrete: null });
    await expect(gerarLinkDePagamento(ctx.db, admin, f.id)).rejects.toThrow(/Conecte/);
    await expect(conectarMercadoPago(ctx.db, admin, "APP_USR-token-errado-1234567890", (async () => new Response(JSON.stringify({ message: "invalid_token" }), { status: 401 })) as typeof fetch)).rejects.toThrow(/recusou esse access token/);
    const estado: { pago?: { ref: string; valor: number } } = {};
    await conectarMercadoPago(ctx.db, admin, "APP_USR-1234567890-abcdefghijk", fakeMp(estado));
    const ag = await ctx.db.query.agencias.findFirst({ where: eq(agencias.id, a.agenciaId) });
    expect(ag!.mpTokenEnc).not.toContain("APP_USR"); // nunca em texto puro
    expect((await gerarLinkDePagamento(ctx.db, admin, f.id, { fetchImpl: fakeMp(estado) })).checkoutUrl).toBe("https://mp.example/pagar/1");
    expect(await conferirPagamento(ctx.db, f.id, fakeMp(estado))).toEqual({ paga: false });
    estado.pago = { ref: f.id, valor: 100_000 };
    await expect(conferirPagamento(ctx.db, f.id, fakeMp(estado))).rejects.toThrow(/menor/);
    estado.pago = { ref: f.id, valor: 250_000 };
    expect(await conferirPagamento(ctx.db, f.id, fakeMp(estado))).toEqual({ paga: true });
    expect(await conferirPagamento(ctx.db, f.id, fakeMp(estado))).toEqual({ paga: true });
    const depois = await financeiroDaAgencia(ctx.db, admin, "2026-11", "2026-11-17");
    expect(depois.numeros).toMatchObject({ recebidoCents: 250_000, atrasadoCents: 0, inadimplentes: 0 });
    expect(depois.lista[0]).toMatchObject({ situacao: "PAGA", pagoComo: "SISTEMA", mpPaymentId: "99" });
  });

  it("avulsa, baixa manual com observação, cancelamento e pendências na fila do dia; outra agência não mexe", async () => {
    const a = await criarAgencia(ctx.db, ctx.actors.master, { nome: "UPClips", responsavel: { nome: "Léo", email: "leo2@up.com.br", senha: "senha-provisoria" } });
    const b = await criarAgencia(ctx.db, ctx.actors.master, { nome: "Outra", responsavel: { nome: "Ana", email: "ana@outra.com.br", senha: "senha-provisoria" } });
    const admin = await ator(a.userId); const outra = await ator(b.userId);
    const c = await criarCliente(ctx.db, admin, { nome: "Padaria Sol" });
    const av = await criarCobrancaAvulsa(ctx.db, admin, { clienteId: c.id, descricao: "Gravação extra", valorCents: 50_000, vencimento: "2026-11-20" });
    const av2 = await criarCobrancaAvulsa(ctx.db, admin, { clienteId: c.id, descricao: "Diária", valorCents: 80_000, vencimento: "2026-11-15" });
    expect(await pendenciasDeCobranca(ctx.db, admin, "2026-11-17")).toEqual({ atrasadas: 1, atrasadoCents: 80_000, lembrar: 1 });
    await expect(marcarPagaManual(ctx.db, outra, av.id, "Pix na conta")).rejects.toThrow(/não encontrada/);
    await marcarPagaManual(ctx.db, admin, av.id, "Pix direto na conta");
    await expect(cancelarCobranca(ctx.db, admin, av.id, "erro")).rejects.toThrow(/em aberto/);
    await cancelarCobranca(ctx.db, admin, av2.id, "Combinado com o cliente");
    expect(await pendenciasDeCobranca(ctx.db, admin, "2026-11-17")).toEqual({ atrasadas: 0, atrasadoCents: 0, lembrar: 0 });
    const fin = await financeiroDaAgencia(ctx.db, admin, "2026-11", "2026-11-17");
    expect(fin.lista.find((x) => x.id === av.id)).toMatchObject({ situacao: "PAGA", pagoComo: "MANUAL", observacao: "Pix direto na conta" });
    expect(fin.numeros.previstoCents).toBe(50_000);
  });
});

describe("despesas e margem por cliente (D319)", () => {
  beforeEach(async () => { ctx = await freshDb(); });
  it("lança, copia as recorrentes sem duplicar, calcula resultado e margem por cliente; editor não mexe", async () => {
    const { lancarDespesa, copiarRecorrentes, resultadoDoMes, excluirDespesa, marcarDespesaPaga } = await import("@/lib/agencias/despesas");
    const a = await criarAgencia(ctx.db, ctx.actors.master, { nome: "UPClips", responsavel: { nome: "Léo", email: "leo3@up.com.br", senha: "senha-provisoria" } });
    const admin = await ator(a.userId);
    const editor = await ator((await convidarMembro(ctx.db, admin, { nome: "Gu", email: "gu3@up.com.br", senha: "senha-provisoria", funcao: "EDICAO" })).userId);
    const c1 = await criarCliente(ctx.db, admin, { nome: "CCV Vidros", valorMensalCents: 300_000, diaVencimento: 10 });
    const c2 = await criarCliente(ctx.db, admin, { nome: "Padaria Sol", valorMensalCents: 100_000, diaVencimento: 10 });
    await gerarCobrancasDoMes(ctx.db, admin, "2026-11");
    await lancarDespesa(ctx.db, admin, { competencia: "2026-10", descricao: "Aluguel do estúdio", categoria: "FIXO", valorCents: 50_000, recorrente: true, pago: true });
    expect(await copiarRecorrentes(ctx.db, admin, "2026-11")).toEqual({ copiadas: 1 });
    expect(await copiarRecorrentes(ctx.db, admin, "2026-11")).toEqual({ copiadas: 0 });
    const freela = await lancarDespesa(ctx.db, admin, { competencia: "2026-11", descricao: "Captação Felipe", categoria: "FREELANCER", valorCents: 40_000, clienteId: c1.id, favorecido: "Felipe" });
    await lancarDespesa(ctx.db, admin, { competencia: "2026-11", descricao: "Diária extra", categoria: "FREELANCER", valorCents: 120_000, clienteId: c2.id });
    await expect(lancarDespesa(ctx.db, editor, { competencia: "2026-11", descricao: "x", categoria: "OUTRO", valorCents: 1 })).rejects.toThrow(/financeiro/);
    const r = await resultadoDoMes(ctx.db, admin, "2026-11");
    expect(r).toMatchObject({ faturadoCents: 400_000, despesasCents: 210_000, resultadoCents: 190_000, margemPct: 48 });
    expect(r.porCliente.map((x) => [x.nome, x.margemPct])).toEqual([["Padaria Sol", -20], ["CCV Vidros", 87]]);
    await marcarDespesaPaga(ctx.db, admin, freela.id, true);
    await expect(excluirDespesa(ctx.db, admin, freela.id)).rejects.toThrow(/já paga/);
  });
});
