import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { auditLog, catalogPriceVersions, conversoesEnvio, nlSubscriptions, platformSettings } from "@/db/schema";
import { createBrandLead } from "@/lib/domain/brand-leads";
import { registrarOrigemDoContato, vincularCodigoVisita } from "@/lib/domain/trafego/origem-contato";
import { registrarSinal } from "@/lib/domain/trafego/coletor";
import { salvarTagsAnuncio } from "@/lib/domain/trafego/tags";
import { _esquecerAcessoGoogle, configRetorno, enfileirarPagantes, enviarConversoes, reenviarConversao, salvarConfigRetorno } from "@/lib/domain/trafego/retorno";
import { salvarAcompanhamento } from "@/lib/domain/comercial";
import { newId } from "@/lib/ids";
import { ensureCatalogSeed } from "@/lib/domain/nl-catalog";

/** TR5 (D296): fila de retorno à Meta e ao Google; nada sai sem configuração; dados pessoais só em resumo; token nunca exposto. */
let ctx: Awaited<ReturnType<typeof freshDb>>;
beforeEach(async () => { ctx = await freshDb(); _esquecerAcessoGoogle(); });

const UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Instagram 320.0";
const fila = async () => ctx.db.select().from(conversoesEnvio).orderBy(conversoesEnvio.plataforma);
type Chamada = { url: string; init: RequestInit };
const fetchFalso = (resp: (url: string) => Response) => { const chamadas: Chamada[] = []; const f = (async (url: string | URL, init?: RequestInit) => { chamadas.push({ url: String(url), init: init ?? {} }); return resp(String(url)); }) as typeof fetch; return { f, chamadas }; };
async function leadComOrigem(o: { busca?: string; consentimento?: "SIM" | "NAO" | "SEM_ESCOLHA"; quando?: Date } = {}) {
  const quando = o.quando ?? new Date();
  const v = (await registrarSinal(ctx.db, { brand: "NEXTLEVEL_COMMERCE", visitanteId: `v_${"a".repeat(16)}`, sessaoId: null, tipo: "PAGE_VIEW", caminho: "/", busca: o.busca ?? "?utm_source=meta&utm_medium=pago&fbclid=IwAR1", ua: UA }, quando))!;
  const { id } = await createBrandLead(ctx.db, { brand: "NEXTLEVEL_COMMERCE", name: "Ana Souza", email: " Ana@Loja.Teste ", phone: "(11) 98888-7777" });
  await registrarOrigemDoContato(ctx.db, `interessado:${id}`, "NEXTLEVEL_COMMERCE", "FORMULARIO", { ultimo: {}, primeiro: {}, sessaoId: v.sessaoId, ua: UA, consentimento: o.consentimento ?? "SEM_ESCOLHA", fbp: "fb.1.1700000000000.123456" }, "/", quando);
  return `interessado:${id}`;
}
const ligarMeta = async (extra: Record<string, string> = {}) => {
  await salvarTagsAnuncio(ctx.db, ctx.actors.master, { metaPixelId: "123456789012345" });
  await salvarConfigRetorno(ctx.db, ctx.actors.master, { metaToken: "EAAsegredo123", ...extra });
};

