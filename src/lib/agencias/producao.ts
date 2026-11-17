import { and, asc, desc, eq, inArray, isNull, lt, ne, or } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import {
  PECA_ETAPAS, PECA_PRIORIDADES, PECA_TIPOS, agenciaCiclos, agenciaClienteEquipe, agenciaClientes, agenciaMembros, agenciaPecaComentarios, agenciaPecaEventos, agenciaPecas, users,
  type AgenciaFuncao, type AgenciaIncluso, type PecaEtapa, type PecaTipo,
} from "@/db/schema";
import type { Actor } from "@/lib/domain/access";
import { DomainError, ForbiddenError, NotFoundError } from "@/lib/domain/errors";
import { newId } from "@/lib/ids";
import { escopoDaAgencia, pode, podeVerCliente, type Membro } from "./acesso";
import { hojeEmSaoPaulo } from "./clientes";
import {
  ETAPA_ROTULO, TIPO_PARA_INCLUSO, TIPO_ROTULO, atrasada, contagemDoCiclo, escolherResponsavel, mesDe, mesRotulo, podePedirAjuste, prazoDaEtapa, proximaEtapa,
  publicada, situacaoInicial, situacaoRotulo, situacaoValida, type ContagemDoCiclo,
} from "./fluxo";

/**
 * Produção da agência (D314, Fase 1A): o ciclo do mês de cada cliente e a peça de conteúdo que atravessa os
 * departamentos. Ao concluir uma etapa, a peça vai sozinha para a pessoa da próxima etapa (equipe do cliente), com prazo.
 */
type Peca = typeof agenciaPecas.$inferSelect;
type Cliente = typeof agenciaClientes.$inferSelect;

async function equipeDoCliente(db: Database, clienteId: string) {
  return db.select({ userId: agenciaClienteEquipe.userId, funcao: agenciaMembros.funcao, nome: users.name }).from(agenciaClienteEquipe)
    .innerJoin(agenciaMembros, eq(agenciaMembros.userId, agenciaClienteEquipe.userId)).innerJoin(users, eq(users.id, agenciaClienteEquipe.userId))
    .where(and(eq(agenciaClienteEquipe.clienteId, clienteId), isNull(users.disabledAt))).orderBy(asc(users.name));
}

async function membroAtivo(db: Database, agenciaId: string, userId: string) {
  const r = await db.select({ id: users.id, nome: users.name, funcao: agenciaMembros.funcao }).from(agenciaMembros).innerJoin(users, eq(users.id, agenciaMembros.userId))
    .where(and(eq(agenciaMembros.agenciaId, agenciaId), eq(agenciaMembros.userId, userId), isNull(users.disabledAt)));
  if (!r[0]) throw new DomainError("RESPONSAVEL", "A pessoa precisa ser alguém ativo da equipe.");
  return r[0];
}

/** Abre (ou acha) o ciclo do mês do cliente; o contratado é a cópia do contrato neste momento. */
export async function garantirCiclo(db: Database, cliente: Pick<Cliente, "id" | "agenciaId" | "incluso">, mes: string) {
  const achado = await db.query.agenciaCiclos.findFirst({ where: and(eq(agenciaCiclos.clienteId, cliente.id), eq(agenciaCiclos.mes, mes)) });
  if (achado) return achado;
  await db.insert(agenciaCiclos).values({ id: newId("agci"), agenciaId: cliente.agenciaId, clienteId: cliente.id, mes, contratado: cliente.incluso }).onConflictDoNothing();
  return (await db.query.agenciaCiclos.findFirst({ where: and(eq(agenciaCiclos.clienteId, cliente.id), eq(agenciaCiclos.mes, mes)) }))!;
}

async function clienteVisivel(db: Database, actor: Actor, clienteId: string) {
  const { membro, agencia } = await escopoDaAgencia(db, actor);
  const cliente = await db.query.agenciaClientes.findFirst({ where: and(eq(agenciaClientes.id, clienteId), eq(agenciaClientes.agenciaId, membro.agenciaId)) });
  if (!cliente) throw new NotFoundError("Cliente não encontrado.");
  const equipe = await equipeDoCliente(db, cliente.id);
  if (!podeVerCliente(membro, cliente, equipe.map((p) => p.userId))) throw new NotFoundError("Cliente não encontrado.");
  return { membro, agencia, cliente, equipe };
}

