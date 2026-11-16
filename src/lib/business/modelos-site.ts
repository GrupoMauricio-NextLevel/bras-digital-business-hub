import { and, eq } from "drizzle-orm";
import type { Database } from "@/db/client";
import { paginasSite, type PaginaTipo } from "@/db/schema";
import type { Actor } from "@/lib/domain/access";
import { recordAudit } from "@/lib/domain/audit";
import { publishTemplate, saveTemplateDraft } from "@/lib/themes/store";
import { buildTemplate, type SectionSpec } from "@/lib/themes/template";
import type { Template } from "@/lib/themes/types";
import { criarPagina, publicarPaginas } from "./paginas";

/**
 * Modelos prontos de site (NextLevel Business, NB2, D307). Só seções que valem em todos os temas (sem requisito de nível).
 * Os textos são ponto de partida neutros, sem promessa de ganho, para o dono trocar no editor.
 * - "institucional": empresa de serviços (vidraçaria, manutenção, instalação, escritório).
 * - "academia": academia e estúdio; a grade é texto até o portal do aluno (NB10).
 */
export const MODELOS_SITE = {
  institucional: { nome: "Institucional de serviços", descricao: "Início, Sobre, Serviços e Contato. Para quem vende por orçamento." },
  academia: { nome: "Academia e estúdio", descricao: "Início, Sobre, Modalidades, Grade de aulas e Contato." },
} as const;
export type ModeloSite = keyof typeof MODELOS_SITE;

type Pagina = { slug: string; titulo: string; tipo: PaginaTipo; secoes: [string, SectionSpec][] };
const t = (secoes: [string, SectionSpec][]): Template => buildTemplate("content", "home", secoes);

function partes(modelo: ModeloSite, nome: string): { inicio: [string, SectionSpec][]; paginas: Pagina[] } {
  const contato = (titulo: string, texto: string): [string, SectionSpec] => ["contato", { type: "contact-info", settings: { heading: titulo, text: texto } }];
  if (modelo === "academia") return {
    inicio: [
      ["destaque", { type: "hero", settings: { title: `Treine na ${nome}`, subtitle: "Aulas com acompanhamento, horários para a sua rotina e uma equipe que conhece você pelo nome.", ctaLabel: "Agendar aula experimental", ctaLink: "/contato", layout: "centered", showProduct: false, showWhatsapp: true } }],
      ["modalidades", { type: "services-grid", settings: { heading: "Modalidades", text: "Escolha por onde começar. A equipe ajuda você a montar a rotina.", ctaLabel: "Quero experimentar" } }],
      ["grade", { type: "rich-text", settings: { heading: "Grade de aulas", body: "Segunda a sexta: 6h às 22h\nSábado: 8h às 14h\n\nTroque por a grade da sua academia. Em breve, os alunos vão reservar a vaga pelo portal." } }],
      ["espaco", { type: "work-gallery", settings: { heading: "Nosso espaço" }, blocks: [{ type: "work" }, { type: "work" }, { type: "work" }] }],
      contato("Agende uma aula experimental", "Fale com a gente pelo WhatsApp e escolha o melhor horário."),
    ],
    paginas: [
      { slug: "sobre", titulo: "Sobre", tipo: "INSTITUCIONAL", secoes: [["sobre", { type: "store-about", settings: { heading: "Quem somos", body: `Conte a história da ${nome}, a equipe e o jeito de treinar de vocês.` } }]] },
      { slug: "modalidades", titulo: "Modalidades", tipo: "SERVICO", secoes: [["modalidades", { type: "services-grid", settings: { heading: "Modalidades" } }], contato("Ficou com dúvida?", "Chame no WhatsApp: a equipe responde.")] },
      { slug: "grade", titulo: "Grade de aulas", tipo: "LIVRE", secoes: [["grade", { type: "rich-text", settings: { heading: "Grade de aulas", body: "Escreva aqui os horários de cada modalidade.\n\nEm breve: reserva de vaga pelo portal do aluno." } }]] },
      { slug: "contato", titulo: "Contato", tipo: "CONTATO", secoes: [["orcamento", { type: "lead-form", settings: { heading: "Agende uma aula experimental", buttonLabel: "Quero agendar", askService: true } }], contato("Fale com a gente", "Tire dúvidas ou venha conhecer o espaço.")] },
    ],
  };
  return {
    inicio: [
      ["destaque", { type: "hero", settings: { title: nome, subtitle: "Atendimento próximo, orçamento sem compromisso e serviço feito com cuidado do começo ao fim.", ctaLabel: "Pedir orçamento", ctaLink: "/contato", layout: "centered", showProduct: false, showWhatsapp: true } }],
      ["servicos", { type: "services-grid", settings: { heading: "Nossos serviços" } }],
      ["trabalhos", { type: "work-gallery", settings: { heading: "Trabalhos realizados" }, blocks: [{ type: "work" }, { type: "work" }, { type: "work" }] }],
      ["porque", { type: "rich-text", settings: { heading: `Por que escolher a ${nome}`, body: "Conte em poucas linhas o que torna o seu serviço diferente: tempo de mercado, garantia, cuidado na instalação, região atendida." } }],
      ["orcamento", { type: "lead-form" }],
      contato("Fale com a gente", "Prefere conversar? Chame no WhatsApp."),
    ],
    paginas: [
      { slug: "sobre", titulo: "Sobre", tipo: "INSTITUCIONAL", secoes: [["sobre", { type: "store-about", settings: { heading: "Quem somos", body: `Conte a história da ${nome}, há quanto tempo atende e como trabalha.` } }]] },
      { slug: "servicos", titulo: "Serviços", tipo: "SERVICO", secoes: [["servicos", { type: "services-grid", settings: { heading: "Nossos serviços" } }], contato("Não achou o que precisa?", "Fale com a gente: fazemos orçamento para outros serviços também.")] },
      { slug: "contato", titulo: "Contato", tipo: "CONTATO", secoes: [["orcamento", { type: "lead-form" }], contato("Fale com a gente", "Tire dúvidas ou combine uma visita.")] },
    ],
  };
}

