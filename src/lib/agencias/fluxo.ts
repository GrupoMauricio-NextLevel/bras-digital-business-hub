import type { AgenciaFuncao, AgenciaIncluso, PecaEtapa, PecaTipo } from "@/db/schema";
import { PECA_ETAPAS } from "@/db/schema";

/**
 * Fluxo de produção da agência (D314, Fase 1A). Regras puras e testadas: etapas, situações dentro de cada etapa, quem
 * recebe a etapa, a etapa seguinte (pulando o que não se aplica), prazos padrão e a contagem do ciclo do mês.
 */
export const ETAPA_ROTULO: Record<PecaEtapa, string> = {
  PLANEJAMENTO: "Planejamento", ROTEIRO: "Roteiro", CAPTACAO: "Captação", EDICAO: "Edição", REVISAO: "Revisão interna",
  APROVACAO: "Aprovação do cliente", AGENDAMENTO: "Social media", PUBLICADO: "Publicado", CONCLUIDO: "Métricas registradas",
};

/** Situações dentro de cada etapa; a primeira é a inicial. */
export const SITUACOES: Record<PecaEtapa, readonly (readonly [string, string])[]> = {
  PLANEJAMENTO: [["IDEIA", "Ideia"], ["PLANEJADA", "Planejada"]],
  ROTEIRO: [["NAO_INICIADO", "Não iniciado"], ["EM_DESENVOLVIMENTO", "Em desenvolvimento"], ["REVISAO", "Em revisão"], ["APROVADO", "Aprovado"]],
  CAPTACAO: [["AGUARDANDO", "Aguardando gravação"], ["AGENDADA", "Gravação agendada"], ["GRAVADA", "Gravada"]],
  EDICAO: [["AGUARDANDO", "Aguardando edição"], ["EDITANDO", "Editando"], ["AJUSTES", "Ajustes"]],
  REVISAO: [["EM_REVISAO", "Em revisão interna"]],
  APROVACAO: [["AGUARDANDO_CLIENTE", "Aguardando o cliente"]],
  AGENDAMENTO: [["A_PROGRAMAR", "Aguardando programação"], ["PROGRAMADO", "Programado"]],
  PUBLICADO: [["PUBLICADO", "Publicado"]],
  CONCLUIDO: [["METRICAS", "Métricas registradas"]],
};
export const situacaoInicial = (e: PecaEtapa) => SITUACOES[e][0]![0];
export const situacaoValida = (e: PecaEtapa, s: string) => SITUACOES[e].some(([v]) => v === s);
export const situacaoRotulo = (e: PecaEtapa, s: string) => SITUACOES[e].find(([v]) => v === s)?.[1] ?? s;

/** O que o cliente vê (status simplificados do briefing). Com a personalização (D340), o nome que a empresa escolheu. */
export function etapaParaCliente(e: PecaEtapa, nomes?: Partial<Record<PecaEtapa, string>>): string {
  if (nomes?.[e]) return nomes[e]!;
  if (e === "PLANEJAMENTO" || e === "ROTEIRO") return "Em planejamento";
  if (e === "CAPTACAO") return "Em produção";
  if (e === "EDICAO" || e === "REVISAO") return "Em edição";
  if (e === "APROVACAO") return "Aguardando aprovação";
  if (e === "AGENDAMENTO") return "Aprovado";
  return "Publicado";
}

/** Função que recebe cada etapa (a pessoa sai da equipe do cliente; sem ninguém da função, fica com o responsável do cliente). */
export const FUNCAO_DA_ETAPA: Record<PecaEtapa, AgenciaFuncao> = {
  PLANEJAMENTO: "ROTEIRO", ROTEIRO: "ROTEIRO", CAPTACAO: "GRAVACAO", EDICAO: "EDICAO", REVISAO: "GESTOR",
  APROVACAO: "ATENDIMENTO", AGENDAMENTO: "SOCIAL_MEDIA", PUBLICADO: "SOCIAL_MEDIA", CONCLUIDO: "SOCIAL_MEDIA",
};

