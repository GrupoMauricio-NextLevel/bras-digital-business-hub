import { z } from "zod";
import { AGENCIA_FUNCOES, PECA_ETAPAS, PECA_TIPOS, type AgenciaFuncao, type PecaEtapa, type PecaTipo } from "@/db/schema";

/**
 * Personalização do painel (D340): o Painel da Agência (feito com a UP, D313 a D327) serve agências e qualquer empresa de
 * serviços. Foco do dono: 50% agências, 50% outros segmentos, com **alto nível de edição**.
 *
 * Como funciona:
 * - As chaves internas (etapas, departamentos, tipos de entrega) não mudam: são "vagas" com regras (quem aprova, quem vê
 *   valores, quem distribui). O que muda é o **nome**, se a vaga está **ligada** e, nas etapas, o prazo, o departamento
 *   que recebe e o que o cliente vê no portal.
 * - A empresa escolhe um **modelo de segmento** como ponto de partida e edita o que quiser por cima. Trocar de modelo
 *   não apaga nada: só muda o ponto de partida dos campos que a empresa não editou.
 * - Vazio = agência, exatamente como sempre foi (a UP não percebe mudança).
 * Regras puras e testadas. Administrador e Gestor nunca se desligam (as permissões dependem deles).
 */
export const SEGMENTOS = ["AGENCIA", "SERVICOS", "CONSULTORIA", "CONTABILIDADE", "JURIDICO", "ARQUITETURA", "TECNOLOGIA", "EVENTOS"] as const;
export type Segmento = (typeof SEGMENTOS)[number];

export const NOMES_CHAVES = ["painel", "cliente", "clientes", "entrega", "entregas", "producao"] as const;
export type NomeChave = (typeof NOMES_CHAVES)[number];
/** Gavetas que dá para esconder do menu de todos (o resto é a base do painel). */
export const MODULOS_OPCIONAIS = ["trafego", "comercial", "placar", "solucoes"] as const;
export type ModuloOpcional = (typeof MODULOS_OPCIONAIS)[number];
export const MODULO_HREF: Record<ModuloOpcional, string> = { trafego: "/agencia/trafego", comercial: "/agencia/comercial", placar: "/agencia/placar", solucoes: "/agencia/solucoes" };
export const MODULO_ROTULO: Record<ModuloOpcional, string> = { trafego: "Tráfego e anúncios", comercial: "Comercial (funil de vendas)", placar: "Placar e metas", solucoes: "Soluções NextLevel" };

type Etapa = { nome: string; ativa: boolean; cliente: string; funcao: AgenciaFuncao };
type Modelo = {
  rotulo: string; descricao: string;
  nomes: Record<NomeChave, string>;
  etapas: Record<PecaEtapa, Etapa>;
  funcoes: Record<AgenciaFuncao, { nome: string; ativa: boolean }>;
  tipos: Record<PecaTipo, { nome: string; ativo: boolean; pulaExecucao: boolean }>;
  modulos: Record<ModuloOpcional, boolean>;
  /** Exigir os links (brutos, versão, publicação) para avançar as etapas de execução, acabamento e entrega. */
  exigirLinks: boolean;
};

const e = (nome: string, cliente: string, funcao: AgenciaFuncao, ativa = true): Etapa => ({ nome, ativa, cliente, funcao });
const f = (nome: string, ativa = true) => ({ nome, ativa });
const t = (nome: string, ativo = true, pulaExecucao = false) => ({ nome, ativo, pulaExecucao });