describe("fila", () => {
  it("contato entra para a Meta; Google só com clique do Google; recusa no aviso bloqueia; não duplica", async () => {
    const chave = await leadComOrigem();
    expect((await fila()).map((l) => [l.plataforma, l.evento, l.status, l.eventoId])).toEqual([["GOOGLE", "LEAD", "IGNORADO", chave], ["META", "LEAD", "PENDENTE", chave]]);
    await vincularCodigoVisita(ctx.db, ctx.actors.master, chave, (await ctx.db.query.origensContato.findFirst())!.codigoVisita!);
    expect(await fila()).toHaveLength(2);
    await ctx.db.delete(conversoesEnvio);
    await leadComOrigem({ busca: "?gclid=Cj0K", consentimento: "NAO" });
    expect((await fila()).every((l) => l.status === "BLOQUEADO")).toBe(true);
  });

  it("negócio fechado vira VENDA com valor; pagante entra uma vez com a mensalidade", async () => {
    const chave = await leadComOrigem();
    await salvarAcompanhamento(ctx.db, ctx.actors.master, chave, "Equipe", { fechou: { valorCents: 199700, descricao: "Loja Pronta" } });
    const venda = (await fila()).find((l) => l.evento === "VENDA" && l.plataforma === "META")!;
    expect(venda).toMatchObject({ valorCents: 199700, eventoId: `venda:${chave}`, status: "PENDENTE" });

    const loja = ctx.seed.stores.mantos.id;
    await registrarOrigemDoContato(ctx.db, `loja:${loja}`, "NEXTLEVEL_COMMERCE", "CADASTRO", { ultimo: { utm_source: "meta", utm_medium: "pago" }, primeiro: {}, sessaoId: null });
    expect(await enfileirarPagantes(ctx.db)).toBe(0);
    await ensureCatalogSeed(ctx.db);
    const [pv] = await ctx.db.select({ id: catalogPriceVersions.id }).from(catalogPriceVersions).limit(1);
    await ctx.db.insert(nlSubscriptions).values({ id: newId("sub"), storeId: loja, productKey: "COMMERCE_PRO", cycle: "MONTHLY", status: "active", priceVersionId: pv!.id, amountCents: 24900, platformFeeBps: 70, currentPeriodEnd: new Date(Date.now() + 20 * 86_400_000).toISOString() } as never);
    expect(await enfileirarPagantes(ctx.db)).toBeGreaterThan(0);
    expect(await enfileirarPagantes(ctx.db)).toBe(0);
    expect((await fila()).find((l) => l.evento === "PAGANTE" && l.plataforma === "META")).toMatchObject({ valorCents: 24900, eventoId: `pagante:loja:${loja}` });
  });
});

describe("envio à Meta", () => {
  it("sem configuração espera sem gastar tentativa; configurado manda o Lead com resumos, sem o token no endereço", async () => {
    const chave = await leadComOrigem();
    const { f, chamadas } = fetchFalso(() => new Response("{}", { status: 200 }));
    await enviarConversoes(ctx.db, f);
    let m = (await fila()).find((l) => l.plataforma === "META")!;
    expect(m).toMatchObject({ status: "FALHOU", tentativas: 0 });
    expect(m.motivo).toMatch(/não configurada/);
    expect(chamadas).toHaveLength(0);

    await ligarMeta({ metaTesteCodigo: "TEST123" });
    await ctx.db.update(conversoesEnvio).set({ proximaTentativaEm: null });
    expect(await enviarConversoes(ctx.db, f)).toMatchObject({ enviados: 1 });
    m = (await fila()).find((l) => l.plataforma === "META")!;
    expect(m.status).toBe("ENVIADO");
    const { url, init } = chamadas[0]!;
    expect(url).toMatch(/^https:\/\/graph\.facebook\.com\/v\d+\.\d\/123456789012345\/events$/);
    expect(url).not.toMatch(/EAAsegredo/);
    const corpo = JSON.parse(String(init.body));
    expect(corpo).toMatchObject({ access_token: "EAAsegredo123", test_event_code: "TEST123" });
    const e = corpo.data[0];
    expect(e).toMatchObject({ event_name: "Lead", event_id: chave, action_source: "website", user_data: { client_user_agent: UA, fbp: "fb.1.1700000000000.123456" } });
    expect(e.user_data.em).toEqual([expect.stringMatching(/^[a-f0-9]{64}$/)]);
    expect(e.user_data.ph).toEqual([expect.stringMatching(/^[a-f0-9]{64}$/)]);
    expect(e.user_data.fbc).toMatch(/^fb\.1\.\d+\.IwAR1$/);
    expect(JSON.stringify(corpo)).not.toMatch(/ana@loja|98888/i);
  });

  it("erro da Meta fica em português, sem o token; 400 não insiste; fora de 7 dias é ignorado", async () => {
    await leadComOrigem();
    await ligarMeta();
    const { f } = fetchFalso(() => new Response('{"error":{"message":"Invalid parameter access_token=EAAsegredo123"}}', { status: 400 }));
    await enviarConversoes(ctx.db, f);
    const m = (await fila()).find((l) => l.plataforma === "META")!;
    expect(m).toMatchObject({ status: "FALHOU", proximaTentativaEm: null });
    expect(m.motivo).toMatch(/A Meta respondeu 400/);
    expect(m.motivo).not.toMatch(/EAAsegredo/);
    await reenviarConversao(ctx.db, ctx.actors.master, m.id);
    await ctx.db.update(conversoesEnvio).set({ ocorreuEm: new Date(Date.now() - 8 * 86_400_000).toISOString() });
    expect(await enviarConversoes(ctx.db, f)).toMatchObject({ ignorados: 1 });
  });
});