/**
 * Peça sem gravação (arte, carrossel) pula a captação; cliente que não aprova pula a aprovação. Com a personalização
 * (D340): etapa desligada pela empresa é pulada e o tipo de entrega diz se pula a execução.
 */
export type ContextoEtapa = { tipo: PecaTipo; exigeAprovacao: boolean; ativas?: ReadonlySet<PecaEtapa>; pulaExecucao?: boolean };
export function etapaSeAplica(e: PecaEtapa, ctx: ContextoEtapa): boolean {
  if (ctx.ativas && !ctx.ativas.has(e)) return false;
  if (e === "CAPTACAO") return ctx.pulaExecucao !== undefined ? !ctx.pulaExecucao : ctx.tipo !== "ARTE" && ctx.tipo !== "CARROSSEL";
  if (e === "APROVACAO") return ctx.exigeAprovacao;
  return true;
}

/** A etapa seguinte (ou null, quando já está concluída). */
export function proximaEtapa(atual: PecaEtapa, ctx: ContextoEtapa): PecaEtapa | null {
  for (let i = PECA_ETAPAS.indexOf(atual) + 1; i < PECA_ETAPAS.length; i++) {
    const e = PECA_ETAPAS[i]!;
    if (etapaSeAplica(e, ctx)) return e;
  }
  return null;
}

/** Primeira etapa ligada (D340): onde nasce uma entrega nova. */
export const etapaInicial = (ativas?: ReadonlySet<PecaEtapa>): PecaEtapa => (ativas ? PECA_ETAPAS.find((x) => ativas.has(x)) : undefined) ?? "PLANEJAMENTO";

/** Ajuste pedido (na revisão interna ou pelo cliente) volta para a edição. */
export const podePedirAjuste = (e: PecaEtapa) => e === "REVISAO" || e === "APROVACAO";

export function escolherResponsavel(etapa: PecaEtapa, equipe: readonly { userId: string; funcao: AgenciaFuncao }[], responsavelCliente: string | null, funcaoDaEtapa: Partial<Record<PecaEtapa, AgenciaFuncao>> = {}): string | null {
  const f = funcaoDaEtapa[etapa] ?? FUNCAO_DA_ETAPA[etapa];
  return equipe.find((p) => p.funcao === f)?.userId ?? (f === "GESTOR" ? equipe.find((p) => p.funcao === "ADMIN")?.userId : undefined) ?? responsavelCliente;
}

/** Prazo padrão de cada etapa, em dias (a agência muda em Ajustes). */
export const PRAZOS_PADRAO: Record<PecaEtapa, number> = { PLANEJAMENTO: 5, ROTEIRO: 3, CAPTACAO: 7, EDICAO: 3, REVISAO: 1, APROVACAO: 3, AGENDAMENTO: 2, PUBLICADO: 7, CONCLUIDO: 0 };
export function prazoDaEtapa(e: PecaEtapa, hoje: string, prazos: Record<string, number> = {}): string | null {
  if (e === "CONCLUIDO") return null;
  const dias = Number.isFinite(prazos[e]) && prazos[e]! >= 0 ? prazos[e]! : PRAZOS_PADRAO[e];
  return new Date(Date.parse(`${hoje}T12:00:00Z`) + dias * 86_400_000).toISOString().slice(0, 10);
}

const FINAIS: readonly PecaEtapa[] = ["PUBLICADO", "CONCLUIDO"];
export const publicada = (e: PecaEtapa) => FINAIS.includes(e);
/** Produzida = edição concluída (da revisão interna em diante). Publicada é outra contagem: a mesma peça nunca conta duas vezes no mesmo número. */
export const produzida = (e: PecaEtapa) => PECA_ETAPAS.indexOf(e) >= PECA_ETAPAS.indexOf("REVISAO");
export const atrasada = (p: { etapa: PecaEtapa; prazo: string | null }, hoje: string) => !!p.prazo && p.prazo < hoje && !publicada(p.etapa);

