import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { trafegoSessoes } from "@/db/schema";
import { ipDaRequisicao, localDaRequisicao, localDoIp } from "@/lib/trafego/geo";
import { limparExtras, modeloDe, navegadorDe, sistemaDe } from "@/lib/trafego/dispositivo";
import { agoraNoSite, nomeDoLocal, origensPorCanal, registrarSinal } from "@/lib/domain/trafego/coletor";

/** D292: cidade aproximada pelo IP (sem guardar o IP) e aparelho em detalhe, para as notificações em tempo real. */
describe("cidade pelo IP", () => {
  it("acha cidade e UF no Brasil, país fora dele, nada para IP interno ou inválido (IPv4 e IPv6)", () => {
    expect(localDoIp("200.147.67.142")).toEqual({ cidade: "Fortaleza", uf: "CE", pais: "BR" });
    expect(localDoIp("::ffff:189.6.0.1")).toEqual({ cidade: "Brasília", uf: "DF", pais: "BR" });
    expect(localDoIp("2804:14c::1")).toMatchObject({ uf: "SP", pais: "BR" });
    expect(localDoIp("8.8.8.8")).toEqual({ cidade: null, uf: null, pais: "US" });
    for (const x of ["192.168.0.1", "10.0.0.1", "lixo", "", null, "999.1.1.1", "1:2:3:4:5:6:7:8:9"]) expect(localDoIp(x)).toEqual({ cidade: null, uf: null, pais: null });
  });
  it("prefere o IP da rede de entrega e a cidade que ela informar", () => {
    expect(ipDaRequisicao(new Headers({ "cf-connecting-ip": "200.147.67.142", "x-forwarded-for": "1.1.1.1, 2.2.2.2" }))).toBe("200.147.67.142");
    expect(ipDaRequisicao(new Headers({ "x-forwarded-for": "189.6.0.1, 10.0.0.1" }))).toBe("189.6.0.1");
    expect(localDaRequisicao(new Headers({ "cf-ipcity": "Campinas", "cf-ipcountry": "BR", "cf-region-code": "SP" }))).toEqual({ cidade: "Campinas", uf: "SP", pais: "BR" });
    expect(localDaRequisicao(new Headers({ "cf-connecting-ip": "10.0.0.1", "cf-ipcountry": "PT" }))).toEqual({ cidade: null, uf: null, pais: "PT" });
    expect(localDaRequisicao(new Headers({ "cf-connecting-ip": "200.147.67.142", "cf-ipcountry": "BR" }))).toMatchObject({ cidade: "Fortaleza", uf: "CE" });
  });
  it("nome do local para a tela", () => {
    expect(nomeDoLocal({ cidade: "Campinas", uf: "SP", pais: "BR" })).toBe("Campinas/SP");
    expect(nomeDoLocal({ cidade: null, uf: "SP", pais: "BR" })).toBe("SP (cidade não identificada)");
    expect(nomeDoLocal({ cidade: null, uf: null, pais: "US" })).toBe("Exterior (US)");
    expect(nomeDoLocal({ cidade: null, uf: null, pais: null })).toBe("Não identificado");
  });
});

