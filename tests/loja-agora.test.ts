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

import { crescimentoAgora, lojistasAgora, receitaAgora } from "@/lib/domain/master-agora";
import type { SituacaoComercial } from "@/lib/domain/situacao-comercial";

const sit = (pagamento: SituacaoComercial["pagamento"], diasParaVencer: number | null): SituacaoComercial => ({ pagamento, rotulo: pagamento, plano: "Start", ciclo: "MONTHLY", valorCents: 14900, venceEm: null, diasParaVencer });

describe("Precisa de você do Master (D215)", () => {
  it("receita: vencido, aguardando e teste acabando, renovação em azul; pagante longe fica de fora", () => {
    const r = receitaAgora([{ id: "a", nome: "A", s: sit("pagante", 20) }, { id: "b", nome: "B", s: sit("teste", 2) }, { id: "c", nome: "C", s: sit("vencido", -3) }, { id: "d", nome: "D", s: sit("aguardando", null) }, { id: "e", nome: "E", s: sit("pagante", 2) }]);
    expect(r.map((x) => [x.id, x.tom])).toEqual([["c", "danger"], ["b", "warning"], ["d", "warning"], ["e", "info"]]);
    expect(r[0]!.href).toBe("/master/comercial/loja%3Ac");
  });
  it("lojistas: rascunho parado e publicada sem Mercado Pago", () => {
    const r = lojistasAgora([
      { id: "a", nome: "A", publicada: false, criadaEm: em(-5), pagamentoLoja: "NOT_CONFIGURED", s: sit("teste", 5) },
      { id: "b", nome: "B", publicada: true, criadaEm: em(-10), pagamentoLoja: "NOT_CONFIGURED", s: sit("pagante", 20) },
      { id: "c", nome: "C", publicada: false, criadaEm: em(-1), pagamentoLoja: "NOT_CONFIGURED", s: sit("teste", 6) },
      { id: "d", nome: "D", publicada: true, criadaEm: em(-10), pagamentoLoja: "CONNECTED", s: sit("pagante", 20) },
    ], agora);
    expect(r.map((x) => x.id)).toEqual(["a", "b"]);
  });
  it("lojistas: domínio próprio aguardando ativação aparece para a equipe, com o caminho certo", () => {
    const base = { publicada: true, criadaEm: em(-10), pagamentoLoja: "CONNECTED", s: sit("pagante", 20) };
    const r = lojistasAgora([{ id: "v", nome: "Vestiário", ...base, dominio: "vestiariodaslendas.com.br", dominioStatus: "PENDING" }, { id: "w", nome: "W", ...base, dominio: "w.com.br", dominioStatus: "CONNECTED" }], agora);
    expect(r.map((x) => x.id)).toEqual(["v-dominio"]);
    expect(r[0]!.detalhe).toMatch(/Custom Domains/);
    expect(lojistasAgora([{ id: "v", nome: "V", ...base, dominio: "v.com.br", dominioStatus: "PENDING" }], agora, true)[0]!.detalhe).toMatch(/Cadastrado na hospedagem/);
  });
  it("crescimento: Mercado Pago primeiro, depois e-mail e IA", () => {
    expect(crescimentoAgora({ mp: { connected: false }, emailLigado: false, iaComChave: false, iaUsoReal: false }).map((x) => x.id)).toEqual(["mp", "email", "ia"]);
    expect(crescimentoAgora({ mp: { connected: true }, emailLigado: true, iaComChave: true, iaUsoReal: true })).toEqual([]);
  });
});