/** Agência: os nomes de sempre (D314). */
const AGENCIA: Modelo = {
  rotulo: "Agência de marketing", descricao: "Conteúdo, vídeos, artes e tráfego pago para clientes com plano mensal.",
  nomes: { painel: "Painel da Agência", cliente: "Cliente", clientes: "Clientes", entrega: "Peça", entregas: "Peças", producao: "Produção" },
  etapas: {
    PLANEJAMENTO: e("Planejamento", "Em planejamento", "ROTEIRO"), ROTEIRO: e("Roteiro", "Em planejamento", "ROTEIRO"), CAPTACAO: e("Captação", "Em produção", "GRAVACAO"),
    EDICAO: e("Edição", "Em edição", "EDICAO"), REVISAO: e("Revisão interna", "Em edição", "GESTOR"), APROVACAO: e("Aprovação do cliente", "Aguardando aprovação", "ATENDIMENTO"),
    AGENDAMENTO: e("Social media", "Aprovado", "SOCIAL_MEDIA"), PUBLICADO: e("Publicado", "Publicado", "SOCIAL_MEDIA"), CONCLUIDO: e("Métricas registradas", "Publicado", "SOCIAL_MEDIA"),
  },
  funcoes: { ADMIN: f("Administrador"), GESTOR: f("Gestor"), ATENDIMENTO: f("Atendimento"), ROTEIRO: f("Roteiro"), GRAVACAO: f("Gravação"), EDICAO: f("Edição"), SOCIAL_MEDIA: f("Social media"), TRAFEGO: f("Tráfego pago"), FINANCEIRO: f("Financeiro") },
  tipos: { VIDEO: t("Vídeo"), FOTO: t("Foto"), CARROSSEL: t("Carrossel", true, true), ARTE: t("Arte", true, true), CRIATIVO: t("Criativo de anúncio"), STORIES: t("Stories") },
  modulos: { trafego: true, comercial: true, placar: true, solucoes: true },
  exigirLinks: true,
};

/** Base genérica de serviços: as outras partem dela e mudam o que for do segmento. */
function servicos(over: Partial<Pick<Modelo, "rotulo" | "descricao">> & { nomes?: Partial<Modelo["nomes"]>; etapas?: Partial<Record<PecaEtapa, Partial<Etapa>>>; funcoes?: Partial<Record<AgenciaFuncao, { nome?: string; ativa?: boolean }>>; tipos?: Partial<Record<PecaTipo, { nome?: string; ativo?: boolean; pulaExecucao?: boolean }>>; modulos?: Partial<Modelo["modulos"]> } = {}): Modelo {
  const base: Modelo = {
    rotulo: "Empresa de serviços", descricao: "Qualquer empresa que atende clientes com projetos, serviços ou entregas recorrentes.",
    nomes: { painel: "Painel da empresa", cliente: "Cliente", clientes: "Clientes", entrega: "Entrega", entregas: "Entregas", producao: "Projetos e tarefas" },
    etapas: {
      PLANEJAMENTO: e("Entrada", "Recebido", "ATENDIMENTO"), ROTEIRO: e("Planejamento", "Em planejamento", "ROTEIRO"), CAPTACAO: e("Execução", "Em andamento", "GRAVACAO"),
      EDICAO: e("Acabamento", "Em andamento", "EDICAO"), REVISAO: e("Revisão interna", "Em revisão", "GESTOR"), APROVACAO: e("Aprovação do cliente", "Aguardando sua aprovação", "ATENDIMENTO"),
      AGENDAMENTO: e("Entrega agendada", "Aprovado", "SOCIAL_MEDIA"), PUBLICADO: e("Entregue", "Entregue", "SOCIAL_MEDIA"), CONCLUIDO: e("Encerrado", "Entregue", "SOCIAL_MEDIA", false),
    },
    funcoes: { ADMIN: f("Administrador"), GESTOR: f("Gestor"), ATENDIMENTO: f("Atendimento"), ROTEIRO: f("Planejamento"), GRAVACAO: f("Execução"), EDICAO: f("Produção"), SOCIAL_MEDIA: f("Entrega"), TRAFEGO: f("Marketing", false), FINANCEIRO: f("Financeiro") },
    tipos: { VIDEO: t("Serviço"), FOTO: t("Projeto"), CARROSSEL: t("Visita"), ARTE: t("Documento"), CRIATIVO: t("Relatório"), STORIES: t("Outro") },
    modulos: { trafego: false, comercial: true, placar: true, solucoes: true },
    exigirLinks: false,
  };
  return {
    rotulo: over.rotulo ?? base.rotulo, descricao: over.descricao ?? base.descricao,
    nomes: { ...base.nomes, ...over.nomes },
    etapas: Object.fromEntries(PECA_ETAPAS.map((k) => [k, { ...base.etapas[k], ...over.etapas?.[k] }])) as Modelo["etapas"],
    funcoes: Object.fromEntries(AGENCIA_FUNCOES.map((k) => [k, { ...base.funcoes[k], ...over.funcoes?.[k] }])) as Modelo["funcoes"],
    tipos: Object.fromEntries(PECA_TIPOS.map((k) => [k, { ...base.tipos[k], ...over.tipos?.[k] }])) as Modelo["tipos"],
    modulos: { ...base.modulos, ...over.modulos },
    exigirLinks: base.exigirLinks,
  };
}

