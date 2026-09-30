import { describe, it, expect } from "vitest";
import { amountFor, quote } from "@/lib/finance/pricing";

describe("preço: cartão cheio em até 6x, Pix com desconto", () => {
  it("R$ 299 → 6x de R$ 49,84 no cartão e R$ 269,10 no Pix (10%)", () => {
    const q = quote(29900, 1000);
    expect(q).toMatchObject({ listCents: 29900, pixCents: 26910, pixDiscountCents: 2990, pixDiscountPct: 10, installments: 6, installmentCents: 4984 });
    expect(amountFor(q, "CARD")).toBe(29900); expect(amountFor(q, "PIX")).toBe(26910);
  });
  it("sem desconto, o Pix custa o mesmo que a lista", () => expect(quote(69900, 0).pixCents).toBe(69900));
  it("as parcelas nunca somam menos que o preço", () => { for (const p of [29900, 69900, 149900, 12345]) { const q = quote(p, 1000); expect(q.installmentCents * q.installments).toBeGreaterThanOrEqual(p); } });
});
