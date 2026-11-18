import { and, eq } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { contatosNegocio, paginasSite } from "@/db/schema";
import type { Actor } from "@/lib/domain/access";
import { recordAudit } from "@/lib/domain/audit";
import { buildTemplate, type SectionSpec } from "@/lib/themes/template";
import type { Template } from "@/lib/themes/types";
import { criarPagina, publicarPaginas } from "./paginas";

/**
 * Captação: página de campanha em poucos cliques (NB4, D338). O dono escolhe o objetivo, escreve a oferta e até quatro
 * motivos; a página nasce pronta (topo com a oferta, motivos, formulário de orçamento e contatos), já publicada, com os
 * links prontos para o anúncio (Meta, Google, Instagram) e o QR. Os pedidos chegam em Contatos e orçamentos com a origem,
 * e cada campanha mostra quantos contatos e fechamentos trouxe.
 * Só seções que valem em todos os temas (sem requisito de nível). Pixel e conversões por loja ficam para depois (exigem
 * configuração por loja e conta de teste da Meta).
 */
export const OBJETIVOS = {
  ORCAMENTO: { rotulo: "Pedir orçamento", descricao: "Para serviços: o cliente conta o que precisa e você responde com o preço.", botao: "Quero meu orçamento", formulario: "Peça seu orçamento" },
  VISITA: { rotulo: "Agendar visita ou aula experimental", descricao: "Para academias, estúdios, clínicas e quem atende com hora marcada.", botao: "Quero agendar", formulario: "Escolha o melhor horário" },
  CONTATO: { rotulo: "Receber o contato da equipe", descricao: "Para quem prefere conversar antes: o cliente deixa o WhatsApp e a equipe chama.", botao: "Quero que me chamem", formulario: "Deixe seu contato" },
} as const;
export type Objetivo = keyof typeof OBJETIVOS;

export const campanhaSchema = z.object({
  objetivo: z.enum(Object.keys(OBJETIVOS) as [Objetivo, ...Objetivo[]]),
  titulo: z.string().trim().min(4, "Escreva o título da oferta (pelo menos 4 letras).").max(80),
  oferta: z.string().trim().max(160).optional().default(""),
  motivos: z.array(z.string().trim().max(90)).max(4).default([]).transform((m) => m.filter(Boolean)),
  publicar: z.boolean().default(true),
});

/** Montagem da página (pura, testada). `#orcamento` leva o botão do topo até o formulário. */
export function modeloDaCampanha(raw: z.input<typeof campanhaSchema>, empresa: string): Template {
  const c = campanhaSchema.parse(raw);
  const o = OBJETIVOS[c.objetivo];
  const secoes: [string, SectionSpec][] = [
    ["destaque", { type: "hero", settings: { title: c.titulo, subtitle: c.oferta || `${empresa}: atendimento próximo e resposta rápida.`, ctaLabel: o.botao, ctaLink: "#orcamento", layout: "centered", showProduct: false, showWhatsapp: true } }],
  ];
  if (c.motivos.length) secoes.push(["motivos", { type: "rich-text", settings: { heading: `Por que a ${empresa}`, body: c.motivos.map((m) => `✓ ${m}`).join("\n") } }]);
  secoes.push(
    ["orcamento", { type: "lead-form", settings: { heading: o.formulario, buttonLabel: o.botao, askService: c.objetivo !== "CONTATO" } }],
    ["contato", { type: "contact-info", settings: { heading: "Prefere falar agora?", text: "Chame no WhatsApp: a equipe responde." } }],
  );
  return buildTemplate("content", "home", secoes);
}

export const CANAIS_LINK = {
  meta: { rotulo: "Anúncio na Meta (Facebook e Instagram)", source: "facebook", medium: "paid" },
  google: { rotulo: "Anúncio no Google", source: "google", medium: "cpc" },
  instagram: { rotulo: "Bio e stories do Instagram", source: "instagram", medium: "social" },
  whatsapp: { rotulo: "Status e listas do WhatsApp", source: "whatsapp", medium: "social" },
  qr: { rotulo: "QR para cartaz, panfleto e balcão", source: "qr", medium: "offline" },
} as const;
export type CanalLink = keyof typeof CANAIS_LINK;

/** Link pronto para cada lugar (puro, testado): a origem e o nome da campanha entram no endereço e chegam ao contato. */
export function linkDaCampanha(base: string, slug: string, canal: CanalLink) {
  const c = CANAIS_LINK[canal];
  const u = new URL(`${base.replace(/\/$/, "")}/${slug}`);
  u.searchParams.set("utm_source", c.source); u.searchParams.set("utm_medium", c.medium); u.searchParams.set("utm_campaign", slug);
  return u.toString();
}

/** Cria a página de campanha pronta e (por padrão) já publica só ela, sem mexer em outros rascunhos do site. */
export async function criarCampanha(db: Database, actor: Actor, storeId: string, raw: z.input<typeof campanhaSchema>, empresa: string) {
  const c = campanhaSchema.parse(raw);
  const { id, slug } = await criarPagina(db, actor, storeId, { titulo: c.titulo, tipo: "CAMPANHA", noMenu: false }, modeloDaCampanha(c, empresa));
  if (c.publicar) await publicarPaginas(db, actor, storeId, "Página de campanha", { somente: [id] });
  await recordAudit(db, actor, { action: "CAMPANHA_CRIADA", entityType: "pagina_site", entityId: id, storeId, after: { objetivo: c.objetivo, slug, publicada: c.publicar } });
  return { id, slug, publicada: c.publicar };
}

/** O contato veio desta campanha? Pela etiqueta da campanha no link ou pela página onde preencheu (puro, testado). */
export const veioDaCampanha = (contato: { utmCampaign: string | null; pagina: string | null }, slug: string) =>
  contato.utmCampaign === slug || !!contato.pagina && (contato.pagina.replace(/[?#].*$/, "").replace(/\/$/, "").endsWith(`/${slug}`));

/** Páginas de campanha da loja com os números de cada uma: contatos, fechados e valor fechado. */
export async function campanhasDaLoja(db: Database, storeId: string) {
  const [paginas, contatos] = await Promise.all([
    db.select().from(paginasSite).where(and(eq(paginasSite.storeId, storeId), eq(paginasSite.tipo, "CAMPANHA"))),
    db.select({ utmCampaign: contatosNegocio.utmCampaign, pagina: contatosNegocio.pagina, situacao: contatosNegocio.situacao, valorCents: contatosNegocio.valorCents }).from(contatosNegocio).where(eq(contatosNegocio.storeId, storeId)),
  ]);
  return paginas.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((p) => {
    const deles = contatos.filter((c) => veioDaCampanha(c, p.slug));
    const ganhos = deles.filter((c) => c.situacao === "GANHO");
    return {
      id: p.id, titulo: p.titulo, slug: p.slug, noAr: !!p.published && !p.arquivadaEm, arquivada: !!p.arquivadaEm, criadaEm: p.createdAt,
      contatos: deles.length, fechados: ganhos.length, valorCents: ganhos.reduce((t, c) => t + (c.valorCents ?? 0), 0),
    };
  });
}
