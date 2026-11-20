import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { qaRuns, users } from "@/db/schema";
import { actorFromUser } from "@/lib/domain/access";
import { createMasterMember } from "@/lib/domain/equipe-master";
import { areaOf, describeRoutes, fillRoute, hostOf, judge, labelOf, routeFromFile } from "@/lib/qualidade/rotas";
import { fileForScreen, gptImagePrompt } from "@/lib/qualidade/gpt";
import { parseManifest, publicImages } from "@/lib/qualidade/imagens";
import { checkDomains, checkPages, domainTargets, listAppRoutes, markScreen, qualityCenter, resetScreens } from "@/lib/domain/qualidade";

/** D142: central de qualidade — inventário automático das telas, marcação, domínios e checagem das páginas. */
let ctx: Awaited<ReturnType<typeof freshDb>>;
beforeEach(async () => { ctx = await freshDb(); });

describe("mapa das telas", () => {
  it("lê todas as telas dos arquivos, sem grupos nem API", () => {
    const routes = listAppRoutes();
    expect(routes.length).toBeGreaterThan(150);
    expect(routes).toContain("/master");
    expect(routes).toContain("/master/qualidade");
    expect(routes).toContain("/store/[slug]");
    expect(routes.some((r) => r.includes("(") || r.startsWith("/api"))).toBe(false);
    expect(routeFromFile("(portal)/planos/page.tsx")).toBe("/planos");
    expect(routeFromFile("(portal)/page.tsx")).toBe("/");
  });

  it("classifica por área, dá nome e preenche o exemplo", () => {
    expect(areaOf("/supplier/dispatch/print").key).toBe("expedicao");
    expect(areaOf("/supplier/orders").key).toBe("fornecedor");
    expect(areaOf("/redefinir-senha/[token]").key).toBe("privadas");
    expect(areaOf("/store/[slug]/cart").key).toBe("vitrines");
    expect(areaOf("/faq").key).toBe("publicas");
    expect(areaOf("/gravacao").key).toBe("demo");
    expect(labelOf("/master/clientes")).toBe("Clientes e suporte");
    expect(hostOf("/termos")).toBe("NEXTLEVEL_COMMERCE"); // termos do grupo em todas as marcas (D148)
    expect(hostOf("/faq")).toBe("NEXTLEVEL_COMMERCE");
    expect(labelOf("/master/financeiro/precos")).toBe("Preços do grupo");
    expect(fillRoute("/store/[slug]/product/[productSlug]", "mantos-shop/camisa-azul")).toBe("/store/mantos-shop/product/camisa-azul");
    expect(fillRoute("/store/[slug]", "https://superdrop.com.br/store/arena-10?x=1")).toBe("/store/arena-10?x=1");
    expect(fillRoute("/store/[slug]", "")).toBeNull();
    expect(describeRoutes(["/faq", "/master", "/master"]).map((r) => r.route)).toEqual(["/master", "/faq"]);
  });

  it("o que a checagem espera", () => {
    expect(judge("PUBLICA", 200, null).ok).toBe(true);
    expect(judge("PUBLICA", 404, null).ok).toBe(false);
    expect(judge("PAINEL", 307, "/login").ok).toBe(true);
    expect(judge("PAINEL", 200, null).ok).toBe(false);
  });
});

describe("marcação das telas", () => {
  it("o dono marca testada, aprovada e problema (aprovar tira o problema); tela que não existe é recusada", async () => {
    await markScreen(ctx.db, ctx.actors.master, "/master", { tested: true });
    await markScreen(ctx.db, ctx.actors.master, "/master", { problem: true, note: "botão cortado no celular" });
    let c = await qualityCenter(ctx.db, ctx.actors.master);
    let m = c.screens.find((s) => s.route === "/master")!.mark;
    expect(m).toMatchObject({ tested: true, problem: true, approved: false, note: "botão cortado no celular" });
    await markScreen(ctx.db, ctx.actors.master, "/master", { approved: true });
    c = await qualityCenter(ctx.db, ctx.actors.master);
    m = c.screens.find((s) => s.route === "/master")!.mark;
    expect(m).toMatchObject({ tested: true, approved: true, problem: false });
    await markScreen(ctx.db, ctx.actors.master, "/store/[slug]", { sample: "mantos-shop" });
    expect((await qualityCenter(ctx.db, ctx.actors.master)).screens.find((s) => s.route === "/store/[slug]")!.url).toBe("/store/mantos-shop");
    await expect(markScreen(ctx.db, ctx.actors.master, "/nao-existe", { tested: true })).rejects.toThrow(/não existe/);
    await resetScreens(ctx.db, ctx.actors.master, ["/master"]);
    expect((await qualityCenter(ctx.db, ctx.actors.master)).screens.find((s) => s.route === "/master")!.mark.approved).toBe(false);
  });

  it("só o dono: equipe do Master e clientes não entram", async () => {
    const { id } = await createMasterMember(ctx.db, ctx.actors.master, { name: "Pessoa Suporte", email: "sup@nl.teste", password: "provisoria-123", masterFunction: "SUPORTE" });
    const sup = actorFromUser((await ctx.db.query.users.findFirst({ where: eq(users.id, id) }))!);
    await expect(qualityCenter(ctx.db, sup)).rejects.toThrow();
    await expect(markScreen(ctx.db, ctx.actors.mantos, "/master", { tested: true })).rejects.toThrow();
  });
});

