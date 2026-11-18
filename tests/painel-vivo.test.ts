import { describe, expect, it } from "vitest";
import { comparaHoje, conversaoConfiavel, diaDaSemana, fatiasDeCanal, fraseDoPeriodo, miniSerie, serieDoPeriodo, variacao, type Dia } from "@/lib/domain/painel-vivo";
import { CORES_VIDA } from "@/components/vida/cores";

/** Série de N dias terminando em `fim` (AAAA-MM-DD), com os valores dados. */
function serie(fim: string, valores: number[]): Dia[] {
  const end = new Date(`${fim}T00:00:00Z`).getTime();
  return valores.map((cents, i) => ({ date: new Date(end - (valores.length - 1 - i) * 86_400_000).toISOString().slice(0, 10), cents }));
}

describe("painéis com vida (D331): regras do início do lojista", () => {
  it("variação só com base para comparar", () => {
    expect(variacao(150, 100)).toBe(50);
    expect(variacao(90, 120)).toBe(-25);
    expect(variacao(100, 0)).toBeNull();
  });

  it("hoje é comparado com o mesmo dia da semana anterior", () => {
    // 2026-11-17 é terça; a base é a terça 2026-11-10 (8º item de trás para frente).
    const dias = serie("2026-11-17", [0, 0, 0, 0, 1000, 0, 0, 0, 0, 0, 0, 1500]);
    const r = comparaHoje(dias);
    expect(r.hojeCents).toBe(1500);
    expect(r.baseCents).toBe(1000);
    expect(r.delta).toBe(50);
    expect(r.rotuloBase).toBe("terça passada");
    expect(diaDaSemana("2026-11-17")).toBe("terça");
  });

  it("sem uma semana de histórico, não inventa comparação", () => {
    const r = comparaHoje(serie("2026-11-17", [100, 200, 300]));
    expect(r.hojeCents).toBe(300);
    expect(r.delta).toBeNull();
    expect(r.rotuloBase).toBeNull();
    expect(comparaHoje([]).hojeCents).toBe(0);
  });

  it("período de 7 e 30 dias contra o período anterior de mesmo tamanho", () => {
    const anteriores = serie("2026-10-18", Array.from({ length: 30 }, () => 100));
    const atuais = serie("2026-11-17", Array.from({ length: 30 }, (_, i) => (i === 25 ? 5000 : 200)));
    const s30 = serieDoPeriodo(atuais, anteriores, 30);
    expect(s30.atual).toHaveLength(30);
    expect(s30.anterior).toHaveLength(30);
    expect(s30.totalAnterior).toBe(3000);
    expect(s30.totalAtual).toBe(29 * 200 + 5000);
    expect(s30.melhor?.cents).toBe(5000);
    const s7 = serieDoPeriodo(atuais, anteriores, 7);
    expect(s7.atual.map((d) => d.date)).toEqual(atuais.slice(-7).map((d) => d.date));
    expect(s7.anterior.map((d) => d.date)).toEqual(atuais.slice(-14, -7).map((d) => d.date));
    expect(s7.delta).toBe(variacao(s7.totalAtual, s7.totalAnterior));
  });

  it("título do gráfico é a conclusão; sem venda, diz que ainda não há", () => {
    const atuais = serie("2026-11-17", [0, 0, 0, 412000, 0, 0, 0]);
    const s = serieDoPeriodo(atuais, [], 7);
    expect(fraseDoPeriodo(s, 7)).toBe("Sábado, 14/11, foi o seu melhor dia: R$ 4.120,00.");
    expect(s.delta).toBeNull();
    expect(fraseDoPeriodo(serieDoPeriodo(serie("2026-11-17", [0, 0, 0, 0, 0, 0, 0]), [], 7), 7)).toBe("Ainda sem vendas pagas nos últimos 7 dias.");
  });

  it("mini gráfico só com venda; conversão só com 100 visitas ou mais", () => {
    expect(miniSerie(serie("2026-11-17", [0, 0, 0]))).toEqual([]);
    expect(miniSerie(serie("2026-11-17", Array.from({ length: 20 }, (_, i) => i)))).toHaveLength(14);
    expect(conversaoConfiavel(3, 99)).toBeNull();
    expect(conversaoConfiavel(3, 150)).toBe(2);
  });

  it("rosca com canais reais, no máximo 4 + Outros, somando 100%", () => {
    const f = fatiasDeCanal([{ channel: "ONLINE_STORE", salesCents: 700 }, { channel: "WHATSAPP", salesCents: 200 }, { channel: "INSTAGRAM", salesCents: 100 }, { channel: "MANUAL", salesCents: 0 }]);
    expect(f.map((x) => x.nome)).toEqual(["Loja virtual", "WhatsApp", "Instagram"]);
    expect(f.reduce((s, x) => s + x.pct, 0)).toBe(100);
    expect(fatiasDeCanal([])).toEqual([]);
    const muitos = fatiasDeCanal(["A", "B", "C", "D", "E", "F"].map((c, i) => ({ channel: c, salesCents: 100 - i })));
    expect(muitos).toHaveLength(5);
    expect(muitos.at(-1)!.nome).toBe("Outros");
    expect(muitos.reduce((s, x) => s + x.pct, 0)).toBe(100);
  });
});

/** Contraste WCAG (luminância relativa). */
function luminancia(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}
const contraste = (a: string, b: string) => { const [x, y] = [luminancia(a), luminancia(b)].sort((m, n) => n - m); return (x! + 0.05) / (y! + 0.05); };

describe("famílias de cor dos painéis (D331)", () => {
  it("cada família tem contraste de elemento gráfico (3:1) sobre o fundo do seu tema", () => {
    for (const [nome, cor] of Object.entries(CORES_VIDA)) {
      expect(contraste(cor.claro, "#ffffff"), `${nome} no claro`).toBeGreaterThanOrEqual(3);
      expect(contraste(cor.escuro, "#111318"), `${nome} no escuro`).toBeGreaterThanOrEqual(3);
    }
  });
});