describe("envio ao Google", () => {
  it("com clique do Google: pega o acesso, manda a conversão com gclid, número do pedido e e-mail em resumo", async () => {
    const chave = await leadComOrigem({ busca: "?gclid=Cj0KCQ&utm_source=google&utm_medium=cpc" });
    await salvarConfigRetorno(ctx.db, ctx.actors.master, { googleClienteId: "123-456-7890", googleGerenteId: "987-654-3210", googleDevToken: "dev-tok", googleOauthClientId: "cli.apps.googleusercontent.com", googleOauthSecret: "seg", googleRefresh: "ref", googleAcaoLead: "555123456" });
    expect((await configRetorno(ctx.db)).google).toMatchObject({ pronto: true, clienteId: "1234567890", temDevToken: true });
    const { f, chamadas } = fetchFalso((u) => u.includes("oauth2") ? Response.json({ access_token: "ya29.x", expires_in: 3600 }) : Response.json({}));
    await enviarConversoes(ctx.db, f);
    expect((await fila()).find((l) => l.plataforma === "GOOGLE")!.status).toBe("ENVIADO");
    const up = chamadas.find((c) => c.url.includes("uploadClickConversions"))!;
    expect(up.url).toMatch(/googleads\.googleapis\.com\/v\d+\/customers\/1234567890:uploadClickConversions/);
    expect(up.init.headers).toMatchObject({ authorization: "Bearer ya29.x", "developer-token": "dev-tok", "login-customer-id": "9876543210" });
    const c = JSON.parse(String(up.init.body)).conversions[0];
    expect(c).toMatchObject({ conversionAction: "customers/1234567890/conversionActions/555123456", gclid: "Cj0KCQ", orderId: chave, currencyCode: "BRL" });
    expect(c.userIdentifiers[0].hashedEmail).toMatch(/^[a-f0-9]{64}$/);
  });
  it("recusa parcial do Google vira falha explicada", async () => {
    await leadComOrigem({ busca: "?gclid=Cj0KCQ" });
    await salvarConfigRetorno(ctx.db, ctx.actors.master, { googleClienteId: "1234567890", googleDevToken: "d", googleOauthClientId: "c", googleOauthSecret: "s", googleRefresh: "r", googleAcaoLead: "555123456" });
    const { f } = fetchFalso((u) => u.includes("oauth2") ? Response.json({ access_token: "t" }) : Response.json({ partialFailureError: { message: "The click is too old" } }));
    await enviarConversoes(ctx.db, f);
    expect((await fila()).find((l) => l.plataforma === "GOOGLE")).toMatchObject({ status: "FALHOU", motivo: "O Google recusou: The click is too old", proximaTentativaEm: null });
  });
});

describe("configuração", () => {
  it("só o dono; tokens guardados criptografados; a tela só sabe se existem; trilha sem valores", async () => {
    await expect(salvarConfigRetorno(ctx.db, { ...ctx.actors.master, masterFunction: "COMERCIAL" }, { metaToken: "x" })).rejects.toThrow(/função/);
    await expect(salvarConfigRetorno(ctx.db, ctx.actors.master, { googleClienteId: "123" })).rejects.toThrow(/10 algarismos/);
    await expect(salvarConfigRetorno(ctx.db, ctx.actors.master, { metaTesteCodigo: "abc" })).rejects.toThrow(/TEST/);
    await salvarConfigRetorno(ctx.db, ctx.actors.master, { metaToken: "EAAsegredo123", googleRefresh: "refresh-secreto" });
    const row = await ctx.db.query.platformSettings.findFirst({ where: eq(platformSettings.key, "trafego.retorno") });
    expect(JSON.stringify(row!.value)).not.toMatch(/EAAsegredo|refresh-secreto/);
    const cfg = await configRetorno(ctx.db);
    expect(cfg.meta).toMatchObject({ temToken: true, pronto: false });
    expect(JSON.stringify(cfg)).not.toMatch(/EAAsegredo|v1\./);
    // Vazio mantém; "-" apaga.
    await salvarConfigRetorno(ctx.db, ctx.actors.master, { metaToken: "" });
    expect((await configRetorno(ctx.db)).meta.temToken).toBe(true);
    await salvarConfigRetorno(ctx.db, ctx.actors.master, { metaToken: "-" });
    expect((await configRetorno(ctx.db)).meta.temToken).toBe(false);
    const trilha = JSON.stringify(await ctx.db.select().from(auditLog).where(eq(auditLog.action, "RETORNO_PLATAFORMAS")));
    expect(trilha).not.toMatch(/EAAsegredo|refresh-secreto|v1\./);
  });
});
