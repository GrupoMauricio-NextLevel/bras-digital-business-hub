import { and, eq, inArray, isNull } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { agenciaMembros, agenciaOportunidades, agencias, users, type OPORTUNIDADE_ORIGENS } from "@/db/schema";
import type { Actor } from "@/lib/domain/access";
import { ForbiddenError, NotFoundError } from "@/lib/domain/errors";
import { envioSchema, TEMPO_MINIMO_MS } from "@/lib/business/contatos";
import { sendEmail } from "@/lib/email";
import { brandByCode } from "@/lib/brand";
import { agenciasUrl } from "@/lib/host-routing";
import { newId } from "@/lib/ids";
import { canalDe, CLICK_IDS, ROTULO_CANAL, type Canal } from "@/lib/trafego/canal";
import { escopoDaAgencia, exigirAgenciasLigado, pode } from "./acesso";

/**
 * Página de captação da agência (D322). O formulário público de orçamento (o mesmo do NextLevel Business, NB3, D309:
 * campo-isca, tempo mínimo, chave de envio contra duplicidade, origem lida da própria página e sem cookie, D185) vira
 * negociação no Comercial da agência, com o canal pela regra única (D290). O site e as páginas de vendas da agência só
 * precisam apontar para o endereço (ou embutir o formulário).
 */
export const urlDaCaptacao = (slug: string) => `${(agenciasUrl() ?? brandByCode("NEXTLEVEL_COMMERCE").baseUrl).replace(/\/$/, "")}/orcamento/${slug}`;

export const CAPTACAO_PADRAO = { ligada: false, titulo: "Vamos conversar sobre o seu marketing", texto: "Conte o que a sua empresa precisa. A equipe responde pelo WhatsApp ou pelo e-mail.", servicos: [] as string[], whatsapp: null as string | null };

export const captacaoSchema = z.object({
  ligada: z.boolean(),
  titulo: z.string().trim().min(3, "Escreva o título").max(120),
  texto: z.string().trim().max(400).default(""),
  servicos: z.array(z.string().trim().min(2).max(60)).max(12).default([]),
  whatsapp: z.string().optional().nullable().transform((v) => (v ?? "").replace(/\D/g, "") || null).refine((d) => !d || (d.length >= 10 && d.length <= 13), "WhatsApp inválido (com DDD)."),
});

export async function salvarCaptacao(db: Database, actor: Actor, raw: z.input<typeof captacaoSchema>) {
  const { agencia, membro } = await escopoDaAgencia(db, actor);
  if (!pode.editarClientes(membro)) throw new ForbiddenError("A página de captação é do administrador, do gestor e do atendimento.");
  const d = captacaoSchema.parse(raw);
  await db.update(agencias).set({ captacao: { ...d, servicos: [...new Set(d.servicos)] }, updatedAt: new Date().toISOString() }).where(eq(agencias.id, agencia.id));
}

/** Dados públicos da página (só se a agência ligou). */
export async function paginaDeCaptacao(db: Database, slug: string) {
  exigirAgenciasLigado();
  const a = await db.query.agencias.findFirst({ where: eq(agencias.slug, z.string().max(80).parse(slug)), columns: { id: true, nome: true, slug: true, situacao: true, captacao: true } });
  if (!a || a.situacao === "PAUSADA" || !a.captacao?.ligada) throw new NotFoundError("Página não encontrada.");
  return { nome: a.nome, slug: a.slug, ...a.captacao };
}

/** Origem do Comercial a partir do canal (regra pura, testada). */
export function origemDoCanal(c: Canal): (typeof OPORTUNIDADE_ORIGENS)[number] {
  if (c.endsWith("-pago")) return "ANUNCIO";
  if (c === "instagram-organico") return "INSTAGRAM";
  if (c === "whatsapp") return "WHATSAPP";
  if (c === "indicacao") return "INDICACAO";
  return "SITE";
}

export const pedidoSchema = envioSchema.and(z.object({ empresa: z.string().trim().min(2, "Informe o nome da empresa.").max(120), servico: z.string().trim().max(60).optional().nullable() }));