export const MODELOS: Record<Segmento, Modelo> = {
  AGENCIA,
  SERVICOS: servicos(),
  CONSULTORIA: servicos({
    rotulo: "Consultoria", descricao: "Diagnóstico, plano de ação e acompanhamento do cliente.",
    nomes: { entrega: "Atividade", entregas: "Atividades", producao: "Projetos" },
    etapas: { PLANEJAMENTO: { nome: "Diagnóstico" }, ROTEIRO: { nome: "Plano de ação" }, CAPTACAO: { nome: "Implantação" }, EDICAO: { nome: "Relatório", cliente: "Preparando o relatório" }, PUBLICADO: { nome: "Concluído", cliente: "Concluído" } },
    funcoes: { ROTEIRO: { nome: "Consultor" }, GRAVACAO: { nome: "Implantação" }, EDICAO: { nome: "Analista" }, SOCIAL_MEDIA: { nome: "Sucesso do cliente" } },
    tipos: { VIDEO: { nome: "Reunião" }, FOTO: { nome: "Diagnóstico" }, CARROSSEL: { nome: "Treinamento" }, ARTE: { nome: "Relatório" }, CRIATIVO: { nome: "Plano de ação" }, STORIES: { nome: "Outro" } },
  }),
  CONTABILIDADE: servicos({
    rotulo: "Contabilidade", descricao: "Rotinas do mês, obrigações, folha e atendimento das empresas clientes.",
    nomes: { cliente: "Empresa cliente", clientes: "Empresas clientes", entrega: "Obrigação", entregas: "Obrigações", producao: "Rotinas do mês" },
    etapas: { PLANEJAMENTO: { nome: "Documentos recebidos", cliente: "Documentos recebidos" }, ROTEIRO: { nome: "Conferência" }, CAPTACAO: { nome: "Apuração", cliente: "Em apuração" }, EDICAO: { nome: "Lançamentos" }, APROVACAO: { nome: "Conferência do cliente" }, AGENDAMENTO: { nome: "Guia enviada", cliente: "Guia enviada" }, PUBLICADO: { nome: "Entregue ao fisco", cliente: "Entregue" } },
    funcoes: { ROTEIRO: { nome: "Fiscal" }, GRAVACAO: { nome: "Contábil" }, EDICAO: { nome: "Departamento pessoal" }, SOCIAL_MEDIA: { nome: "Societário" } },
    tipos: { VIDEO: { nome: "Imposto" }, FOTO: { nome: "Folha de pagamento" }, CARROSSEL: { nome: "Declaração" }, ARTE: { nome: "Balanço" }, CRIATIVO: { nome: "Abertura ou alteração" }, STORIES: { nome: "Outro" } },
  }),
  JURIDICO: servicos({
    rotulo: "Escritório de advocacia", descricao: "Casos, prazos, peças e atendimento dos clientes do escritório.",
    nomes: { entrega: "Demanda", entregas: "Demandas", producao: "Casos e prazos" },
    etapas: { PLANEJAMENTO: { nome: "Triagem", cliente: "Em análise" }, ROTEIRO: { nome: "Estudo do caso" }, CAPTACAO: { nome: "Redação", cliente: "Em andamento" }, EDICAO: { nome: "Revisão do texto" }, AGENDAMENTO: { nome: "Protocolo agendado" }, PUBLICADO: { nome: "Protocolado", cliente: "Protocolado" } },
    funcoes: { ROTEIRO: { nome: "Advogado" }, GRAVACAO: { nome: "Estagiário" }, EDICAO: { nome: "Paralegal" }, SOCIAL_MEDIA: { nome: "Controladoria" } },
    tipos: { VIDEO: { nome: "Petição" }, FOTO: { nome: "Contrato" }, CARROSSEL: { nome: "Audiência" }, ARTE: { nome: "Parecer" }, CRIATIVO: { nome: "Notificação" }, STORIES: { nome: "Outro" } },
  }),
  ARQUITETURA: servicos({
    rotulo: "Arquitetura, engenharia e obras", descricao: "Projetos, visitas técnicas, aprovações e acompanhamento de obra.",
    nomes: { entrega: "Etapa do projeto", entregas: "Etapas do projeto", producao: "Projetos e obras" },
    etapas: { PLANEJAMENTO: { nome: "Briefing" }, ROTEIRO: { nome: "Estudo preliminar" }, CAPTACAO: { nome: "Visita técnica", cliente: "Visita marcada" }, EDICAO: { nome: "Desenho e detalhamento", cliente: "Em desenvolvimento" }, PUBLICADO: { nome: "Entregue", cliente: "Entregue" } },
    funcoes: { ROTEIRO: { nome: "Projetista" }, GRAVACAO: { nome: "Obra e campo" }, EDICAO: { nome: "Desenho" }, SOCIAL_MEDIA: { nome: "Compras e fornecedores" } },
    tipos: { VIDEO: { nome: "Projeto" }, FOTO: { nome: "Visita técnica" }, CARROSSEL: { nome: "Orçamento de obra" }, ARTE: { nome: "Prancha e desenho" }, CRIATIVO: { nome: "Aprovação na prefeitura" }, STORIES: { nome: "Outro" } },
  }),
  TECNOLOGIA: servicos({
    rotulo: "Tecnologia e software", descricao: "Sites, sistemas, suporte e melhorias para os clientes.",
    nomes: { entrega: "Tarefa", entregas: "Tarefas", producao: "Projetos e suporte" },
    etapas: { PLANEJAMENTO: { nome: "Pedido", cliente: "Recebido" }, ROTEIRO: { nome: "Especificação" }, CAPTACAO: { nome: "Desenvolvimento", cliente: "Em desenvolvimento" }, EDICAO: { nome: "Testes" }, AGENDAMENTO: { nome: "Publicação agendada" }, PUBLICADO: { nome: "No ar", cliente: "No ar" } },
    funcoes: { ROTEIRO: { nome: "Produto" }, GRAVACAO: { nome: "Desenvolvimento" }, EDICAO: { nome: "Qualidade e testes" }, SOCIAL_MEDIA: { nome: "Suporte" }, TRAFEGO: { nome: "Marketing", ativa: false } },
    tipos: { VIDEO: { nome: "Melhoria" }, FOTO: { nome: "Correção" }, CARROSSEL: { nome: "Suporte" }, ARTE: { nome: "Design" }, CRIATIVO: { nome: "Projeto novo" }, STORIES: { nome: "Outro" } },
  }),
  EVENTOS: servicos({
    rotulo: "Eventos e produção", descricao: "Eventos, fornecedores, montagem e o dia do evento.",
    nomes: { entrega: "Item do evento", entregas: "Itens do evento", producao: "Eventos" },
    etapas: { PLANEJAMENTO: { nome: "Briefing" }, ROTEIRO: { nome: "Orçamento e fornecedores" }, CAPTACAO: { nome: "Contratação" }, EDICAO: { nome: "Montagem", cliente: "Em montagem" }, AGENDAMENTO: { nome: "Dia do evento", cliente: "Tudo pronto" }, PUBLICADO: { nome: "Realizado", cliente: "Realizado" } },
    funcoes: { ROTEIRO: { nome: "Produção" }, GRAVACAO: { nome: "Fornecedores" }, EDICAO: { nome: "Montagem" }, SOCIAL_MEDIA: { nome: "Equipe do dia" } },
    tipos: { VIDEO: { nome: "Local" }, FOTO: { nome: "Buffet" }, CARROSSEL: { nome: "Decoração" }, ARTE: { nome: "Convite e identidade" }, CRIATIVO: { nome: "Som e luz" }, STORIES: { nome: "Outro" } },
  }),
};

