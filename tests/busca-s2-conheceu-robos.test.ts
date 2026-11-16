import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { origensContato, robosVisitasDiarias } from "@/db/schema";
import { conheceuValido, ehIa, rotuloConheceu, CONHECEU_POR } from "@/lib/trafego/conheceu";
import { registrarOrigemDoContato } from "@/lib/domain/trafego/origem-contato";
import { agruparConheceu, agruparPorPagina, clientesPorConteudo, robosNoSite, type LinhaContato } from "@/lib/domain/trafego/conteudo";
import { _zerarRobos, caminhoDoRobo, contarRobo, gravarRobos, roboDe } from "@/lib/trafego/robos";
import { faqMd, llmsFullTxt, llmsTxt, planosMd } from "@/lib/seo/llms";
import type { FatosPublicos } from "@/lib/seo/fatos-publicos";
import { PAGINAS_COMMERCE, trilhaCommerce, trilhaJsonLd } from "@/lib/seo/paginas";

/** D302: "Como nos conheceu?", receita por página, robôs de IA, llms.txt e trilha de navegação. */
let ctx: Awaited<ReturnType<typeof freshDb>>;
const AGORA = new Date("2026-11-16T15:00:00Z");
beforeEach(async () => { ctx = await freshDb(); _zerarRobos(AGORA.getTime()); });

describe("Como você conheceu a NextLevel?", () => {
  it("aceita só as chaves da lista e separa as IAs", () => {
    expect(conheceuValido("chatgpt")).toBe("chatgpt");
    for (const x of ["", "ChatGPT", "x; drop", 3, null, undefined]) expect(conheceuValido(x)).toBeNull();
    expect(rotuloConheceu("meta_ai")).toBe("Meta AI (WhatsApp ou Instagram)");
    expect(ehIa("perplexity")).toBe(true);
    expect(ehIa("google")).toBe(false);
    expect(new Set(CONHECEU_POR.map((c) => c.chave)).size).toBe(CONHECEU_POR.length);
  });

  it("guarda a resposta com a origem; se o contato já existia, completa sem apagar a anterior", async () => {
    await registrarOrigemDoContato(ctx.db, "interessado:a", "NEXTLEVEL_COMMERCE", "FORMULARIO", { ultimo: {}, primeiro: { page: "/comparativo" }, sessaoId: null, conheceuPor: "chatgpt" }, "/", AGORA);
    await registrarOrigemDoContato(ctx.db, "interessado:b", "NEXTLEVEL_COMMERCE", "FORMULARIO", { ultimo: {}, primeiro: {}, sessaoId: null, conheceuPor: "inventado" }, "/", AGORA);
    const ler = async (c: string) => (await ctx.db.query.origensContato.findFirst({ where: eq(origensContato.chave, c) }))?.conheceuPor ?? null;
    expect(await ler("interessado:a")).toBe("chatgpt");
    expect(await ler("interessado:b")).toBeNull();
    await registrarOrigemDoContato(ctx.db, "interessado:b", "NEXTLEVEL_COMMERCE", "FORMULARIO", { ultimo: {}, primeiro: {}, sessaoId: null, conheceuPor: "instagram" }, "/", AGORA);
    await registrarOrigemDoContato(ctx.db, "interessado:a", "NEXTLEVEL_COMMERCE", "FORMULARIO", { ultimo: {}, primeiro: {}, sessaoId: null, conheceuPor: "google" }, "/", AGORA);
    expect(await ler("interessado:b")).toBe("instagram");
    expect(await ler("interessado:a")).toBe("chatgpt");
  });
});