/** Só a montagem dos modelos (testada sem banco). */
export function modeloDoSite(modelo: ModeloSite, nome: string): { inicio: Template; paginas: (Omit<Pagina, "secoes"> & { modelo: Template })[] } {
  const p = partes(modelo, nome);
  return { inicio: t(p.inicio), paginas: p.paginas.map(({ secoes, ...resto }) => ({ ...resto, modelo: t(secoes) })) };
}

/**
 * Aplica o modelo: troca a página inicial (a anterior vai para o histórico, dá para restaurar) e cria as páginas que
 * ainda não existem (endereço já usado é pulado, nada é sobrescrito). `publicar` publica tudo na hora (conta nova);
 * sem ele, fica em rascunho para o dono revisar no editor.
 */
export async function aplicarModeloDoSite(db: Database, actor: Actor, storeId: string, modelo: ModeloSite, nome: string, opts: { publicar?: boolean } = {}) {
  const m = modeloDoSite(modelo, nome);
  await saveTemplateDraft(db, actor, storeId, "home", m.inicio, { skipPolicy: true });
  const criadas: string[] = [];
  for (const p of m.paginas) {
    const existe = await db.query.paginasSite.findFirst({ where: and(eq(paginasSite.storeId, storeId), eq(paginasSite.slug, p.slug)), columns: { id: true } });
    if (existe) continue;
    await criarPagina(db, actor, storeId, { titulo: p.titulo, slug: p.slug, tipo: p.tipo }, p.modelo);
    criadas.push(p.slug);
  }
  if (opts.publicar) {
    await publishTemplate(db, actor, storeId, "home", `Modelo ${MODELOS_SITE[modelo].nome}`);
    await publicarPaginas(db, actor, storeId, `Modelo ${MODELOS_SITE[modelo].nome}`);
  }
  await recordAudit(db, actor, { action: "MODELO_SITE_APLICADO", entityType: "store", entityId: storeId, storeId, after: { modelo, criadas, publicado: !!opts.publicar } });
  return { criadas };
}

/**
 * Conteúdo inicial de uma página nova, conforme o tipo (NB2, D307). Nos temas básicos não dá para acrescentar seções
 * (regra dos níveis de tema), então a página nunca nasce vazia: o dono troca os textos e oculta o que não quiser.
 */
export function modeloInicialDaPagina(tipo: PaginaTipo, titulo: string, nome: string): Template {
  const contato: [string, SectionSpec] = ["contato", { type: "contact-info", settings: { heading: "Fale com a gente", text: "Chame no WhatsApp: a equipe responde." } }];
  if (tipo === "INSTITUCIONAL") return t([["sobre", { type: "store-about", settings: { heading: titulo, body: `Conte a história da ${nome}.` } }]]);
  if (tipo === "SERVICO") return t([["servicos", { type: "services-grid", settings: { heading: titulo } }], contato]);
  if (tipo === "CONTATO") return t([["orcamento", { type: "lead-form", settings: { heading: titulo } }], ["contato", { type: "contact-info", settings: { heading: "Outros contatos" } }]]);
  if (tipo === "CAMPANHA") return t([
    ["destaque", { type: "hero", settings: { title: titulo, subtitle: "Escreva aqui a oferta do anúncio em uma frase.", ctaLabel: "Pedir orçamento", ctaLink: "/contato", layout: "centered", showProduct: false, showWhatsapp: true } }],
    ["servicos", { type: "services-grid", settings: { heading: "O que fazemos" } }],
    ["texto", { type: "rich-text", settings: { heading: "Por que nós", body: "Explique o diferencial em poucas linhas, sem promessas que não dependem de você." } }],
    ["orcamento", { type: "lead-form" }],
    contato,
  ]);
  return t([["texto", { type: "rich-text", settings: { heading: titulo, body: "Escreva aqui o conteúdo da página." } }], contato]);
}