/** Vê a peça quem vê o cliente ou quem é o responsável por ela agora. */
async function pecaVisivel(db: Database, actor: Actor, pecaId: string) {
  const { membro, agencia } = await escopoDaAgencia(db, actor);
  const peca = await db.query.agenciaPecas.findFirst({ where: and(eq(agenciaPecas.id, pecaId), eq(agenciaPecas.agenciaId, membro.agenciaId)) });
  if (!peca) throw new NotFoundError("Peça não encontrada.");
  const cliente = (await db.query.agenciaClientes.findFirst({ where: eq(agenciaClientes.id, peca.clienteId) }))!;
  const equipe = await equipeDoCliente(db, cliente.id);
  if (peca.responsavelId !== membro.userId && !podeVerCliente(membro, cliente, equipe.map((p) => p.userId))) throw new NotFoundError("Peça não encontrada.");
  return { membro, agencia, cliente, equipe, peca };
}

const podeMexer = (m: Membro, p: Pick<Peca, "responsavelId">) => pode.gerirProducao(m) || p.responsavelId === m.userId;

async function evento(db: Database, actor: Actor, peca: Pick<Peca, "id" | "agenciaId">, tipo: string, mensagem: string, link?: string | null) {
  const u = await db.query.users.findFirst({ where: eq(users.id, actor.userId), columns: { name: true } });
  await db.insert(agenciaPecaEventos).values({ id: newId("agpe"), pecaId: peca.id, agenciaId: peca.agenciaId, tipo, mensagem, link: link ?? null, autorId: actor.userId, autorNome: u?.name ?? null });
}

const link = z.string().trim().url("Link inválido (comece com https://)").max(1000);
export const novaPecaSchema = z.object({
  clienteId: z.string().min(1),
  tipo: z.enum(PECA_TIPOS).default("VIDEO"),
  titulo: z.string().trim().min(2, "Dê um título à peça").max(160),
  objetivo: z.string().trim().max(500).optional().nullable(),
  mes: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  extra: z.boolean().default(false),
});

export async function criarPeca(db: Database, actor: Actor, raw: z.input<typeof novaPecaSchema>, hoje = hojeEmSaoPaulo()) {
  const d = novaPecaSchema.parse(raw);
  const { membro, agencia, cliente, equipe } = await clienteVisivel(db, actor, d.clienteId);
  if (!pode.planejar(membro)) throw new ForbiddenError("Sua função não cria peças.");
  if (cliente.situacao === "ENCERRADO") throw new DomainError("CLIENTE_ENCERRADO", "Cliente com contrato encerrado.");
  const ciclo = await garantirCiclo(db, cliente, d.mes ?? mesDe(hoje));
  const id = newId("agpc");
  await db.insert(agenciaPecas).values({
    id, agenciaId: agencia.id, clienteId: cliente.id, cicloId: ciclo.id, tipo: d.tipo, titulo: d.titulo, objetivo: d.objetivo || null, extra: d.extra,
    etapa: "PLANEJAMENTO", situacao: situacaoInicial("PLANEJAMENTO"), responsavelId: escolherResponsavel("PLANEJAMENTO", equipe, cliente.responsavelId), prazo: prazoDaEtapa("PLANEJAMENTO", hoje, agencia.prazosEtapas),
  });
  await evento(db, actor, { id, agenciaId: agencia.id }, "CRIADA", `Peça criada${d.extra ? " (extra, fora do pacote)" : ""} no ciclo de ${mesRotulo(ciclo.mes)}.`);
  return { id };
}

const TIPO_DO_INCLUSO: [keyof AgenciaIncluso, PecaTipo, string][] = [["videos", "VIDEO", "Vídeo"], ["fotos", "FOTO", "Foto"], ["posts", "CARROSSEL", "Post"], ["criativos", "CRIATIVO", "Criativo"]];