/** Grava o pedido como negociação nova. Robô recebe "ok" sem gravar; o mesmo envio repetido não duplica. */
export async function registrarPedidoDaAgencia(db: Database, slug: string, raw: z.input<typeof pedidoSchema>, opts: { hostProprio?: string | null } = {}) {
  const input = pedidoSchema.parse(raw);
  const a = await db.query.agencias.findFirst({ where: eq(agencias.slug, slug) });
  if (!a || a.situacao === "PAUSADA" || !a.captacao?.ligada) throw new NotFoundError("Página não encontrada.");
  if (input.site || (input.tempoMs !== undefined && input.tempoMs < TEMPO_MINIMO_MS)) return { novo: false };
  const servico = input.servico && a.captacao.servicos.includes(input.servico) ? input.servico : null;
  const o = input.origem ?? {};
  const canal = canalDe({ ...o, hostProprio: opts.hostProprio ?? null });
  const clickIds = Object.fromEntries(CLICK_IDS.flatMap((k) => (o[k] ? [[k, o[k]!]] : [])));
  let origemSite: string | null = null;
  try { origemSite = o.referrer ? new URL(o.referrer).hostname.replace(/^www\./, "") : null; } catch { origemSite = null; }
  const id = newId("agop");
  const r = await db.insert(agenciaOportunidades).values({
    id, agenciaId: a.id, empresa: input.empresa, contatoNome: input.nome, whatsapp: input.whatsapp, email: input.email, origem: origemDoCanal(canal), servicos: servico,
    etapa: "PROSPECCAO", canal, utmSource: o.utm_source ?? null, utmMedium: o.utm_medium ?? null, utmCampaign: o.utm_campaign ?? null, clickIds, origemSite, pagina: input.pagina, mensagem: input.mensagem, chaveEnvio: input.chaveEnvio,
  }).onConflictDoNothing().returning({ id: agenciaOportunidades.id });
  if (!r.length) return { novo: false };
  try {
    const para = await db.select({ email: users.email }).from(agenciaMembros).innerJoin(users, eq(users.id, agenciaMembros.userId))
      .where(and(eq(agenciaMembros.agenciaId, a.id), inArray(agenciaMembros.funcao, ["ADMIN", "GESTOR", "ATENDIMENTO"]), isNull(users.disabledAt)));
    for (const { email } of para) {
      await sendEmail(db, { kind: "AGENCIA_NOVO_CONTATO", to: email, brand: "NEXTLEVEL_COMMERCE", dedupeKey: `agencia-contato:${id}:${email}`,
        subject: `Novo contato pelo site: ${input.empresa}${servico ? ` · ${servico}` : ""}`,
        text: `${input.nome} (${input.empresa}) pediu contato pela página da ${a.nome}. Veio por: ${ROTULO_CANAL[canal]}.\n\nResponder rápido aumenta a chance de fechar. A negociação já está no Comercial.`,
        cta: { label: "Abrir no Comercial", url: `${(agenciasUrl() ?? brandByCode("NEXTLEVEL_COMMERCE").baseUrl).replace(/\/$/, "")}/agencia/comercial/${id}` } });
    }
  } catch { /* aviso nunca derruba o pedido */ }
  return { novo: true };
}

/** Pedidos do site ainda sem resposta (fila do dia): chegaram pela página, seguem em prospecção e ninguém registrou contato. */
export async function contatosSemResposta(db: Database, actor: Actor) {
  const { membro } = await escopoDaAgencia(db, actor);
  if (!pode.editarClientes(membro)) return [];
  const rows = await db.select({ id: agenciaOportunidades.id, empresa: agenciaOportunidades.empresa, createdAt: agenciaOportunidades.createdAt, canal: agenciaOportunidades.canal }).from(agenciaOportunidades)
    .where(and(eq(agenciaOportunidades.agenciaId, membro.agenciaId), isNull(agenciaOportunidades.ultimoContatoEm), eq(agenciaOportunidades.etapa, "PROSPECCAO")));
  return rows.filter((x) => x.canal);
}
