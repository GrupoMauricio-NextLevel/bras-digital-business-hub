import { afterEach, describe, expect, it } from "vitest";
import { allowLoginAttempt } from "@/lib/security/login-limit";
import { createPreference, getPayment, MercadoPagoError, type FetchLike } from "@/lib/payments/mercadopago";
import { melhorEnvioProvider } from "@/lib/shipping/quote";

const hang: FetchLike = (_url, init) => new Promise((_resolve, reject) => { init?.signal?.addEventListener("abort", () => reject(init.signal!.reason)); });
afterEach(() => { delete process.env.EXTERNAL_TIMEOUT_MS; delete process.env.EXTERNAL_RETRY_DELAY_MS; });

describe("FS.1 limite de tentativas no login", () => {
  it("a nona tentativa para o mesmo e-mail é recusada; a janela libera depois; e-mails diferentes não se bloqueiam", () => {
    const t0 = 1_000_000;
    for (let i = 0; i < 8; i++) expect(allowLoginAttempt("10.0.0.1", "Ana@Exemplo.com", t0 + i)).toBe(true);
    expect(allowLoginAttempt("10.0.0.1", "ana@exemplo.com", t0 + 9)).toBe(false); // mesma pessoa, maiúsculas diferentes
    expect(allowLoginAttempt("10.0.0.1", "outra@exemplo.com", t0 + 10)).toBe(true);
    expect(allowLoginAttempt("10.0.0.1", "ana@exemplo.com", t0 + 16 * 60_000)).toBe(true); // passou a janela
  });
  it("o mesmo endereço (IP) é limitado a 20 tentativas mesmo trocando o e-mail", () => {
    const t0 = 5_000_000; let ok = 0;
    for (let i = 0; i < 25; i++) if (allowLoginAttempt("10.0.0.2", `u${i}@exemplo.com`, t0 + i)) ok++;
    expect(ok).toBe(20);
  });
});

describe("FS.3 tempo máximo nas chamadas externas", () => {
  it("Mercado Pago que não responde vira erro semântico em vez de travar", async () => {
    process.env.EXTERNAL_TIMEOUT_MS = "50";
    const t = Date.now();
    await expect(getPayment("token", "123", hang)).rejects.toMatchObject({ name: "MercadoPagoError", status: 504 });
    expect(Date.now() - t).toBeLessThan(2000);
  });
  it("cotação de frete que não responde não trava", async () => {
    process.env.EXTERNAL_TIMEOUT_MS = "50";
    const p = melhorEnvioProvider("token", hang, "http://localhost");
    const t = Date.now();
    await expect(p.quote({ fromZip: "01001000", toZip: "20040020", parcel: { widthCm: 10, heightCm: 10, lengthCm: 10, weightG: 500 }, insuranceCents: 1000 } as never)).rejects.toBeDefined();
    expect(Date.now() - t).toBeLessThan(2000);
  });
  it("sem a variável, o limite padrão é de 10 segundos", async () => {
    const { externalTimeoutMs } = await import("@/lib/http-timeout");
    expect(externalTimeoutMs()).toBe(10_000);
  });
});
void MercadoPagoError;

const reply = (status: number, body: unknown): Response => new Response(JSON.stringify(body), { status });

describe("repetição limitada das chamadas ao Mercado Pago", () => {
  it("leitura repete em falha temporária e passa na 3ª; cobrança (POST) nunca repete", async () => {
    process.env.EXTERNAL_RETRY_DELAY_MS = "0";
    let reads = 0;
    const flaky: FetchLike = async () => { reads++; return reads < 3 ? reply(503, { message: "indisponível" }) : reply(200, { id: 9, status: "approved", external_reference: "o1", transaction_amount: 10 }); };
    expect((await getPayment("token", "9", flaky)).status).toBe("approved");
    expect(reads).toBe(3);
    let reads2 = 0;
    await expect(getPayment("token", "9", async () => { reads2++; return reply(503, {}); })).rejects.toMatchObject({ name: "MercadoPagoError", status: 503 });
    expect(reads2).toBe(3);
    let posts = 0;
    await expect(createPreference("token", { orderId: "o1", orderNumber: 1, storeName: "Loja", items: [{ id: "i", title: "Item", quantity: 1, unitPriceCents: 1000 }], shippingCents: 0, payer: { name: "Cli Teste", email: "a@b.co" } }, async () => { posts++; return reply(503, {}); })).rejects.toBeInstanceOf(MercadoPagoError);
    expect(posts).toBe(1);
  });
  it("erro de credencial (401) não é repetido", async () => {
    process.env.EXTERNAL_RETRY_DELAY_MS = "0";
    let n = 0;
    await expect(getPayment("token", "9", async () => { n++; return reply(401, {}); })).rejects.toMatchObject({ status: 401 });
    expect(n).toBe(1);
  });
});