// ---------------------------------------------------------------------------
// O que a empresa grava (só o que mudou em relação ao modelo)
// ---------------------------------------------------------------------------
const nome = z.string().trim().min(2, "Nome curto demais.").max(40, "Nome longo demais (até 40 letras).");
export const personalizacaoSchema = z.object({
  segmento: z.enum(SEGMENTOS).default("AGENCIA"),
  nomes: z.partialRecord(z.enum(NOMES_CHAVES), nome).default({}),
  etapas: z.partialRecord(z.enum(PECA_ETAPAS), z.object({ nome: nome.optional(), ativa: z.boolean().optional(), cliente: nome.optional(), funcao: z.enum(AGENCIA_FUNCOES).optional() })).default({}),
  funcoes: z.partialRecord(z.enum(AGENCIA_FUNCOES), z.object({ nome: nome.optional(), ativa: z.boolean().optional() })).default({}),
  tipos: z.partialRecord(z.enum(PECA_TIPOS), z.object({ nome: nome.optional(), ativo: z.boolean().optional(), pulaExecucao: z.boolean().optional() })).default({}),
  modulos: z.partialRecord(z.enum(MODULOS_OPCIONAIS), z.boolean()).default({}),
  exigirLinks: z.boolean().optional(),
});
export type Personalizacao = z.output<typeof personalizacaoSchema>;

