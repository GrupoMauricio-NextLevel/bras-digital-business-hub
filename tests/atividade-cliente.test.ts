import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

/** Consultas automáticas só com gente na tela (economia do banco, 2026-11-18). */
type Ouvinte = () => void;
let visivel: "visible" | "hidden";
let ouvintesJanela: Record<string, Ouvinte[]>;
beforeEach(() => {
  vi.resetModules(); vi.useFakeTimers(); vi.setSystemTime(new Date("2026-11-18T12:00:00Z"));
  visivel = "visible"; ouvintesJanela = {};
  vi.stubGlobal("window", { addEventListener: (ev: string, f: Ouvinte) => { (ouvintesJanela[ev] ??= []).push(f); } });
  vi.stubGlobal("document", { get visibilityState() { return visivel; }, addEventListener: () => undefined });
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe("podeConsultar", () => {
  it("consulta com a aba visível e gente mexendo; pausa após 10 minutos parada; volta ao tocar na tela", async () => {
    const { podeConsultar } = await import("@/lib/atividade-cliente");
    expect(podeConsultar()).toBe(true);
    vi.advanceTimersByTime(11 * 60_000);
    expect(podeConsultar()).toBe(false);
    for (const f of ouvintesJanela.pointerdown ?? []) f();
    expect(podeConsultar()).toBe(true);
  });
  it("aba escondida não consulta, a não ser quem avisa por notificação (e ainda assim para sem ninguém por perto)", async () => {
    const { podeConsultar } = await import("@/lib/atividade-cliente");
    visivel = "hidden";
    expect(podeConsultar()).toBe(false);
    expect(podeConsultar({ mesmoEscondida: true, semAtividadeMs: 30 * 60_000 })).toBe(true);
    vi.advanceTimersByTime(31 * 60_000);
    expect(podeConsultar({ mesmoEscondida: true, semAtividadeMs: 30 * 60_000 })).toBe(false);
  });
});