describe("páginas que trouxeram clientes", () => {
  const l = (pagina: string, x: Partial<LinhaContato> = {}): LinhaContato => ({ pagina, conta: false, pagante: false, mensalCents: 0, fechadoCents: 0, conheceuPor: null, ...x });
  it("soma por página de entrada e ordena pelo dinheiro trazido", () => {
    const r = agruparPorPagina([l("/faq"), l("/comparativo", { conta: true, pagante: true, mensalCents: 14700 }), l("/comparativo", { conta: true }), l("/parceiros", { pagante: true, fechadoCents: 50000 })]);
    expect(r.map((p) => p.pagina)).toEqual(["/parceiros", "/comparativo", "/faq"]);
    expect(r[1]).toEqual({ pagina: "/comparativo", contatos: 2, contas: 2, pagantes: 1, mensalCents: 14700, fechadoCents: 0 });
  });
  it("conta as respostas do 'Como nos conheceu?' e quem não respondeu", () => {
    const r = agruparConheceu([l("/", { conheceuPor: "chatgpt", pagante: true }), l("/", { conheceuPor: "chatgpt" }), l("/", { conheceuPor: null }), l("/", { conheceuPor: "lixo" })]);
    expect(r.respostas).toEqual([{ chave: "chatgpt", rotulo: "ChatGPT", grupo: "ia", contatos: 2, pagantes: 1 }]);
    expect(r.semResposta).toBe(2);
  });
  it("lê do banco só para a equipe do Comercial e do Conteúdo", async () => {
    await registrarOrigemDoContato(ctx.db, "interessado:c", "NEXTLEVEL_COMMERCE", "FORMULARIO", { ultimo: {}, primeiro: { page: "/faq" }, sessaoId: null, conheceuPor: "gemini" }, "/", AGORA);
    const r = await clientesPorConteudo(ctx.db, ctx.actors.master, 30, AGORA);
    expect(r.paginas).toEqual([{ pagina: "/faq", contatos: 1, contas: 0, pagantes: 0, mensalCents: 0, fechadoCents: 0 }]);
    expect(r.conheceu.respostas[0]?.chave).toBe("gemini");
    await expect(clientesPorConteudo(ctx.db, ctx.actors.mantos, 30, AGORA)).rejects.toThrow();
    await expect(clientesPorConteudo(ctx.db, { ...ctx.actors.master, masterFunction: "FINANCEIRO" }, 30, AGORA)).rejects.toThrow(/função/);
  });
});

describe("robôs de busca e de IA", () => {
  it("reconhece os robôs pelo navegador e deixa pessoas de fora", () => {
    expect(roboDe("Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot)")).toBe("ChatGPT (busca)");
    expect(roboDe("Mozilla/5.0 (compatible; GPTBot/1.2; +https://openai.com/gptbot)")).toBe("OpenAI (treino)");
    expect(roboDe("Mozilla/5.0 (compatible; ClaudeBot/1.0; +claudebot@anthropic.com)")).toBe("Claude (treino)");
    expect(roboDe("Mozilla/5.0 (compatible; PerplexityBot/1.0)")).toBe("Perplexity (busca)");
    expect(roboDe("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)")).toBe("Google");
    expect(roboDe("Mozilla/5.0 (compatible; bingbot/2.0)")).toBe("Bing e Copilot");
    expect(roboDe("Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) Safari/604.1")).toBeNull();
    expect(roboDe(null)).toBeNull();
    expect(caminhoDoRobo("/faq?x=1#a")).toBe("/faq");
  });
  it("soma em memória, grava em lote somando ao banco e mostra por robô", async () => {
    expect(contarRobo("NEXTLEVEL_COMMERCE", "Claude (busca)", "/faq", AGORA)).toBe(false);
    contarRobo("NEXTLEVEL_COMMERCE", "Claude (busca)", "/faq?y", AGORA);
    contarRobo("NEXTLEVEL_COMMERCE", "Google", "/planos", AGORA);
    expect(await gravarRobos(ctx.db, AGORA)).toBe(2);
    expect(await gravarRobos(ctx.db, AGORA)).toBe(0);
    contarRobo("NEXTLEVEL_COMMERCE", "Claude (busca)", "/faq", AGORA);
    await gravarRobos(ctx.db, AGORA);
    const linhas = await ctx.db.select().from(robosVisitasDiarias).where(eq(robosVisitasDiarias.robo, "Claude (busca)"));
    expect(linhas).toEqual([{ dia: "2026-11-16", brand: "NEXTLEVEL_COMMERCE", robo: "Claude (busca)", caminho: "/faq", visitas: 3 }]);
    const r = await robosNoSite(ctx.db, ctx.actors.master, 7, AGORA);
    expect(r[0]).toEqual({ robo: "Claude (busca)", visitas: 3, paginas: [{ caminho: "/faq", visitas: 3 }] });
  });
  it("pede para gravar quando o lote fica grande", () => {
    let pediu = false;
    for (let i = 0; i < 300; i++) pediu = contarRobo("NEXTLEVEL_COMMERCE", "Google", `/p${i}`, AGORA);
    expect(pediu).toBe(true);
  });
});