/** Gera as peças que faltam no ciclo para cumprir o contratado (vídeos, fotos, posts, criativos). Rodar de novo não duplica. */
export async function planejarMes(db: Database, actor: Actor, clienteId: string, mes: string, hoje = hojeEmSaoPaulo()) {
  const { membro, agencia, cliente, equipe } = await clienteVisivel(db, actor, clienteId);
  if (!pode.planejar(membro)) throw new ForbiddenError("Sua função não planeja o mês.");
  if (cliente.situacao !== "ATIVO") throw new DomainError("CLIENTE_INATIVO", "Só clientes ativos recebem planejamento.");
  const ciclo = await garantirCiclo(db, cliente, mes);
  const existentes = await db.select({ tipo: agenciaPecas.tipo }).from(agenciaPecas).where(and(eq(agenciaPecas.cicloId, ciclo.id), eq(agenciaPecas.extra, false)));
  const novas: (typeof agenciaPecas.$inferInsert)[] = [];
  for (const [chave, tipo, rotulo] of TIPO_DO_INCLUSO) {
    const tem = existentes.filter((p) => TIPO_PARA_INCLUSO[p.tipo] === chave).length;
    for (let i = tem + 1; i <= (ciclo.contratado[chave] ?? 0); i++) {
      novas.push({ id: newId("agpc"), agenciaId: agencia.id, clienteId: cliente.id, cicloId: ciclo.id, tipo, titulo: `${rotulo} ${i} · ${mesRotulo(mes)}`, etapa: "PLANEJAMENTO", situacao: situacaoInicial("PLANEJAMENTO"), responsavelId: escolherResponsavel("PLANEJAMENTO", equipe, cliente.responsavelId), prazo: prazoDaEtapa("PLANEJAMENTO", hoje, agencia.prazosEtapas) });
    }
  }
  if (novas.length) {
    await db.insert(agenciaPecas).values(novas);
    const u = await db.query.users.findFirst({ where: eq(users.id, actor.userId), columns: { name: true } });
    await db.insert(agenciaPecaEventos).values(novas.map((p) => ({ id: newId("agpe"), pecaId: p.id, agenciaId: agencia.id, tipo: "CRIADA", mensagem: `Planejada pelo pacote de ${mesRotulo(mes)}.`, autorId: actor.userId, autorNome: u?.name ?? null })));
  }
  return { criadas: novas.length };
}

export const atualizacaoPecaSchema = z.object({
  titulo: z.string().trim().min(2).max(160).optional(),
  objetivo: z.string().trim().max(500).nullable().optional(),
  roteiro: z.string().max(20_000).nullable().optional(),
  referencias: z.string().max(4_000).nullable().optional(),
  legenda: z.string().max(5_000).nullable().optional(),
  linkBrutos: link.nullable().optional().or(z.literal("")),
  linkVersao: link.nullable().optional().or(z.literal("")),
  linkPublicacao: link.nullable().optional().or(z.literal("")),
  publicarEm: z.string().datetime({ offset: true }).nullable().optional().or(z.literal("")),
  prioridade: z.enum(PECA_PRIORIDADES).optional(),
  situacao: z.string().max(40).optional(),
  prazo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
});

/** Atualiza a peça. Responsável ou gestor; prazo e prioridade só o gestor (ou administrador). Nova versão entra no histórico. */
export async function atualizarPeca(db: Database, actor: Actor, pecaId: string, raw: z.input<typeof atualizacaoPecaSchema>) {
  const { membro, peca } = await pecaVisivel(db, actor, pecaId);
  if (!podeMexer(membro, peca)) throw new ForbiddenError("Só o responsável da etapa ou o gestor mexe nesta peça.");
  const d = atualizacaoPecaSchema.parse(raw);
  if ((d.prazo !== undefined || d.prioridade !== undefined) && !pode.gerirProducao(membro)) throw new ForbiddenError("Prazo e prioridade ficam com o gestor.");
  if (d.situacao !== undefined && !situacaoValida(peca.etapa, d.situacao)) throw new DomainError("SITUACAO", "Situação que não existe nesta etapa.");
  const vazioNull = (v: string | null | undefined) => (v === "" ? null : v);
  const patch: Partial<Peca> = {};
  for (const k of ["titulo", "objetivo", "roteiro", "referencias", "legenda", "prioridade", "situacao", "prazo"] as const) if (d[k] !== undefined) (patch as Record<string, unknown>)[k] = vazioNull(d[k] as string | null);
  for (const k of ["linkBrutos", "linkPublicacao"] as const) if (d[k] !== undefined) patch[k] = vazioNull(d[k]) ?? null;
  if (d.publicarEm !== undefined) patch.publicarEm = vazioNull(d.publicarEm) ?? null;
  const novaVersao = d.linkVersao !== undefined && vazioNull(d.linkVersao) && d.linkVersao !== peca.linkVersao;
  if (d.linkVersao !== undefined) patch.linkVersao = vazioNull(d.linkVersao) ?? null;
  if (novaVersao) patch.versao = peca.versao + 1;
  if (!Object.keys(patch).length) return;
  await db.update(agenciaPecas).set({ ...patch, updatedAt: new Date().toISOString() }).where(eq(agenciaPecas.id, peca.id));
  if (d.situacao !== undefined && d.situacao !== peca.situacao) await evento(db, actor, peca, "SITUACAO", `${situacaoRotulo(peca.etapa, peca.situacao)} → ${situacaoRotulo(peca.etapa, d.situacao)}`);
  if (novaVersao) await evento(db, actor, peca, "VERSAO", `Versão ${peca.versao + 1} enviada.`, patch.linkVersao);
  if (d.linkBrutos && d.linkBrutos !== peca.linkBrutos) await evento(db, actor, peca, "BRUTOS", "Arquivos brutos disponíveis.", d.linkBrutos);
  if (d.prazo !== undefined && d.prazo !== peca.prazo) await evento(db, actor, peca, "PRAZO", `Prazo ${d.prazo ? `mudou para ${d.prazo.split("-").reverse().join("/")}` : "removido"}.`);
  if (d.prioridade && d.prioridade !== peca.prioridade) await evento(db, actor, peca, "PRIORIDADE", `Prioridade: ${d.prioridade.toLowerCase()}.`);
}

