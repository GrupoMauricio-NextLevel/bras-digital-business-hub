import { and, asc, desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { OPORTUNIDADE_ETAPAS, OPORTUNIDADE_ORIGENS, agenciaClientes, agenciaMembros, agenciaOportunidades, users, type OportunidadeEtapa } from "@/db/schema";
import type { Actor } from "@/lib/domain/access";
import { recordAudit } from "@/lib/domain/audit";
import { DomainError, ForbiddenError, NotFoundError } from "@/lib/domain/errors";
import { newId } from "@/lib/ids";
import { escopoDaAgencia, pode, type Membro } from "./acesso";
import { hojeEmSaoPaulo } from "./clientes";

/**
 * Comercial da agência (D317, briefing da UPClips): funil prospecção → contato realizado → reunião agendada → proposta
 * enviada → negociação → contrato fechado (ou perdido, com motivo). "Virar cliente" cria o cliente na carteira com os
 * dados da negociação e começa o onboarding. Usa quem cuida da carteira (administrador, gestor, atendimento).
 */
export const ETAPA_COMERCIAL_ROTULO: Record<OportunidadeEtapa, string> = {
  PROSPECCAO: "Prospecção", CONTATO: "Contato realizado", REUNIAO: "Reunião agendada", PROPOSTA: "Proposta enviada", NEGOCIACAO: "Negociação", FECHADO: "Contrato fechado", PERDIDO: "Perdido",
};
export const ORIGEM_ROTULO: Record<(typeof OPORTUNIDADE_ORIGENS)[number], string> = {
  INDICACAO: "Indicação", INSTAGRAM: "Instagram", SITE: "Site", ANUNCIO: "Anúncio", WHATSAPP: "WhatsApp", EVENTO: "Evento", PROSPECCAO_ATIVA: "Prospecção ativa", OUTRO: "Outro",
};
export const MOTIVOS_PERDA_COMERCIAL = ["Preço", "Escolheu outra agência", "Sem orçamento agora", "Não respondeu", "Vai fazer internamente", "Outro"] as const;

/** Lista de onboarding do briefing (D317). Três itens marcam sozinhos pelos dados do cliente. */
export const ONBOARDING_ITENS = [
  ["contrato", "Contrato assinado"], ["cadastro", "Cadastro completo"], ["plano", "Plano configurado"], ["briefing", "Briefing preenchido"],
  ["identidade", "Identidade visual recebida"], ["acessos", "Acessos às redes organizados"], ["drive", "Pasta do Google Drive criada"],
  ["equipe", "Equipe responsável definida"], ["reuniao", "Primeira reunião realizada"], ["gravacao", "Primeira gravação agendada"], ["planejamento", "Planejamento mensal iniciado"],
] as const;
export type OnboardingChave = (typeof ONBOARDING_ITENS)[number][0];

/** Regra pura (testada): situação de cada item do onboarding, com os automáticos lidos do cliente. */
export function situacaoDoOnboarding(o: Record<string, string | null> | null, c: { whatsapp: string | null; email: string | null; documento: string | null; valorMensalCents: number | null; diaVencimento: number | null; incluso: Record<string, number | undefined>; responsavelId: string | null }, temPlanejamento: boolean) {
  const auto: Partial<Record<OnboardingChave, boolean>> = {
    cadastro: !!(c.whatsapp || c.email) && !!c.documento,
    plano: !!c.valorMensalCents && !!c.diaVencimento && Object.values(c.incluso).some((v) => (v ?? 0) > 0),
    equipe: !!c.responsavelId,
    planejamento: temPlanejamento,
  };
  const itens = ONBOARDING_ITENS.map(([chave, rotulo]) => ({ chave, rotulo, automatico: chave in auto, feito: auto[chave] ?? !!o?.[chave], em: o?.[chave] ?? null }));
  return { itens, feitos: itens.filter((i) => i.feito).length, total: itens.length };
}

const usaComercial = (m: Membro) => pode.editarClientes(m);
async function escopo(db: Database, actor: Actor) {
  const e = await escopoDaAgencia(db, actor);
  if (!usaComercial(e.membro)) throw new ForbiddenError("O comercial é do administrador, do gestor e do atendimento.");
  return e;
}
const so = (v: string | null | undefined) => (v ?? "").replace(/\D/g, "");
const vazio = (v: string | null | undefined) => (v && v.trim() ? v.trim() : null);

export const oportunidadeSchema = z.object({
  empresa: z.string().trim().min(2, "Informe a empresa").max(120),
  contatoNome: z.string().trim().max(120).optional().nullable(),
  whatsapp: z.string().trim().max(20).optional().nullable(),
  email: z.union([z.literal(""), z.string().trim().toLowerCase().email("E-mail inválido")]).optional().nullable(),
  segmento: z.string().trim().max(80).optional().nullable(),
  origem: z.enum(OPORTUNIDADE_ORIGENS).optional(),
  servicos: z.string().trim().max(500).optional().nullable(),
  valorPropostoCents: z.number().int().min(0).max(100_000_000).optional().nullable(),
  responsavelId: z.string().optional().nullable(),
  proximaAtividade: z.string().trim().max(200).optional().nullable(),
  proximaAtividadeEm: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable().or(z.literal("")),
  observacoes: z.string().trim().max(2000).optional().nullable(),
});

async function responsavelValido(db: Database, agenciaId: string, userId: string | null | undefined) {
  if (!userId) return null;
  const r = await db.select({ id: users.id }).from(agenciaMembros).innerJoin(users, eq(users.id, agenciaMembros.userId)).where(and(eq(agenciaMembros.agenciaId, agenciaId), eq(agenciaMembros.userId, userId), isNull(users.disabledAt)));
  if (!r.length) throw new DomainError("RESPONSAVEL", "O responsável precisa ser alguém ativo da equipe.");
  return userId;
}

export async function criarOportunidade(db: Database, actor: Actor, raw: z.input<typeof oportunidadeSchema>) {
  const { membro } = await escopo(db, actor);
  const d = oportunidadeSchema.parse(raw);
  const id = newId("agop");
  await db.insert(agenciaOportunidades).values({
    id, agenciaId: membro.agenciaId, empresa: d.empresa, contatoNome: vazio(d.contatoNome), whatsapp: so(d.whatsapp) || null, email: vazio(d.email), segmento: vazio(d.segmento),
    origem: d.origem ?? "OUTRO", servicos: vazio(d.servicos), valorPropostoCents: d.valorPropostoCents ?? null, responsavelId: (await responsavelValido(db, membro.agenciaId, d.responsavelId)) ?? actor.userId,
    proximaAtividade: vazio(d.proximaAtividade), proximaAtividadeEm: vazio(d.proximaAtividadeEm), observacoes: vazio(d.observacoes),
  });
  return { id };
}

async function oportunidadeDaAgencia(db: Database, agenciaId: string, id: string) {
  const o = await db.query.agenciaOportunidades.findFirst({ where: and(eq(agenciaOportunidades.id, id), eq(agenciaOportunidades.agenciaId, agenciaId)) });
  if (!o) throw new NotFoundError("Oportunidade não encontrada.");
  return o;
}

/** Atualiza dados e etapa. "Registrar contato" marca o último contato agora. Fechado e perdido têm caminhos próprios. */
export async function atualizarOportunidade(db: Database, actor: Actor, id: string, raw: Partial<z.input<typeof oportunidadeSchema>> & { etapa?: OportunidadeEtapa; registrarContato?: boolean }) {
  const { membro } = await escopo(db, actor);
  const o = await oportunidadeDaAgencia(db, membro.agenciaId, id);
  if (o.etapa === "FECHADO" && raw.etapa !== undefined) throw new DomainError("FECHADA", "Esta negociação já virou cliente.");
  if (o.etapa === "PERDIDO" && raw.etapa === undefined && !raw.registrarContato && Object.keys(raw).length) throw new DomainError("ENCERRADA", "Negociação perdida. Reabra escolhendo uma etapa.");
  const d = oportunidadeSchema.partial().parse(raw);
  const etapa = raw.etapa !== undefined ? z.enum(OPORTUNIDADE_ETAPAS).parse(raw.etapa) : undefined;
  if (etapa === "FECHADO") throw new DomainError("USE_VIRAR_CLIENTE", "Para fechar, use \"Virar cliente\".");
  if (etapa === "PERDIDO") throw new DomainError("USE_PERDER", "Para perder, escolha o motivo.");
  const patch: Partial<typeof agenciaOportunidades.$inferInsert> = {};
  if (d.empresa !== undefined) patch.empresa = d.empresa;
  for (const k of ["contatoNome", "email", "segmento", "servicos", "proximaAtividade", "observacoes", "proximaAtividadeEm"] as const) if (d[k] !== undefined) patch[k] = vazio(d[k]);
  if (d.whatsapp !== undefined) patch.whatsapp = so(d.whatsapp) || null;
  if (d.origem !== undefined) patch.origem = d.origem;
  if (d.valorPropostoCents !== undefined) patch.valorPropostoCents = d.valorPropostoCents;
  if (d.responsavelId !== undefined) patch.responsavelId = await responsavelValido(db, membro.agenciaId, d.responsavelId);
  if (etapa) { patch.etapa = etapa; patch.motivoPerda = null; }
  if (raw.registrarContato) patch.ultimoContatoEm = new Date().toISOString();
  if (!Object.keys(patch).length) return;
  await db.update(agenciaOportunidades).set({ ...patch, updatedAt: new Date().toISOString() }).where(eq(agenciaOportunidades.id, o.id));
}

export async function perderOportunidade(db: Database, actor: Actor, id: string, motivo: string) {
  const { membro } = await escopo(db, actor);
  const o = await oportunidadeDaAgencia(db, membro.agenciaId, id);
  if (o.etapa === "FECHADO") throw new DomainError("FECHADA", "Esta negociação já virou cliente.");
  const m = z.enum(MOTIVOS_PERDA_COMERCIAL).parse(motivo);
  await db.update(agenciaOportunidades).set({ etapa: "PERDIDO", motivoPerda: m, updatedAt: new Date().toISOString() }).where(eq(agenciaOportunidades.id, o.id));
}

/**
 * Fechou: cria o cliente na carteira com os dados da negociação (o valor só entra se a pessoa pode mexer em contrato;
 * senão fica para o financeiro) e começa o onboarding. Não cria duas vezes.
 */
export async function virarCliente(db: Database, actor: Actor, id: string) {
  const { membro } = await escopo(db, actor);
  const o = await oportunidadeDaAgencia(db, membro.agenciaId, id);
  if (o.clienteId) return { clienteId: o.clienteId, novo: false };
  if (o.etapa === "PERDIDO") throw new DomainError("PERDIDA", "Reabra a negociação antes de virar cliente.");
  const clienteId = newId("agcl");
  const agora = new Date().toISOString();
  await db.transaction(async (tx) => {
    await tx.insert(agenciaClientes).values({
      id: clienteId, agenciaId: membro.agenciaId, nome: o.empresa, segmento: o.segmento, contatoNome: o.contatoNome, whatsapp: o.whatsapp, email: o.email, pacote: o.servicos,
      valorMensalCents: pode.editarContrato(membro) ? o.valorPropostoCents : null, responsavelId: o.responsavelId, vendedorId: o.responsavelId ?? actor.userId, inicioEm: hojeEmSaoPaulo(),
      observacoes: o.observacoes, onboarding: { contrato: null },
    });
    await tx.update(agenciaOportunidades).set({ etapa: "FECHADO", clienteId, updatedAt: agora }).where(eq(agenciaOportunidades.id, o.id));
  });
  await recordAudit(db, actor, { action: "AGENCIA_VIROU_CLIENTE", entityType: "agencia_cliente", entityId: clienteId, after: { oportunidadeId: o.id, empresa: o.empresa } }, { force: true });
  return { clienteId, novo: true };
}

/** Marcar ou desmarcar um item manual do onboarding do cliente. */
export async function marcarOnboarding(db: Database, actor: Actor, clienteId: string, chave: string, feito: boolean) {
  const { membro } = await escopo(db, actor);
  const k = z.enum(ONBOARDING_ITENS.map(([c]) => c) as [OnboardingChave, ...OnboardingChave[]]).parse(chave);
  const c = await db.query.agenciaClientes.findFirst({ where: and(eq(agenciaClientes.id, clienteId), eq(agenciaClientes.agenciaId, membro.agenciaId)) });
  if (!c) throw new NotFoundError("Cliente não encontrado.");
  await db.update(agenciaClientes).set({ onboarding: { ...(c.onboarding ?? {}), [k]: feito ? new Date().toISOString() : null }, updatedAt: new Date().toISOString() }).where(eq(agenciaClientes.id, c.id));
}

export type OportunidadeNaLista = typeof agenciaOportunidades.$inferSelect & { responsavelNome: string | null; atrasada: boolean; hoje: boolean };

export async function listarOportunidades(db: Database, actor: Actor, hoje = hojeEmSaoPaulo()): Promise<OportunidadeNaLista[]> {
  const { membro } = await escopo(db, actor);
  const rows = await db.select({ o: agenciaOportunidades, resp: users.name }).from(agenciaOportunidades).leftJoin(users, eq(users.id, agenciaOportunidades.responsavelId))
    .where(eq(agenciaOportunidades.agenciaId, membro.agenciaId)).orderBy(asc(agenciaOportunidades.proximaAtividadeEm), desc(agenciaOportunidades.updatedAt));
  return rows.map((r) => {
    const aberta = r.o.etapa !== "FECHADO" && r.o.etapa !== "PERDIDO";
    return { ...r.o, responsavelNome: r.resp, atrasada: aberta && !!r.o.proximaAtividadeEm && r.o.proximaAtividadeEm < hoje, hoje: aberta && r.o.proximaAtividadeEm === hoje };
  });
}

export async function fichaDaOportunidade(db: Database, actor: Actor, id: string) {
  const { membro } = await escopo(db, actor);
  return oportunidadeDaAgencia(db, membro.agenciaId, id);
}

/** Números do funil (testado): abertas, valor em negociação, atividades de hoje e atrasadas, fechadas e perdidas no mês. */
export function resumoDoFunil(lista: readonly OportunidadeNaLista[], hoje: string) {
  const mes = hoje.slice(0, 7);
  const abertas = lista.filter((o) => o.etapa !== "FECHADO" && o.etapa !== "PERDIDO");
  const noMes = (o: OportunidadeNaLista) => o.updatedAt.slice(0, 7) === mes;
  const fechadas = lista.filter((o) => o.etapa === "FECHADO" && noMes(o)).length;
  const perdidas = lista.filter((o) => o.etapa === "PERDIDO" && noMes(o)).length;
  return {
    abertas: abertas.length, valorEmNegociacaoCents: abertas.reduce((s, o) => s + (o.valorPropostoCents ?? 0), 0),
    hoje: abertas.filter((o) => o.hoje).length, atrasadas: abertas.filter((o) => o.atrasada).length, semProxima: abertas.filter((o) => !o.proximaAtividadeEm).length,
    fechadasNoMes: fechadas, perdidasNoMes: perdidas, conversao: fechadas + perdidas ? Math.round((fechadas / (fechadas + perdidas)) * 100) : null,
  };
}