describe("arquivos para as IAs e trilha de navegação", () => {
  const f: FatosPublicos = {
    diasDeTeste: 3,
    planos: [{ nome: "Start", mensalCents: 5700, taxaBps: 0, suporte: "Chat e WhatsApp", migracao: "Paga à parte", faixasAtacado: 3, produtos: 300 }],
    planosAnuais: [{ nome: "Start", anualCents: 57000 }],
  };
  it("llms.txt segue o formato (título, resumo, listas de links) e usa os fatos do sistema", () => {
    const t = llmsTxt("https://nextlevelcommerce.com.br", f, AGORA);
    expect(t.startsWith("# NextLevel Commerce\n\n> NextLevel Commerce é a plataforma")).toBe(true);
    expect(t).toContain("Fatos de 2026-11-16");
    expect(t).toMatch(/Start R\$\s?57,00 por mês/);
    expect(t).toContain("- [Planos e preços · NextLevel Commerce](https://nextlevelcommerce.com.br/planos): ");
    expect(t).toContain("(https://nextlevelcommerce.com.br/faq.md)");
    for (const p of PAGINAS_COMMERCE) expect(t).toContain(`https://nextlevelcommerce.com.br${p.caminho === "/" ? "" : p.caminho})`);
    expect(t).not.toMatch(/em breve|7 dias|setup/i);
  });
  it("versões em texto de planos e perguntas; o completo junta tudo", () => {
    expect(planosMd("https://x", f, AGORA)).toMatch(/\| Start \| R\$\s?57,00 \| R\$\s?570,00 \| 300 \| 3 \|/);
    const faq = faqMd("https://x", f, AGORA);
    expect(faq).toContain("## Posso testar antes de pagar?");
    const full = llmsFullTxt("https://x", f, AGORA);
    expect(full).toContain("# Planos e preços da NextLevel Commerce");
    expect(full).toContain("# Perguntas frequentes da NextLevel Commerce");
  });
  it("trilha: Início, páginas-mãe da tabela e a página; nada na home nem em página desconhecida", () => {
    expect(trilhaCommerce("/parceiros/indique")).toEqual([{ nome: "Início", caminho: "/" }, { nome: "Parceiros", caminho: "/parceiros" }, { nome: "Indique pelo CPF", caminho: "/parceiros/indique" }]);
    expect(trilhaCommerce("/temas/trama", "Tema Trama").map((e) => e.nome)).toEqual(["Início", "Temas", "Tema Trama"]);
    expect(trilhaCommerce("/planos").map((e) => e.nome)).toEqual(["Início", "Planos e preços"]);
    expect(trilhaCommerce("/")).toEqual([]);
    expect(trilhaCommerce("/nao-existe")).toEqual([]);
    const ld = trilhaJsonLd("https://nextlevelcommerce.com.br", trilhaCommerce("/parceiros/indique"));
    expect(ld.itemListElement[0]).toEqual({ "@type": "ListItem", position: 1, name: "Início", item: "https://nextlevelcommerce.com.br" });
    expect(ld.itemListElement[2]?.item).toBe("https://nextlevelcommerce.com.br/parceiros/indique");
  });
});
