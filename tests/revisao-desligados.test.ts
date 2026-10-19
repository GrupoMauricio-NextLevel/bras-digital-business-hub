import { describe, expect, it } from "vitest";
import { freshDb } from "./setup";
import { readyButOff, readyButOffComRevisao } from "@/lib/domain/qualidade-desligados";
import { SUGESTOES, decidirDesligado, pendentesDoMes, revisaoDesligados } from "@/lib/domain/revisao-desligados";

/** Revisão mensal do "Pronto e desligado" (R4, D174). */
describe("revisão dos desligados", () => {
  it("todo item da aba tem a minha sugestão, com motivo", async () => {
    const { db, actors } = await freshDb();
    const itens = (await readyButOff(db, actors.master, {})).flatMap((g) => g.items);
    for (const i of itens) {
      expect(SUGESTOES[i.key], i.key).toBeDefined();
      expect(SUGESTOES[i.key]!.porque.length, i.key).toBeGreaterThan(20);
    }
  });

  it("o dono registra a decisão do mês; fica na auditoria e sai da lista de pendentes; nada é ligado", async () => {
    const { db, actors } = await freshDb();
    const outubro = new Date("2026-10-19T12:00:00Z");
    const antes = (await readyButOff(db, actors.master, {}, outubro)).flatMap((g) => g.items);
    const email = antes.find((i) => i.key === "email")!;
    expect(email.state).toBe("DESLIGADO");
    expect(pendentesDoMes(antes, await revisaoDesligados(db), outubro)).toContain("email");

    await decidirDesligado(db, actors.master, { key: "email", decisao: "LIGAR", nota: "Conta Resend amanhã" }, outubro);
    const revisao = await revisaoDesligados(db);
    expect(revisao.email).toMatchObject({ decisao: "LIGAR", mes: "2026-10", nota: "Conta Resend amanhã" });
    expect(pendentesDoMes(antes, revisao, outubro)).not.toContain("email");
    expect(pendentesDoMes(antes, revisao, new Date("2026-11-02T12:00:00Z"))).toContain("email"); // mês novo, nova revisão

    const depois = (await readyButOffComRevisao(db, actors.master, {}, outubro)).flatMap((g) => g.items).find((i) => i.key === "email")!;
    expect(depois.state).toBe("DESLIGADO"); // registrar não liga
    expect(depois.decisao?.decisao).toBe("LIGAR");
    expect(depois.sugestao?.decisao).toBe("LIGAR");
    expect((await db.query.auditLog.findMany()).some((a) => a.action === "REVISAO_DESLIGADO")).toBe(true);
  });

  it("só o dono do Master decide; decisão fora da lista é recusada", async () => {
    const { db, actors } = await freshDb();
    await expect(decidirDesligado(db, { ...actors.master, masterFunction: "FINANCEIRO" }, { key: "email", decisao: "LIGAR" })).rejects.toThrow();
    await expect(decidirDesligado(db, actors.arena, { key: "email", decisao: "LIGAR" })).rejects.toThrow();
    await expect(decidirDesligado(db, actors.master, { key: "email", decisao: "TALVEZ" })).rejects.toThrow();
  });
});