/** Tipo de peça → item do contrato. */
export const TIPO_PARA_INCLUSO: Record<PecaTipo, keyof AgenciaIncluso> = { VIDEO: "videos", FOTO: "fotos", CARROSSEL: "posts", ARTE: "posts", STORIES: "posts", CRIATIVO: "criativos" };
export const TIPO_ROTULO: Record<PecaTipo, string> = { VIDEO: "Vídeo", FOTO: "Foto", CARROSSEL: "Carrossel", ARTE: "Arte", CRIATIVO: "Criativo de anúncio", STORIES: "Stories" };

export type PecaParaContar = { tipo: PecaTipo; etapa: PecaEtapa; prazo: string | null; extra: boolean };
export type ContagemDoCiclo = {
  contratado: number; contratadoVideos: number; planejadas: number; faltaPlanejar: number;
  porEtapa: Record<PecaEtapa, number>; emRoteiro: number; emCaptacao: number; emEdicao: number; aguardandoAprovacao: number;
  produzidas: number; publicadas: number; publicadasVideos: number; atrasadas: number; extras: number; herdadas: number; percentualPublicado: number;
};

/**
 * Contagem do ciclo do mês (testada). Contratado vem da cópia do contrato no ciclo; extras contam à parte e não enchem o
 * pacote; herdadas são peças de meses anteriores ainda não publicadas (o histórico do mês antigo fica como estava).
 */
export function contagemDoCiclo(contratado: AgenciaIncluso, pecas: readonly PecaParaContar[], herdadas: readonly PecaParaContar[], hoje: string): ContagemDoCiclo {
  const total = (contratado.videos ?? 0) + (contratado.fotos ?? 0) + (contratado.posts ?? 0) + (contratado.criativos ?? 0);
  const doPacote = pecas.filter((p) => !p.extra);
  const porEtapa = Object.fromEntries(PECA_ETAPAS.map((e) => [e, pecas.filter((p) => p.etapa === e).length])) as Record<PecaEtapa, number>;
  const publicadasPacote = doPacote.filter((p) => publicada(p.etapa)).length;
  return {
    contratado: total, contratadoVideos: contratado.videos ?? 0,
    planejadas: doPacote.length, faltaPlanejar: Math.max(0, total - doPacote.length),
    porEtapa, emRoteiro: porEtapa.PLANEJAMENTO + porEtapa.ROTEIRO, emCaptacao: porEtapa.CAPTACAO, emEdicao: porEtapa.EDICAO + porEtapa.REVISAO,
    aguardandoAprovacao: porEtapa.APROVACAO,
    produzidas: pecas.filter((p) => produzida(p.etapa)).length,
    publicadas: pecas.filter((p) => publicada(p.etapa)).length,
    publicadasVideos: doPacote.filter((p) => p.tipo === "VIDEO" && publicada(p.etapa)).length,
    atrasadas: [...pecas, ...herdadas].filter((p) => atrasada(p, hoje)).length,
    extras: pecas.filter((p) => p.extra).length,
    herdadas: herdadas.filter((p) => !publicada(p.etapa)).length,
    percentualPublicado: total ? Math.min(100, Math.round((publicadasPacote / total) * 100)) : 0,
  };
}

export const mesDe = (hoje: string) => hoje.slice(0, 7);
export const mesValido = (m: string) => /^\d{4}-(0[1-9]|1[0-2])$/.test(m);
export function mesAnterior(m: string) { const [a, mm] = m.split("-").map(Number) as [number, number]; return mm === 1 ? `${a - 1}-12` : `${a}-${String(mm - 1).padStart(2, "0")}`; }
export function mesSeguinte(m: string) { const [a, mm] = m.split("-").map(Number) as [number, number]; return mm === 12 ? `${a + 1}-01` : `${a}-${String(mm + 1).padStart(2, "0")}`; }
const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
export const mesRotulo = (m: string) => `${MESES[Number(m.slice(5, 7)) - 1]} de ${m.slice(0, 4)}`;