/** O que falta para concluir a etapa (regra testada). */
export function requisitoParaAvancar(p: Pick<Peca, "etapa" | "linkBrutos" | "linkVersao" | "linkPublicacao">): string | null {
  if (p.etapa === "CAPTACAO" && !p.linkBrutos) return "Registre o link dos arquivos brutos antes de mandar para a edição.";
  if (p.etapa === "EDICAO" && !p.linkVersao) return "Envie o link da versão editada antes de mandar para a revisão.";
  if (p.etapa === "AGENDAMENTO" && !p.linkPublicacao) return "Registre o link da publicação para marcar como publicado.";
  return null;
}

/** Conclui a etapa: a peça vai para a próxima etapa, com a pessoa da equipe do cliente e o prazo padrão. */
export async function avancarPeca(db: Database, actor: Actor, pecaId: string, hoje = hojeEmSaoPaulo()) {
  const { membro, agencia, cliente, equipe, peca } = await pecaVisivel(db, actor, pecaId);
  if (!podeMexer(membro, peca)) throw new ForbiddenError("Só o responsável da etapa ou o gestor conclui esta etapa.");
  const proxima = proximaEtapa(peca.etapa, { tipo: peca.tipo, exigeAprovacao: cliente.exigeAprovacao });
  if (!proxima) throw new DomainError("CONCLUIDA", "A peça já está concluída.");
  const falta = requisitoParaAvancar(peca); if (falta) throw new DomainError("REQUISITO", falta);
  const responsavelId = escolherResponsavel(proxima, equipe, cliente.responsavelId);
  // Concorrência: só avança se ninguém mudou a etapa no meio do caminho (dois cliques não pulam duas etapas).
  const r = await db.update(agenciaPecas).set({ etapa: proxima, situacao: situacaoInicial(proxima), responsavelId, prazo: prazoDaEtapa(proxima, hoje, agencia.prazosEtapas), publicadoEm: proxima === "PUBLICADO" ? new Date().toISOString() : peca.publicadoEm, updatedAt: new Date().toISOString() })
    .where(and(eq(agenciaPecas.id, peca.id), eq(agenciaPecas.etapa, peca.etapa))).returning({ id: agenciaPecas.id });
  if (!r.length) throw new DomainError("MUDOU", "A peça mudou de etapa agora há pouco. Atualize a página.");
  const nome = responsavelId ? equipe.find((p) => p.userId === responsavelId)?.nome ?? (await db.query.users.findFirst({ where: eq(users.id, responsavelId), columns: { name: true } }))?.name : null;
  await evento(db, actor, peca, "ETAPA", `Etapa ${ETAPA_ROTULO[peca.etapa]} concluída → ${ETAPA_ROTULO[proxima]}${nome ? `, com ${nome}` : " (sem responsável: defina na equipe do cliente)"}.`);
  return { etapa: proxima, responsavelId };
}

