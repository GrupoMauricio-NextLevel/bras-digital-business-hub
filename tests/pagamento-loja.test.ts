import { describe, expect, it } from "vitest";
import { createPreference, type FetchLike } from "@/lib/payments/mercadopago";
import { lojaAceitaCartao, MAX_PARCELAS_LOJA, parcelasDaLoja } from "@/lib/pagamento-loja";

/** D178: a loja da Commerce aceita Pix e cartão em até 6x; o SuperDrop continua só Pix (D22). */
async function corpoEnviado(maxParcelas?: number) {
  let sent: { payment_methods: { installments?: number; excluded_payment_types: { id: string }[] } } | null = null;
  const fetchImpl: FetchLike = async (_url, init) => { sent = JSON.parse(String(init?.body)); return new Response(JSON.stringify({ id: "p", init_point: "https://mp.test/p" }), { status: 200 }); };
  await createPreference("TEST-x", { orderId: "o", orderNumber: 1, storeName: "Loja", items: [{ id: "i", title: "Blusa", quantity: 1, unitPriceCents: 14990 }], shippingCents: 0, payer: { name: "Ana", email: "a@a.com" }, maxParcelas }, fetchImpl);
  const pm = sent!.payment_methods;
  return { excluidos: pm.excluded_payment_types.map((x) => x.id), parcelas: pm.installments };
}

describe("formas de pagamento da loja (D178)", () => {
  it("só a Commerce aceita cartão, em até 6x", () => {
    expect(lojaAceitaCartao("NEXTLEVEL_COMMERCE")).toBe(true);
    expect(lojaAceitaCartao(null)).toBe(false);
    expect(parcelasDaLoja("NEXTLEVEL_COMMERCE")).toBe(6);
    expect(MAX_PARCELAS_LOJA).toBe(6);
  });

  it("Commerce: a preferência libera cartão de crédito com 6 parcelas e continua sem débito, boleto ou saldo", async () => {
    const r = await corpoEnviado(parcelasDaLoja("NEXTLEVEL_COMMERCE"));
    expect(r.excluidos).not.toContain("credit_card");
    expect(r.excluidos).toEqual(expect.arrayContaining(["debit_card", "ticket", "atm", "prepaid_card", "account_money"]));
    expect(r.parcelas).toBe(6);
  });

  it("Commerce: a preferência continua só Pix quando a loja não aceita cartão", async () => {
    const r = await corpoEnviado(parcelasDaLoja(null));
    expect(r.excluidos).toEqual(expect.arrayContaining(["credit_card", "debit_card", "ticket", "atm", "prepaid_card", "account_money"]));
    expect(r.parcelas).toBeUndefined();
  });
});
