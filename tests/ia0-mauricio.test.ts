import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { platformSettings, users } from "@/db/schema";
import { actorFromUser } from "@/lib/domain/access";
import { configPublica, getIaConfig, salvarAjustesIa, salvarChaveIa, testarConexaoIa } from "@/lib/domain/ia";
import { estadoDaFerramenta } from "@/lib/ia/ferramentas";

/** Maurício IA0 (D194): estado por plano, chave só criptografada e uso real só com chave testada. */
let ctx: Awaited<ReturnType<typeof freshDb>>;
beforeEach(async () => { ctx = await freshDb(); });
const cfg = { usoReal: false, temChave: false, planoTexto: "COMMERCE_PRO", planoAvancado: "COMMERCE_SCALE" };

describe("estado das ferramentas", () => {
  it("texto a partir do Pro, completo só no Scale; sem chave fica em breve", () => {
    expect(estadoDaFerramenta({ grupo: "TEXTO" }, cfg, { plano: "COMMERCE_START", emTeste: false })).toBe("BLOQUEADA");
    expect(estadoDaFerramenta({ grupo: "TEXTO" }, cfg, { plano: "COMMERCE_PRO", emTeste: false })).toBe("EM_BREVE");
    expect(estadoDaFerramenta({ grupo: "ACAO" }, cfg, { plano: "COMMERCE_PRO", emTeste: false })).toBe("BLOQUEADA");
    expect(estadoDaFerramenta({ grupo: "ACAO" }, cfg, { plano: "COMMERCE_SCALE", emTeste: false })).toBe("EM_BREVE");
    expect(estadoDaFerramenta({ grupo: "ACAO" }, cfg, { plano: "COMMERCE_START", emTeste: true })).toBe("BLOQUEADA");
    expect(estadoDaFerramenta({ grupo: "ACAO" }, { ...cfg, usoReal: true, temChave: true }, { plano: "COMMERCE_SCALE", emTeste: false })).toBe("LIBERADA");
  });
});

describe("Master", () => {
  it("chave criptografada, nunca devolvida; uso real só depois do teste", async () => {
    const master = actorFromUser((await ctx.db.query.users.findFirst({ where: eq(users.role, "NEXTLEVEL_MASTER") }))!);
    const chave = "sk-teste1234567890abcdefghij";
    await salvarChaveIa(ctx.db, master, chave);
    const row = await ctx.db.query.platformSettings.findFirst({ where: eq(platformSettings.key, "ia") });
    expect(JSON.stringify(row!.value)).not.toContain(chave);
    expect(JSON.stringify(configPublica(await getIaConfig(ctx.db)))).not.toContain("chaveEnc");
    await expect(salvarAjustesIa(ctx.db, master, { mostrar: true, usoReal: true, organizacao: "", modeloPadrao: "gpt-4.1", modeloEconomico: "gpt-4.1-mini", planoTexto: "COMMERCE_PRO", planoAvancado: "COMMERCE_SCALE", cotas: {} })).rejects.toThrow(/teste a conexão/);
    const chamadas: string[] = [];
    const falso = (async (url: string, init?: RequestInit) => { chamadas.push(`${url} ${(init?.headers as Record<string, string>).Authorization}`); return new Response("{}", { status: 200 }); }) as unknown as typeof fetch;
    expect(await testarConexaoIa(ctx.db, master, falso)).toEqual({ ok: true, mensagem: "Conectado à OpenAI." });
    expect(chamadas[0]).toBe(`https://api.openai.com/v1/models Bearer ${chave}`);
    await salvarAjustesIa(ctx.db, master, { mostrar: true, usoReal: true, organizacao: "", modeloPadrao: "gpt-4.1", modeloEconomico: "gpt-4.1-mini", planoTexto: "COMMERCE_PRO", planoAvancado: "COMMERCE_SCALE", cotas: {} });
    expect((await getIaConfig(ctx.db)).usoReal).toBe(true);
    await expect(salvarChaveIa(ctx.db, ctx.actors.arena, chave)).rejects.toThrow();
  });
});