/** Ajuste pedido na revisão interna (ou pelo atendimento, em nome do cliente): volta para a edição, com o motivo. */
export async function pedirAjuste(db: Database, actor: Actor, pecaId: string, motivo: string, hoje = hojeEmSaoPaulo()) {
  const { membro, agencia, cliente, equipe, peca } = await pecaVisivel(db, actor, pecaId);
  if (!podeMexer(membro, peca)) throw new ForbiddenError("Só o responsável da etapa ou o gestor pede ajuste.");
  if (!podePedirAjuste(peca.etapa)) throw new DomainError("ETAPA", "Ajuste só na revisão interna ou na aprovação do cliente.");
  const texto = z.string().trim().min(3, "Diga o que precisa mudar").max(2000).parse(motivo);
  const responsavelId = escolherResponsavel("EDICAO", equipe, cliente.responsavelId);
  await db.update(agenciaPecas).set({ etapa: "EDICAO", situacao: "AJUSTES", responsavelId, prazo: prazoDaEtapa("EDICAO", hoje, agencia.prazosEtapas), updatedAt: new Date().toISOString() }).where(eq(agenciaPecas.id, peca.id));
  await evento(db, actor, peca, "AJUSTE", `Ajuste pedido na ${ETAPA_ROTULO[peca.etapa].toLowerCase()}: ${texto}`);
  const u = await db.query.users.findFirst({ where: eq(users.id, actor.userId), columns: { name: true } });
  await db.insert(agenciaPecaComentarios).values({ id: newId("agcm"), pecaId: peca.id, agenciaId: peca.agenciaId, autorId: actor.userId, autorNome: u?.name ?? "Equipe", texto: `Ajuste pedido: ${texto}`, interno: true });
}

/** Transferir a peça (ex.: de um editor para outro). Só o gestor ou o administrador. */
export async function transferirPeca(db: Database, actor: Actor, pecaId: string, userId: string) {
  const { membro, peca } = await pecaVisivel(db, actor, pecaId);
  if (!pode.gerirProducao(membro)) throw new ForbiddenError("Só o gestor transfere peças.");
  const alvo = await membroAtivo(db, membro.agenciaId, userId);
  await db.update(agenciaPecas).set({ responsavelId: alvo.id, updatedAt: new Date().toISOString() }).where(eq(agenciaPecas.id, peca.id));
  await evento(db, actor, peca, "TRANSFERIDA", `Transferida para ${alvo.nome}.`);
}

export const comentarioSchema = z.object({ texto: z.string().trim().min(1, "Escreva o comentário").max(4000), link: link.optional().or(z.literal("")), mencoes: z.array(z.string()).max(10).default([]) });

/** Comentário interno da equipe (o portal do cliente nunca mostra), com link e menção a pessoas da agência. */
export async function comentarPeca(db: Database, actor: Actor, pecaId: string, raw: z.input<typeof comentarioSchema>) {
  const { membro, peca } = await pecaVisivel(db, actor, pecaId);
  const d = comentarioSchema.parse(raw);
  const mencoes: string[] = [];
  for (const u of [...new Set(d.mencoes)]) mencoes.push((await membroAtivo(db, membro.agenciaId, u)).id);
  const u = await db.query.users.findFirst({ where: eq(users.id, actor.userId), columns: { name: true } });
  const id = newId("agcm");
  await db.insert(agenciaPecaComentarios).values({ id, pecaId: peca.id, agenciaId: peca.agenciaId, autorId: actor.userId, autorNome: u?.name ?? "Equipe", texto: d.texto, link: d.link || null, mencoes, interno: true });
  return { id };
}

export async function fichaDaPeca(db: Database, actor: Actor, pecaId: string) {
  const { membro, cliente, equipe, peca } = await pecaVisivel(db, actor, pecaId);
  const [eventos, comentarios, ciclo, resp] = await Promise.all([
    db.select().from(agenciaPecaEventos).where(eq(agenciaPecaEventos.pecaId, peca.id)).orderBy(desc(agenciaPecaEventos.createdAt)),
    db.select().from(agenciaPecaComentarios).where(eq(agenciaPecaComentarios.pecaId, peca.id)).orderBy(asc(agenciaPecaComentarios.createdAt)),
    db.query.agenciaCiclos.findFirst({ where: eq(agenciaCiclos.id, peca.cicloId) }),
    peca.responsavelId ? db.query.users.findFirst({ where: eq(users.id, peca.responsavelId), columns: { name: true } }) : null,
  ]);
  const proxima = proximaEtapa(peca.etapa, { tipo: peca.tipo, exigeAprovacao: cliente.exigeAprovacao });
  return {
    peca, cliente: { id: cliente.id, nome: cliente.nome, exigeAprovacao: cliente.exigeAprovacao }, mes: ciclo?.mes ?? null, responsavelNome: resp?.name ?? null,
    equipeCliente: equipe, eventos, comentarios,
    podeMexer: podeMexer(membro, peca), podeGerir: pode.gerirProducao(membro), proxima, requisito: requisitoParaAvancar(peca), podeAjuste: podePedirAjuste(peca.etapa),
  };
}

