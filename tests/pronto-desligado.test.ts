import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { users } from "@/db/schema";
import { actorFromUser } from "@/lib/domain/access";
import { createMasterMember } from "@/lib/domain/equipe-master";
import { readyButOff, type OffGroup } from "@/lib/domain/qualidade-desligados";

/** D145: aba "Pronto e desligado" — o que está no ar esperando o dono ligar, com o estado de agora e onde ligar. */
let ctx: Awaited<ReturnType<typeof freshDb>>;
beforeEach(async () => { ctx = await freshDb(); });
const item = (g: OffGroup[], key: string) => g.flatMap((x) => x.items).find((i) => i.key === key)!;

describe("pronto e desligado", () => {
  it("lista o roteiro em ordem e as chaves, tudo desligado num sistema novo, com o próximo passo marcado", async () => {
    const g = await readyButOff(ctx.db, ctx.actors.master, {});
    expect(g.map((x) => x.key)).toEqual(["roteiro", "dinheiro", "acesso", "comunicacao"]);
    const roteiro = g[0]!.items;
    expect(roteiro.map((i) => i.step)).toEqual([1, 2, 3, 4, 5]);
    expect(roteiro.filter((i) => i.next)).toHaveLength(1);
    expect(roteiro.every((i) => i.state === "DESLIGADO")).toBe(true);
    for (const k of ["pagarme", "cadastro-commerce", "email", "escritorio"]) expect(item(g, k).state, k).toBe("DESLIGADO");
    expect(item(g, "parceiros-commerce").state).toBe("LIGADO"); // D220: programa de parceiros aberto por padrão
    expect(item(g, "parceiros-commerce").how).toEqual({ kind: "render", vars: ["BRAND_PARTNERS_NEXTLEVEL_COMMERCE=true"] });
    expect(item(g, "pagarme").how).toEqual({ kind: "render", vars: ["FIN_PAGARME=true"] });
  });

  it("acompanha o que o dono liga (chaves do Render), sem mostrar nenhum valor de segredo", async () => {
    const env = { BRAND_PARTNERS_NEXTLEVEL_COMMERCE: "true", BRAND_SIGNUP_NEXTLEVEL_COMMERCE: "true", RESEND_API_KEY: "re_segredo_123", EMAIL_FROM: "contato@exemplo.com", BRAND_OFFICE_NEXTLEVEL_COMMERCE: "https://office.nextlevelgroup.com.br" };
    const g = await readyButOff(ctx.db, ctx.actors.master, env);
    expect(item(g, "parceiros-commerce").state).toBe("LIGADO");
    expect(item(g, "cadastro-commerce").state).toBe("LIGADO");
    expect(item(g, "email").state).toBe("LIGADO");
    expect(item(g, "escritorio").state).toBe("LIGADO");
    const json = JSON.stringify(g);
    for (const secret of ["re_segredo_123", "contato@exemplo.com"]) expect(json).not.toContain(secret);
  });

  it("só o dono vê (equipe do Master não)", async () => {
    const { id: userId } = await createMasterMember(ctx.db, ctx.actors.master, { name: "Camila", email: "camila@nextlevel.teste", password: "provisoria-1234", masterFunction: "COMERCIAL" });
    const staff = actorFromUser((await ctx.db.query.users.findFirst({ where: eq(users.id, userId) }))!);
    await expect(readyButOff(ctx.db, staff, {})).rejects.toThrow();
  });
});
