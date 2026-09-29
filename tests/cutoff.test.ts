import { describe, expect, it } from "vitest";
import { cutoffStatus, DEFAULT_CUTOFFS, localDate, nextWorkingDate, validateOps, waveDateFor, zonedToUtc, type Ops } from "@/lib/domain/cutoff";

const ops: Ops = { timezone: "America/Sao_Paulo", cutoffs: { ...DEFAULT_CUTOFFS }, holidays: [] };
// São Paulo é UTC-3 (sem horário de verão desde 2019). 2026-03-02 é segunda-feira.
const at = (iso: string) => new Date(iso);

describe("horário de corte", () => {
  it("converte data/hora locais para UTC no fuso do fornecedor", () => {
    expect(zonedToUtc("2026-03-02", "14:00", "America/Sao_Paulo").toISOString()).toBe("2026-03-02T17:00:00.000Z");
    expect(zonedToUtc("2026-03-02", "23:30", "America/Sao_Paulo").toISOString()).toBe("2026-03-03T02:30:00.000Z");
    expect(zonedToUtc("2026-07-01", "09:00", "Europe/Lisbon").toISOString()).toBe("2026-07-01T08:00:00.000Z"); // verão europeu (UTC+1)
  });
  it("antes do corte o pedido é da onda de hoje; depois vai para o próximo dia útil", () => {
    expect(waveDateFor(ops, at("2026-03-02T16:59:00Z"))).toBe("2026-03-02"); // 13:59 local
    expect(waveDateFor(ops, at("2026-03-02T17:00:00Z"))).toBe("2026-03-03"); // 14:00 exato já é amanhã
    expect(waveDateFor(ops, at("2026-03-02T17:01:00Z"))).toBe("2026-03-03");
  });
  it("virada de dia: 23h50 local pertence ao dia local, não ao dia UTC", () => {
    expect(localDate(at("2026-03-03T02:50:00Z"), ops.timezone)).toBe("2026-03-02");
    expect(waveDateFor(ops, at("2026-03-03T02:50:00Z"))).toBe("2026-03-03");
  });
  it("sexta depois do corte e fim de semana sem expedição vão para segunda", () => {
    expect(waveDateFor(ops, at("2026-03-06T18:00:00Z"))).toBe("2026-03-09"); // sexta 15:00
    expect(waveDateFor(ops, at("2026-03-07T15:00:00Z"))).toBe("2026-03-09"); // sábado
  });
  it("feriado pula o dia", () => {
    const h = { ...ops, holidays: ["2026-03-03"] };
    expect(waveDateFor(h, at("2026-03-02T18:00:00Z"))).toBe("2026-03-04");
    expect(nextWorkingDate(h, "2026-03-03")).toBe("2026-03-04");
  });
  it("cronômetro: faltam N minutos, fechado depois, sem expedição no sábado", () => {
    const s = cutoffStatus(ops, at("2026-03-02T15:40:00Z")); // 12:40 local
    expect(s.state).toBe("OPEN"); expect(s.minutesLeft).toBe(80);
    const c = cutoffStatus(ops, at("2026-03-02T18:00:00Z"));
    expect(c.state).toBe("CLOSED"); expect(c.nextWorkingDate).toBe("2026-03-03");
    const sat = cutoffStatus(ops, at("2026-03-07T15:00:00Z"));
    expect(sat.state).toBe("NO_SHIPPING"); expect(sat.nextWorkingDate).toBe("2026-03-09");
  });
  it("corte diferente por dia da semana", () => {
    const o = { ...ops, cutoffs: { ...DEFAULT_CUTOFFS, fri: "11:00" } };
    expect(waveDateFor(o, at("2026-03-06T13:30:00Z"))).toBe("2026-03-06"); // 10:30 local, antes do corte de sexta (11:00)
    expect(waveDateFor(o, at("2026-03-06T14:30:00Z"))).toBe("2026-03-09"); // 11:30 local, depois: próxima segunda
  });
  it("valida configuração", () => {
    expect(validateOps(ops)).toBeNull();
    expect(validateOps({ ...ops, cutoffs: { ...ops.cutoffs, mon: "25:00" } })).toMatch(/inválido/);
    expect(validateOps({ ...ops, cutoffs: { mon: null, tue: null, wed: null, thu: null, fri: null, sat: null, sun: null } })).toMatch(/ao menos um/);
    expect(validateOps({ ...ops, timezone: "Marte/Olimpo" })).toMatch(/Fuso/);
  });
});