export type PecaNaLista = Peca & { clienteNome: string; responsavelNome: string | null; mes: string; atrasada: boolean; herdada: boolean };

/** Peças visíveis para a pessoa, do mês (e as herdadas de meses anteriores ainda não publicadas). */
export async function listarPecas(db: Database, actor: Actor, filtro: { mes?: string; clienteId?: string; responsavelId?: string; etapa?: PecaEtapa; somenteAtrasadas?: boolean } = {}, hoje = hojeEmSaoPaulo()): Promise<PecaNaLista[]> {
  const { membro } = await escopoDaAgencia(db, actor);
  const mes = filtro.mes ?? mesDe(hoje);
  const clientes = await db.select().from(agenciaClientes).where(eq(agenciaClientes.agenciaId, membro.agenciaId));
  const equipes = clientes.length ? await db.select().from(agenciaClienteEquipe).where(inArray(agenciaClienteEquipe.clienteId, clientes.map((c) => c.id))) : [];
  const visiveis = new Set(clientes.filter((c) => podeVerCliente(membro, c, equipes.filter((e) => e.clienteId === c.id).map((e) => e.userId))).map((c) => c.id));
  const rows = await db.select({ p: agenciaPecas, mes: agenciaCiclos.mes, resp: users.name }).from(agenciaPecas)
    .innerJoin(agenciaCiclos, eq(agenciaCiclos.id, agenciaPecas.cicloId)).leftJoin(users, eq(users.id, agenciaPecas.responsavelId))
    .where(and(eq(agenciaPecas.agenciaId, membro.agenciaId),
      or(eq(agenciaCiclos.mes, mes), and(lt(agenciaCiclos.mes, mes), ne(agenciaPecas.etapa, "PUBLICADO"), ne(agenciaPecas.etapa, "CONCLUIDO"))),
      filtro.clienteId ? eq(agenciaPecas.clienteId, filtro.clienteId) : undefined,
      filtro.responsavelId ? eq(agenciaPecas.responsavelId, filtro.responsavelId) : undefined,
      filtro.etapa ? eq(agenciaPecas.etapa, filtro.etapa) : undefined))
    .orderBy(asc(agenciaPecas.prazo), asc(agenciaPecas.createdAt));
  const nomes = new Map(clientes.map((c) => [c.id, c.nome]));
  return rows.filter((r) => visiveis.has(r.p.clienteId) || r.p.responsavelId === membro.userId)
    .map((r) => ({ ...r.p, clienteNome: nomes.get(r.p.clienteId) ?? "", responsavelNome: r.resp, mes: r.mes, atrasada: atrasada(r.p, hoje), herdada: r.mes < mes }))
    .filter((p) => !filtro.somenteAtrasadas || p.atrasada);
}

/** Minha fila: o que está comigo agora, atrasadas primeiro, depois por prazo e prioridade. */
export async function minhaFila(db: Database, actor: Actor, hoje = hojeEmSaoPaulo()) {
  const { membro } = await escopoDaAgencia(db, actor);
  const rows = await db.select({ p: agenciaPecas, mes: agenciaCiclos.mes, cliente: agenciaClientes.nome }).from(agenciaPecas)
    .innerJoin(agenciaCiclos, eq(agenciaCiclos.id, agenciaPecas.cicloId)).innerJoin(agenciaClientes, eq(agenciaClientes.id, agenciaPecas.clienteId))
    .where(and(eq(agenciaPecas.agenciaId, membro.agenciaId), eq(agenciaPecas.responsavelId, membro.userId), ne(agenciaPecas.etapa, "CONCLUIDO")));
  const peso = { URGENTE: 0, ALTA: 1, NORMAL: 2 } as const;
  return rows.map((r) => ({ ...r.p, mes: r.mes, clienteNome: r.cliente, atrasada: atrasada(r.p, hoje) }))
    .sort((a, b) => Number(b.atrasada) - Number(a.atrasada) || (a.prazo ?? "9999").localeCompare(b.prazo ?? "9999") || peso[a.prioridade] - peso[b.prioridade]);
}

