import { describe, expect, it } from "vitest";
import { correiosProvider, frenetProvider, kanguProvider } from "@/lib/shipping/quote";
import { lerContratoCorreios, NOVAS_PLATAFORMAS_DE_ENVIO, verifyShippingToken } from "@/lib/shipping/providers";

/** Rodada B das integrações (D190): Frenet, Kangu e Correios com contrato, com respostas simuladas (fetch falso). */
const json = (body: unknown, status = 200) => Promise.resolve(new Response(JSON.stringify(body), { status }));
const req = { fromZip: "01001000", toZip: "20040002", parcel: { weightG: 600, lengthCm: 20, widthCm: 15, heightCm: 6, insuranceCents: 12990 } };
type Chamada = { url: string; body: string; h: Record<string, string> };
const espiao = (resp: (url: string) => Promise<Response>) => {
  const calls: Chamada[] = [];
  const f = (async (url: string, init: RequestInit = {}) => { calls.push({ url: String(url), body: String(init.body ?? ""), h: (init.headers ?? {}) as Record<string, string> }); return resp(String(url)); }) as unknown as typeof fetch;
  return { calls, f };
};

describe("Frenet", () => {
  it("cota com o cabeçalho token, em kg e reais, e ignora serviço com erro", async () => {
    const { calls, f } = espiao(() => json({ ShippingSevicesArray: [{ ServiceCode: "04014", ServiceDescription: "SEDEX", Carrier: "Correios", ShippingPrice: "41.50", DeliveryTime: "2" }, { ServiceCode: "J1", Carrier: "Jadlog", ServiceDescription: ".Package", ShippingPrice: "28.90", DeliveryTime: "5" }, { ServiceCode: "X", Error: true, Msg: "fora da área" }] }));
    const r = await frenetProvider("tok-frenet", f).quote(req);
    expect(r).toEqual([
      { serviceId: "FR:04014", carrier: "Correios", name: "Correios SEDEX", priceCents: 4150, days: 2 },
      { serviceId: "FR:J1", carrier: "Jadlog", name: "Jadlog .Package", priceCents: 2890, days: 5 },
    ]);
    expect(calls[0]!.url).toMatch(/\/shipping\/quote$/);
    expect(calls[0]!.h.token).toBe("tok-frenet");
    expect(JSON.parse(calls[0]!.body)).toMatchObject({ SellerCEP: "01001000", RecipientCEP: "20040002", ShipmentInvoiceValue: 129.9, ShippingItemArray: [{ Weight: 0.6 }] });
  });
});

describe("Kangu", () => {
  it("cota pela simulação e mostra a transportadora", async () => {
    const { calls, f } = espiao(() => json([{ vlrFrete: 19.9, prazoEnt: 6, transp_nome: "Jadlog", descricao: "Econômico", referencia: "jad_1" }, { vlrFrete: null, transp_nome: "Sem preço" }]));
    expect(await kanguProvider("tok-kangu", f).quote(req)).toEqual([{ serviceId: "KG:jad_1", carrier: "Jadlog", name: "Jadlog Econômico", priceCents: 1990, days: 6 }]);
    expect(calls[0]!.h.token).toBe("tok-kangu");
    expect(JSON.parse(calls[0]!.body)).toMatchObject({ cepOrigem: "01001000", cepDestino: "20040002", pesoMerc: 0.6, vlrMerc: 129.9 });
  });
});

describe("Correios com contrato", () => {
  const credencial = JSON.stringify({ usuario: "12345678000190", codigo: "codigo-de-acesso", cartao: "0075.123.456" });
  it("lê o contrato e recusa contrato incompleto", () => {
    expect(lerContratoCorreios(credencial)).toEqual({ usuario: "12345678000190", codigo: "codigo-de-acesso", cartao: "0075123456" });
    expect(lerContratoCorreios(JSON.stringify({ usuario: "x", codigo: "" , cartao: "1" }))).toBeNull();
    expect(lerContratoCorreios("não é json")).toBeNull();
  });

  it("pede o token com o cartão, cota SEDEX e PAC com preço em reais com vírgula e o prazo", async () => {
    const { calls, f } = espiao((url) => {
      if (url.includes("/token/")) return json({ token: "tok-correios", cartaoPostagem: { contrato: "9912345678" } });
      if (url.includes("/preco/v1/nacional/03220")) return json({ pcFinal: "1.025,50" });
      if (url.includes("/preco/v1/nacional/03298")) return json({ pcFinal: "22,40" });
      if (url.includes("/prazo/v1/nacional/03220")) return json({ prazoEntrega: 1 });
      return json({ txErro: "sem prazo" }, 400);
    });
    const r = await correiosProvider(credencial, f).quote(req);
    expect(r).toEqual([
      { serviceId: "CO:03220", carrier: "Correios", name: "Correios SEDEX", priceCents: 102550, days: 1 },
      { serviceId: "CO:03298", carrier: "Correios", name: "Correios PAC", priceCents: 2240, days: null },
    ]);
    const tok = calls.find((c) => c.url.includes("/token/"))!;
    expect(tok.h.Authorization).toBe(`Basic ${Buffer.from("12345678000190:codigo-de-acesso").toString("base64")}`);
    expect(JSON.parse(tok.body)).toEqual({ numero: "0075123456" });
    const preco = calls.find((c) => c.url.includes("/preco/v1/nacional/03298"))!;
    expect(preco.h.Authorization).toBe("Bearer tok-correios");
    expect(preco.url).toContain("psObjeto=600");
  });

  it("verificação: conecta mostrando o contrato; credencial recusada vira mensagem clara", async () => {
    expect(await verifyShippingToken("CORREIOS", credencial, espiao(() => json({ token: "t", cartaoPostagem: { contrato: "9912345678" } })).f)).toEqual({ account: "contrato 9912345678" });
    await expect(verifyShippingToken("CORREIOS", credencial, espiao(() => json({}, 401)).f)).rejects.toThrow(/recusaram/);
    await expect(verifyShippingToken("CORREIOS", "{}", espiao(() => json({})).f)).rejects.toThrow(/Preencha/);
  });
});

describe("verificação de Frenet e Kangu e regra de uso", () => {
  it("token aceito conecta; recusado avisa; as três são só da E-commerce", async () => {
    expect(await verifyShippingToken("FRENET", "tok", espiao(() => json([])).f)).toEqual({ account: "token Frenet conferido" });
    const k = espiao(() => json([]));
    expect(await verifyShippingToken("KANGU", "tok", k.f)).toEqual({ account: "token Kangu conferido" });
    expect(k.calls[0]!.h.token).toBe("tok");
    await expect(verifyShippingToken("FRENET", "tok", espiao(() => json({}, 401)).f)).rejects.toThrow(/recusou o token/);
    expect([...NOVAS_PLATAFORMAS_DE_ENVIO].sort()).toEqual(["CORREIOS", "FRENET", "KANGU"]);
  });
});