describe("checagens", () => {
  it("domínios: no ar, fora do ar e 'responde mas não é o sistema'", async () => {
    const env = { BRAND_DOMAINS_NEXTLEVEL_COMMERCE: "nextlevelcommerce.com.br", BRAND_DOMAINS_NEXTLEVEL: "master.nextlevelgroup.com.br", RENDER_GIT_COMMIT: "abc1234def" } as Record<string, string>;
    const targets = domainTargets(env);
    expect(targets.some((t) => t.origin === "https://nextlevelcommerce.com.br")).toBe(true);
    const fake = async (url: string) => {
      if (url.startsWith("https://nextlevelcommerce.com.br")) return new Response(JSON.stringify({ ok: true, version: "abc1234", migration: "0066" }), { status: 200 });
      if (url.startsWith("https://master.nextlevelgroup.com.br")) return new Response("<html>parado</html>", { status: 200 });
      throw new Error("sem conexão");
    };
    const r = await checkDomains(ctx.db, ctx.actors.master, fake, env);
    const sd = r.results.find((x) => x.key === "https://nextlevelcommerce.com.br")!;
    expect(sd.ok).toBe(true);
    expect(sd.detail).toContain("versão abc1234");
    expect(r.results.find((x) => x.key.includes("master.nextlevelgroup.com.br"))!.detail).toContain("não é o sistema");
    expect(r.failed).toBeGreaterThan(0);
    expect((await ctx.db.select().from(qaRuns)).length).toBe(1);
  });

  it("páginas: pública abre, painel manda para a entrada; o resultado aparece em cada tela", async () => {
    const routes = ["/faq", "/master", "/store/[slug]", "/dev/design"];
    const fake = async (url: string) => {
      const path = new URL(url).pathname;
      if (path === "/faq") return new Response("ok", { status: 200 });
      if (path === "/master") return new Response(null, { status: 307, headers: { location: "/login" } });
      return new Response("não achei", { status: 404 });
    };
    const r = await checkPages(ctx.db, ctx.actors.master, fake, routes);
    expect(r.ok).toBe(2);
    expect(r.results.map((x) => x.key).sort()).toEqual(["/faq", "/master"]); // sem exemplo e só-demonstração ficam de fora
    const c = await qualityCenter(ctx.db, ctx.actors.master, routes);
    expect(c.pagesRun).toMatchObject({ ok: 2, failed: 0 });
    expect(c.screens.find((s) => s.route === "/master")!.check?.ok).toBe(true);
  });
});

describe("o que falta e o pedido para o GPT (D143)", () => {
  it("marca o que falta numa tela e guarda a descrição da imagem", async () => {
    await markScreen(ctx.db, ctx.actors.master, "/planos", { needs: ["IMAGEM", "TEXTO", "IMAGEM"], imageBrief: "mãos embalando pedido" });
    const m = (await qualityCenter(ctx.db, ctx.actors.master)).screens.find((s) => s.route === "/planos")!.mark;
    expect(m.needs).toEqual(["IMAGEM", "TEXTO"]);
    expect(m.imageBrief).toBe("mãos embalando pedido");
    await expect(markScreen(ctx.db, ctx.actors.master, "/planos", { needs: ["QUALQUER" as "TEXTO"] })).rejects.toThrow();
  });

  it("lê os manifestos de imagens e confere os arquivos de verdade", () => {
    const rows = parseManifest("| Nome | Proporção | Onde aparece | Cena |\n|---|---|---|---|\n| `bd-x` | 4:3 (1600×1200) | Cartão | Caixas no balcão |\n| texto solto | | | |");
    expect(rows).toEqual([{ name: "bd-x", ratio: "4:3", where: "Cartão", scene: "Caixas no balcão" }]);
    const imgs = publicImages();
    expect(imgs.length).toBeGreaterThan(10);
    expect(imgs.find((i) => i.name === "sd-etiqueta-impressora")?.formats.length).toBeGreaterThan(0);
  });

  it("pedido para o GPT: regras de toda imagem, lotes por marca e nome de arquivo por tela", () => {
    expect(gptImagePrompt([])).toBe("");
    const p = gptImagePrompt([{ file: fileForScreen("/store/[slug]", "superdrop"), brand: "superdrop", ratio: "16:9", scene: "vitrine", where: "Vitrine" }, { file: "cm-x", brand: "commerce", ratio: "4:3", scene: "ateliê", where: "" }]);
    expect(p).toContain("Nenhum texto");
    expect(p).toContain("LOTE SUPERDROP");
    expect(p).toContain("sd-tela-store-item.png — 16:9 — vitrine (onde aparece: Vitrine)");
    expect(p).toContain("LOTE NEXTLEVEL COMMERCE"); // nome público desde D163
  });
});
