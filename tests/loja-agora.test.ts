import { describe, expect, it } from "vitest";
import { avaliacoesAgora, campanhasAgora, cuponsAgora, financeiroAgora, lojaVirtualAgora } from "@/lib/domain/loja-agora";

const agora = new Date("2026-10-29T12:00:00Z");
const em = (d: number) => new Date(agora.getTime() + d * 86_400_000).toISOString();

describe("Precisa de você das telas do lojista (D212)", () => {
  it("financeiro: Mercado Pago e fatura vencida em vermelho antes do teste e do a receber", () => {
    const r = financeiroAgora({ faturas: [{ id: "f1", description: "Plano", amountCents: 14900, dueDate: em(-2), status: "OVERDUE" }], assinatura: { status: "trial", trialEndsAt: em(4) }, pagamento: { key: "payment", ok: false, blocking: true, label: "x", detail: "Mercado Pago ainda não conectado.", fixHref: "/merchant/settings#payments" }, aReceberCents: 5000, aReceberPedidos: 1 }, agora);
    expect(r.map((x) => [x.id, x.tom])).toEqual([["pagamento", "danger"], ["fatura-f1", "danger"], ["teste", "warning"], ["receber", "info"]]);
  });
  it("minha loja: só o que falta, bloqueante em vermelho", () => {
    const r = lojaVirtualAgora([{ key: "a", ok: true, blocking: true, label: "A", detail: "", fixHref: "/a" }, { key: "b", ok: false, blocking: false, label: "B", detail: "", fixHref: "/b" }, { key: "c", ok: false, blocking: true, label: "C", detail: "", fixHref: "/c" }]);
    expect(r.map((x) => x.id)).toEqual(["c", "b"]);
  });
  it("cupons: esgotado e vencido ligados, vencendo em 7 dias; desligado fica de fora", () => {
    const r = cuponsAgora([
      { id: "1", code: "A", active: true, expiresAt: em(3), maxRedemptions: null, redemptions: 0 },
      { id: "2", code: "B", active: true, expiresAt: null, maxRedemptions: 10, redemptions: 10 },
      { id: "3", code: "C", active: true, expiresAt: em(-1), maxRedemptions: null, redemptions: 0 },
      { id: "4", code: "D", active: false, expiresAt: em(-1), maxRedemptions: null, redemptions: 0 },
      { id: "5", code: "E", active: true, expiresAt: em(30), maxRedemptions: null, redemptions: 0 },
    ], agora);
    expect(r.map((x) => x.id)).toEqual(["2", "3", "1"]);
  });
  it("avaliações: só pendentes, nota baixa primeiro", () => {
    const r = avaliacoesAgora([{ id: "a", product: "P", author: "Ana", rating: 5, status: "PENDING" }, { id: "b", product: "P", author: "Bia", rating: 1, status: "PENDING" }, { id: "c", product: "P", author: "Cris", rating: 2, status: "APPROVED" }]);
    expect(r.map((x) => x.id)).toEqual(["b", "a"]);
  });
  it("campanhas: avisa quando não há faixa no ar e quando uma termina em 24 h", () => {
    expect(campanhasAgora([], agora).map((x) => x.id)).toEqual(["nenhuma"]);
    expect(campanhasAgora([{ id: "x", text: "Frete grátis", startsAt: em(-1), endsAt: em(0.5) }], agora).map((x) => x.id)).toEqual(["x"]);
  });
});