/** Lê o que está gravado; qualquer coisa estragada vira "sem personalização" (nunca derruba o painel). */
export function lerPersonalizacao(raw: unknown): Personalizacao {
  const r = personalizacaoSchema.safeParse(raw ?? {});
  return r.success ? r.data : personalizacaoSchema.parse({});
}

/** O painel como a empresa vê: modelo do segmento + o que ela editou. */
export function vocabulario(raw: unknown) {
  const p = lerPersonalizacao(raw);
  const m = MODELOS[p.segmento];
  const etapas = Object.fromEntries(PECA_ETAPAS.map((k) => [k, { ...m.etapas[k], ...p.etapas[k] }])) as Record<PecaEtapa, Etapa>;
  // Publicado é a etapa final da contagem: não desliga.
  etapas.PUBLICADO.ativa = true;
  const funcoes = Object.fromEntries(AGENCIA_FUNCOES.map((k) => [k, { ...m.funcoes[k], ...p.funcoes[k] }])) as Modelo["funcoes"];
  // Administrador e Gestor sustentam as permissões: sempre ligados.
  funcoes.ADMIN.ativa = true; funcoes.GESTOR.ativa = true;
  const tipos = Object.fromEntries(PECA_TIPOS.map((k) => [k, { ...m.tipos[k], ...p.tipos[k] }])) as Modelo["tipos"];
  if (!PECA_TIPOS.some((k) => tipos[k].ativo)) tipos[PECA_TIPOS[0]].ativo = true;
  // Departamento desligado não recebe etapa: a etapa vai para o Gestor.
  for (const k of PECA_ETAPAS) if (!funcoes[etapas[k].funcao].ativa) etapas[k].funcao = "GESTOR";
  const modulos = { ...m.modulos, ...p.modulos };
  const ativas = new Set(PECA_ETAPAS.filter((k) => etapas[k].ativa));
  return {
    segmento: p.segmento, modeloRotulo: m.rotulo, personalizado: p,
    nomes: { ...m.nomes, ...p.nomes } as Record<NomeChave, string>,
    etapas, funcoes, tipos, modulos,
    etapa: Object.fromEntries(PECA_ETAPAS.map((k) => [k, etapas[k].nome])) as Record<PecaEtapa, string>,
    funcao: Object.fromEntries(AGENCIA_FUNCOES.map((k) => [k, funcoes[k].nome])) as Record<AgenciaFuncao, string>,
    tipo: Object.fromEntries(PECA_TIPOS.map((k) => [k, tipos[k].nome])) as Record<PecaTipo, string>,
    etapasAtivas: ativas,
    exigirLinks: p.exigirLinks ?? m.exigirLinks,
    /** Para onde volta um ajuste pedido: a Edição (acabamento) ou, se desligada, a última etapa ligada antes da revisão. */
    etapaDeAjuste: (ativas.has("EDICAO") ? "EDICAO" : [...PECA_ETAPAS.slice(0, PECA_ETAPAS.indexOf("REVISAO"))].reverse().find((k) => ativas.has(k)) ?? "PLANEJAMENTO") as PecaEtapa,
    tiposAtivos: PECA_TIPOS.filter((k) => tipos[k].ativo),
    funcoesAtivas: AGENCIA_FUNCOES.filter((k) => funcoes[k].ativa),
    /** Itens do menu escondidos para todos (gavetas desligadas). */
    ocultos: MODULOS_OPCIONAIS.filter((k) => !modulos[k]).map((k) => MODULO_HREF[k]),
    /** Novos nomes de itens do menu (Produção, Clientes). */
    renomear: { "/agencia/producao": { ...m.nomes, ...p.nomes }.producao, "/agencia/clientes": { ...m.nomes, ...p.nomes }.clientes } as Record<string, string>,
  };
}
export type Vocabulario = ReturnType<typeof vocabulario>;