export type ProducaoDoCliente = { clienteId: string; clienteNome: string; segmento: string | null; contagem: ContagemDoCiclo; temCiclo: boolean };

/** Produção do mês por cliente ativo visível (cartões do cockpit e cabeçalho da produção). Duas consultas, sem laço. */
export async function producaoDoMes(db: Database, actor: Actor, mes?: string, hoje = hojeEmSaoPaulo()): Promise<{ mes: string; clientes: ProducaoDoCliente[]; total: ContagemDoCiclo }> {
  const { membro } = await escopoDaAgencia(db, actor);
  const m = mes ?? mesDe(hoje);
  const clientes = await db.select().from(agenciaClientes).where(and(eq(agenciaClientes.agenciaId, membro.agenciaId), eq(agenciaClientes.situacao, "ATIVO"))).orderBy(asc(agenciaClientes.nome));
  const equipes = clientes.length ? await db.select().from(agenciaClienteEquipe).where(inArray(agenciaClienteEquipe.clienteId, clientes.map((c) => c.id))) : [];
  const visiveis = clientes.filter((c) => podeVerCliente(membro, c, equipes.filter((e) => e.clienteId === c.id).map((e) => e.userId)));
  const ids = visiveis.map((c) => c.id);
  const ciclos = ids.length ? await db.select().from(agenciaCiclos).where(and(inArray(agenciaCiclos.clienteId, ids), eq(agenciaCiclos.mes, m))) : [];
  const pecas = ids.length ? await db.select({ clienteId: agenciaPecas.clienteId, tipo: agenciaPecas.tipo, etapa: agenciaPecas.etapa, prazo: agenciaPecas.prazo, extra: agenciaPecas.extra, mes: agenciaCiclos.mes })
    .from(agenciaPecas).innerJoin(agenciaCiclos, eq(agenciaCiclos.id, agenciaPecas.cicloId))
    .where(and(inArray(agenciaPecas.clienteId, ids), or(eq(agenciaCiclos.mes, m), and(lt(agenciaCiclos.mes, m), ne(agenciaPecas.etapa, "PUBLICADO"), ne(agenciaPecas.etapa, "CONCLUIDO"))))) : [];
  const lista = visiveis.map((c) => {
    const ciclo = ciclos.find((x) => x.clienteId === c.id);
    const doMes = pecas.filter((p) => p.clienteId === c.id && p.mes === m);
    const herdadas = pecas.filter((p) => p.clienteId === c.id && p.mes < m);
    return { clienteId: c.id, clienteNome: c.nome, segmento: c.segmento, contagem: contagemDoCiclo(ciclo?.contratado ?? c.incluso, doMes, herdadas, hoje), temCiclo: !!ciclo };
  });
  const somaContratado = lista.reduce((acc, x) => {
    const c = ciclos.find((y) => y.clienteId === x.clienteId)?.contratado ?? visiveis.find((v) => v.id === x.clienteId)!.incluso;
    for (const k of ["videos", "fotos", "posts", "criativos"] as const) acc[k] = (acc[k] ?? 0) + (c[k] ?? 0);
    return acc;
  }, {} as AgenciaIncluso);
  return { mes: m, clientes: lista, total: contagemDoCiclo(somaContratado, pecas.filter((p) => p.mes === m), pecas.filter((p) => p.mes < m), hoje) };
}

/** Pessoas ativas da agência com a função (para transferir e mencionar). */
export async function pessoasDaAgencia(db: Database, actor: Actor) {
  const { membro } = await escopoDaAgencia(db, actor);
  return db.select({ id: users.id, nome: users.name, funcao: agenciaMembros.funcao }).from(agenciaMembros).innerJoin(users, eq(users.id, agenciaMembros.userId))
    .where(and(eq(agenciaMembros.agenciaId, membro.agenciaId), isNull(users.disabledAt))).orderBy(asc(users.name)) as Promise<{ id: string; nome: string; funcao: AgenciaFuncao }[]>;
}

export { ETAPA_ROTULO, TIPO_ROTULO, publicada };
export const ETAPAS_DO_QUADRO: PecaEtapa[] = [...PECA_ETAPAS];