describe("aparelho em detalhe", () => {
  const IG = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 320.0.0.0";
  const FB = "Mozilla/5.0 (Linux; Android 13; SM-A536E Build/TP1A.220624.014; wv) AppleWebKit/537.36 Chrome/119 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/440.0.0.0;]";
  const CHROME_A = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36";
  const SAMSUNG = "Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/25.0 Chrome/121 Mobile Safari/537.36";
  const WIN = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36 Edg/130.0";
  const MAC = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15";
  it("sistema, navegador (inclusive o de dentro dos apps) e modelo", () => {
    expect([sistemaDe(IG), navegadorDe(IG), modeloDe(IG)]).toEqual(["iOS 17.4", "App do Instagram", "iPhone"]);
    expect([sistemaDe(FB), navegadorDe(FB), modeloDe(FB)]).toEqual(["Android 13", "App do Facebook", "SM-A536E"]);
    expect([sistemaDe(CHROME_A), navegadorDe(CHROME_A), modeloDe(CHROME_A)]).toEqual(["Android 10", "Chrome", null]);
    expect([sistemaDe(CHROME_A, "14.0.0"), modeloDe(CHROME_A, "Moto G84")]).toEqual(["Android 14", "Moto G84"]);
    expect([sistemaDe(SAMSUNG), navegadorDe(SAMSUNG), modeloDe(SAMSUNG)]).toEqual(["Android 14", "Samsung Internet", "SM-S918B"]);
    expect([sistemaDe(WIN), navegadorDe(WIN)]).toEqual(["Windows", "Edge"]);
    expect([sistemaDe(MAC), navegadorDe(MAC)]).toEqual(["macOS", "Safari"]);
    expect(navegadorDe("Mozilla/5.0 (Linux; Android 12) BytedanceWebview/d8a21c6 musical_ly_2023")).toBe("App do TikTok");
  });
  it("extras do navegador só no formato esperado", () => {
    expect(limparExtras({ w: 390, h: 844, l: "pt-BR", m: "Moto G84", pv: "14.0.0", rede: "4g" })).toEqual({ tela: "390×844", idioma: "pt-BR", modelo: "Moto G84", versaoSistema: "14.0.0", rede: "4g" });
    expect(limparExtras({ w: -1, h: "x", l: "<script>", pv: "abc", rede: "satélite" })).toEqual({ tela: null, idioma: null, modelo: null, versaoSistema: null, rede: null });
    expect(limparExtras(null)).toMatchObject({ tela: null });
  });
});

describe("visita com cidade e aparelho", () => {
  let ctx: Awaited<ReturnType<typeof freshDb>>;
  beforeEach(async () => { ctx = await freshDb(); });
  it("a sessão guarda cidade, UF, sistema, navegador, modelo, tela e rede (nunca o IP) e aparece em Agora e Origens", async () => {
    const T = new Date("2026-11-13T15:00:00Z");
    const r = (await registrarSinal(ctx.db, {
      brand: "NEXTLEVEL_COMMERCE", visitanteId: "v_aaaaaaaaaaaaaaaa", sessaoId: null, tipo: "PAGE_VIEW", caminho: "/planos", busca: "?utm_source=meta&utm_medium=pago",
      ua: "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36",
      local: { cidade: "Campinas", uf: "SP", pais: "BR" }, extras: { w: 412, h: 915, l: "pt-BR", m: "Moto G84", pv: "14.0.0", rede: "4g" },
    }, T))!;
    const s = (await ctx.db.query.trafegoSessoes.findFirst({ where: eq(trafegoSessoes.id, r.sessaoId) }))!;
    expect(s).toMatchObject({ cidade: "Campinas", uf: "SP", pais: "BR", sistema: "Android 14", navegador: "Chrome", modelo: "Moto G84", tela: "412×915", idioma: "pt-BR", rede: "4g", aparelho: "MOBILE" });
    expect(JSON.stringify(s)).not.toMatch(/\d+\.\d+\.\d+\.\d+/);
    const a = await agoraNoSite(ctx.db, ctx.actors.master, new Date(T.getTime() + 60_000));
    expect(a.porCidade).toEqual([{ chave: "Campinas/SP", total: 1 }]);
    expect(a.entradas[0]).toMatchObject({ cidade: "Campinas", uf: "SP", sistema: "Android 14", modelo: "Moto G84", navegador: "Chrome" });
    const o = await origensPorCanal(ctx.db, ctx.actors.master, 7, new Date(T.getTime() + 60_000));
    expect(o.cidades).toEqual([{ local: "Campinas/SP", sessoes: 1, leads: 0 }]);
  });
});