/**
 * Grava só o que difere do modelo (trocar de modelo depois continua funcionando para o que não foi editado). Campos iguais
 * ao modelo somem; nome vazio volta ao do modelo.
 */
export function compactar(raw: z.input<typeof personalizacaoSchema>): Personalizacao {
  const p = personalizacaoSchema.parse(raw);
  const m = MODELOS[p.segmento];
  const limpa = <T extends Record<string, unknown>>(over: T | undefined, base: Record<string, unknown>) => {
    const r = Object.fromEntries(Object.entries(over ?? {}).filter(([k, v]) => v !== undefined && v !== base[k]));
    return Object.keys(r).length ? (r as T) : undefined;
  };
  const porChave = <K extends string, V extends Record<string, unknown>>(rec: Partial<Record<K, V>>, base: Record<K, Record<string, unknown>>) =>
    Object.fromEntries(Object.entries(rec).map(([k, v]) => [k, limpa(v as V, base[k as K])]).filter(([, v]) => v)) as Partial<Record<K, V>>;
  return {
    segmento: p.segmento,
    nomes: Object.fromEntries(Object.entries(p.nomes).filter(([k, v]) => v !== m.nomes[k as NomeChave])) as Personalizacao["nomes"],
    etapas: porChave(p.etapas, m.etapas), funcoes: porChave(p.funcoes, m.funcoes), tipos: porChave(p.tipos, m.tipos),
    modulos: Object.fromEntries(Object.entries(p.modulos).filter(([k, v]) => v !== m.modulos[k as ModuloOpcional])) as Personalizacao["modulos"],
    ...(p.exigirLinks !== undefined && p.exigirLinks !== m.exigirLinks ? { exigirLinks: p.exigirLinks } : {}),
  };
}

/**
 * Situação dentro da etapa (D340): na agência, as de sempre ("Aguardando gravação", "Editando"); nos outros segmentos,
 * palavras neutras que servem para qualquer serviço.
 */
const SITUACAO_NEUTRA: Record<string, string> = {
  IDEIA: "Nova", PLANEJADA: "Planejada", NAO_INICIADO: "Não iniciada", EM_DESENVOLVIMENTO: "Em andamento", REVISAO: "Em revisão", APROVADO: "Aprovada",
  AGUARDANDO: "Aguardando", AGENDADA: "Agendada", GRAVADA: "Feita", EDITANDO: "Em andamento", AJUSTES: "Ajustes", EM_REVISAO: "Em revisão",
  AGUARDANDO_CLIENTE: "Aguardando o cliente", A_PROGRAMAR: "A programar", PROGRAMADO: "Programado", METRICAS: "Encerrado",
};
export function rotuloSituacao(v: Pick<Vocabulario, "segmento" | "etapa">, etapa: PecaEtapa, situacao: string, rotuloAgencia: (e: PecaEtapa, s: string) => string): string {
  if (v.segmento === "AGENCIA") return rotuloAgencia(etapa, situacao);
  if (situacao === "PUBLICADO") return v.etapa.PUBLICADO;
  return SITUACAO_NEUTRA[situacao] ?? rotuloAgencia(etapa, situacao);
}
