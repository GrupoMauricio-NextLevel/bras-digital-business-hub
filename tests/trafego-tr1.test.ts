import { beforeEach, describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { freshDb } from "./setup";
import { attributionFrom, primeiroToqueFrom } from "@/proxy";
import { routeHost } from "@/lib/host-routing";
import { canalDe, CANAIS, ROTULO_CANAL } from "@/lib/trafego/canal";
import { CONSENT_VERSION, gravarConsentimento, lerConsentimento, podeAnunciar, podeMedir } from "@/lib/trafego/consentimento";
import { alterarLink, avisosDoPadrao, criarLink, destinoSeguro, listarLinks, montarDestino, normalizarEtiqueta, resolverClique } from "@/lib/domain/trafego/links";
import { GroupPrivacy } from "@/components/portal/legal-grupo";
import { masterPathAllowed } from "@/lib/master-equipe";

/** TR0 e TR1 (D290): canal, clique do anúncio, primeiro toque, consentimento e links rastreados. */
describe("canal de cada visita", () => {
  const casos: [Parameters<typeof canalDe>[0], string][] = [
    [{ gclid: "abc" }, "google-pago"],
    [{ wbraid: "x", utm_source: "instagram" }, "google-pago"],
    [{ ttclid: "t" }, "tiktok-pago"],
    [{ fbclid: "f", utm_medium: "pago" }, "meta-pago"],
    [{ utm_source: "meta", utm_medium: "paid_social" }, "meta-pago"],
    [{ utm_source: "instagram", utm_medium: "cpc" }, "meta-pago"],
    [{ utm_source: "google", utm_medium: "cpc" }, "google-pago"],
    [{ utm_source: "outro", utm_medium: "pago" }, "outros-pago"],
    [{ ref: "ANA", referrer: "https://www.google.com/" }, "indicacao"],
    [{ ref: "ANA", gclid: "g" }, "google-pago"],
    [{ utm_source: "instagram", utm_medium: "bio" }, "instagram-organico"],
    [{ utm_source: "WhatsApp" }, "whatsapp"],
    [{ utm_source: "email" }, "email"],
    [{ utm_source: "chatgpt" }, "ia"],
    [{ utm_source: "jornal-x" }, "outros-sites"],
    [{ referrer: "https://www.google.com.br/search?q=loja" }, "google-organico"],
    [{ referrer: "https://gemini.google.com/app" }, "ia"],
    [{ referrer: "https://chatgpt.com/" }, "ia"],
    [{ referrer: "https://l.instagram.com/" }, "instagram-organico"],
    [{ referrer: "https://m.facebook.com/" }, "facebook-organico"],
    [{ referrer: "https://duckduckgo.com/" }, "outras-buscas"],
    [{ referrer: "https://wa.me/55" }, "whatsapp"],
    [{ referrer: "https://www.youtube.com/watch" }, "youtube-organico"],
    [{ referrer: "https://blog.qualquer.com.br/post" }, "outros-sites"],
    [{ referrer: "https://nextlevelcommerce.com.br/planos", hostProprio: "www.nextlevelcommerce.com.br" }, "direto"],
    [{ referrer: "instagram.com" }, "instagram-organico"],
    [{ fbclid: "f" }, "facebook-organico"],
    [{}, "direto"],
  ];
  it.each(casos)("%o → %s", (e, esperado) => expect(canalDe(e)).toBe(esperado));
  it("todo canal tem rótulo em português", () => { for (const c of CANAIS) expect(ROTULO_CANAL[c]).toBeTruthy(); });
});

describe("origem no proxy", () => {
  it("guarda o clique do anúncio, o momento e o canal, sem lixo e com tamanho limitado", () => {
    const a = attributionFrom(new URL(`https://nextlevelcommerce.com.br/planos?utm_source=meta&utm_medium=pago&fbclid=IwAR<x>${"a".repeat(300)}&gclid=`))!;
    expect(a).toMatchObject({ utm_source: "meta", utm_medium: "pago", canal: "meta-pago", page: "/planos" });
    expect(a.fbclid!.startsWith("IwARx")).toBe(true);
    expect(a.fbclid!.length).toBeLessThanOrEqual(120);
    expect(a.gclid).toBeUndefined();
    expect(Number(a.ts)).toBeGreaterThan(0);
    expect(attributionFrom(new URL("https://x.com/?gclid=Cj0K"))).toMatchObject({ gclid: "Cj0K", canal: "google-pago" });
    expect(attributionFrom(new URL("https://x.com/?utm_source=x"))!.ts).toBeUndefined();
    expect(attributionFrom(new URL("https://x.com/planos"))).toBeNull();
  });
  it("primeiro toque: canal pelo site de origem quando não há etiqueta; navegação interna é direto", () => {
    const f = primeiroToqueFrom({ url: new URL("https://nextlevelcommerce.com.br/temas"), referrer: "https://www.google.com/", host: "nextlevelcommerce.com.br", ua: "Mozilla" });
    expect(f).toMatchObject({ canal: "google-organico", ref_host: "google.com", page: "/temas" });
    const d = primeiroToqueFrom({ url: new URL("https://nextlevelcommerce.com.br/"), referrer: "https://nextlevelcommerce.com.br/planos", host: "nextlevelcommerce.com.br", ua: "Mozilla" });
    expect(d.canal).toBe("direto");
    expect(d.ref_host).toBeUndefined();
    const p = primeiroToqueFrom({ url: new URL("https://nextlevelcommerce.com.br/?utm_source=instagram&utm_medium=reels&utm_content=reel-1"), referrer: null, host: "nextlevelcommerce.com.br", ua: "Mozilla" });
    expect(p).toMatchObject({ canal: "instagram-organico", utm_content: "reel-1" });
  });
});

describe("consentimento de cookies", () => {
  it("lê só a versão atual; sem escolha mede e não anuncia; anúncio só com sim", () => {
    const sim = lerConsentimento(gravarConsentimento({ medicao: true, anuncios: true }, new Date("2026-11-13T10:00:00Z")));
    expect(sim).toEqual({ versao: CONSENT_VERSION, medicao: true, anuncios: true, em: "2026-11-13" });
    expect(podeAnunciar(sim)).toBe(true);
    const nao = lerConsentimento(gravarConsentimento({ medicao: false, anuncios: false }));
    expect(podeMedir(nao)).toBe(false);
    expect(podeMedir(null)).toBe(true);
    expect(podeAnunciar(null)).toBe(false);
    expect(lerConsentimento(encodeURIComponent(JSON.stringify({ versao: "2020-01-01", medicao: true, anuncios: true })))).toBeNull();
    expect(lerConsentimento("lixo{")).toBeNull();
  });
  it("a política explica cookies, medição e o envio em código para Meta e Google", () => {
    const p = renderToStaticMarkup(createElement(GroupPrivacy, { marca: "NextLevel Commerce" }));
    expect(p).toContain('id="cookies"');
    expect(p).toContain("Preferências de cookies");
    expect(p).toContain("código irreversível");
    expect(p).toContain("13/11/2026");
    expect(p).not.toContain("Não usamos cookies de publicidade");
  });
});

describe("links rastreados", () => {
  let ctx: Awaited<ReturnType<typeof freshDb>>;
  beforeEach(async () => { ctx = await freshDb(); });

  it("padrão de nomes, destino só no próprio site e avisos fora do padrão", () => {
    expect(normalizarEtiqueta("  Campanha Março  Ação! ")).toBe("campanha-marco-acao");
    for (const ruim of ["https://evil.com", "//evil.com", "/\\evil", "planos", "/api/x", "/l/abc", "/x y"]) expect(destinoSeguro(ruim), ruim).toBeNull();
    expect(destinoSeguro("/planos?x=1#teste")).toBe("/planos?x=1#teste");
    expect(avisosDoPadrao({ utmSource: "insta", utmMedium: "bio", utmCampaign: "natal" })).toHaveLength(2);
    expect(avisosDoPadrao({ utmSource: "instagram", utmMedium: "bio", utmCampaign: "2026-12-cadastro" })).toEqual([]);
  });

  it("cria, conta clique (robô à parte), leva com as etiquetas e desliga", async () => {
    const r = await criarLink(ctx.db, ctx.actors.master, { codigo: "Bio", destino: "/planos?utm_source=velho#teste", utmSource: "Instagram", utmMedium: "bio", utmCampaign: "2026-12-organico", utmContent: "" });
    expect(r.codigo).toBe("bio");
    await expect(criarLink(ctx.db, ctx.actors.master, { codigo: "bio", destino: "/", utmSource: "instagram", utmMedium: "bio", utmCampaign: "2026-12-x" })).rejects.toThrow(/em uso/);
    await expect(criarLink(ctx.db, ctx.actors.master, { destino: "https://evil.com", utmSource: "instagram", utmMedium: "bio", utmCampaign: "2026-12-x" })).rejects.toThrow(/próprio site/);
    const auto = await criarLink(ctx.db, ctx.actors.master, { destino: "/", utmSource: "whatsapp", utmMedium: "organico", utmCampaign: "2026-12-status" });
    expect(auto.codigo).toMatch(/^[a-z0-9]{6}$/);

    const ida = await resolverClique(ctx.db, "BIO", { robo: false, busca: new URLSearchParams("fbclid=IwAR1&foo=bar") });
    expect(ida).toEqual({ brand: "NEXTLEVEL_COMMERCE", caminho: "/planos?utm_source=instagram&utm_medium=bio&utm_campaign=2026-12-organico&fbclid=IwAR1#teste" });
    await resolverClique(ctx.db, "bio", { robo: false });
    await resolverClique(ctx.db, "bio", { robo: true });
    expect(await resolverClique(ctx.db, "nao-existe", { robo: false })).toBeNull();
    expect(await resolverClique(ctx.db, "../x", { robo: false })).toBeNull();

    const lista = await listarLinks(ctx.db, ctx.actors.master);
    const bio = lista.find((l) => l.codigo === "bio")!;
    expect(bio).toMatchObject({ cliques7: 2, cliques30: 2, cliquesTotal: 2, canal: "instagram-organico" });

    await alterarLink(ctx.db, ctx.actors.master, r.id, { ativo: false });
    expect(await resolverClique(ctx.db, "bio", { robo: false })).toBeNull();
    await expect(alterarLink(ctx.db, ctx.actors.master, r.id, { destino: "//evil.com" })).rejects.toThrow(/próprio site/);
  });

  it("só a equipe do Master (dono, Comercial e Conteúdo) mexe nos links", async () => {
    await expect(listarLinks(ctx.db, ctx.actors.mantos)).rejects.toThrow(/NextLevel/);
    await expect(listarLinks(ctx.db, { ...ctx.actors.master, masterFunction: "FINANCEIRO" })).rejects.toThrow(/função/);
    await expect(listarLinks(ctx.db, { ...ctx.actors.master, masterFunction: "CONTEUDO" })).resolves.toEqual([]);
    expect(masterPathAllowed("COMERCIAL", "/master/trafego")).toBe(true);
    expect(masterPathAllowed("CONTEUDO", "/master/trafego")).toBe(true);
    expect(masterPathAllowed("FINANCEIRO", "/master/trafego")).toBe(false);
  });

  it("montarDestino troca as etiquetas do destino pelas do link e só aceita identificadores de clique limpos", () => {
    const l = { destino: "/?utm_term=velho", utmSource: "meta", utmMedium: "pago", utmCampaign: "2026-12-x", utmContent: null, utmTerm: null };
    expect(montarDestino(l, new URLSearchParams("gclid=<script>"))).toBe("/?utm_source=meta&utm_medium=pago&utm_campaign=2026-12-x");
  });

  it("/l/ abre em todos os endereços de marca, como /r/ e /c/", () => {
    expect(routeHost({ host: "superdrop.com.br", pathname: "/l/bio" }, {})).toEqual({ kind: "next" });
    expect(routeHost({ host: "cargas.nextlevelgroup.com.br", pathname: "/l/bio" }, {})).toEqual({ kind: "next" });
    expect(routeHost({ host: "nextlevelgroup.com.br", pathname: "/l/bio" }, { GROUP_SITE_URL: "https://nextlevelgroup.com.br" })).toEqual({ kind: "next" });
  });
});
