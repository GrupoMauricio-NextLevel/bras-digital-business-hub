import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { agenciaMembros, aprenderProgresso, users, type AgenciaFuncao } from "@/db/schema";
import type { Actor } from "@/lib/domain/access";
import { NotFoundError } from "@/lib/domain/errors";
import { newId } from "@/lib/ids";
import { corrigir, type Pergunta } from "@/lib/conhecimento/perguntas";
import type { Aula } from "@/lib/conhecimento/aulas";
import { escopoDaAgencia, pode } from "./acesso";

/**
 * Aprender da agência (D317): o mesmo Aprender do Master (aula, perguntas corrigidas no servidor, progresso por pessoa
 * na mesma tabela), com trilhas sobre o Painel da Agência, por função. Aulas com id "ag-" (não colidem com as do Master).
 */
export type TrilhaAgencia = "ag-base" | "ag-producao" | "ag-gestao";
export const TRILHAS_AGENCIA: { id: TrilhaAgencia; numero: number; titulo: string; resumo: string }[] = [
  { id: "ag-base", numero: 1, titulo: "Base (todos)", resumo: "O painel, o caminho de uma peça, a Minha fila e o sino." },
  { id: "ag-producao", numero: 2, titulo: "Produção", resumo: "Roteiro, gravação, edição e social media no sistema." },
  { id: "ag-gestao", numero: 3, titulo: "Gestão", resumo: "Carteira, contratos, distribuição, prazos e novos clientes." },
];
const POR_FUNCAO: Record<AgenciaFuncao, TrilhaAgencia[]> = {
  ADMIN: ["ag-base", "ag-producao", "ag-gestao"], GESTOR: ["ag-base", "ag-producao", "ag-gestao"],
  ATENDIMENTO: ["ag-base", "ag-gestao"], FINANCEIRO: ["ag-base", "ag-gestao"],
  ROTEIRO: ["ag-base", "ag-producao"], GRAVACAO: ["ag-base", "ag-producao"], EDICAO: ["ag-base", "ag-producao"], SOCIAL_MEDIA: ["ag-base", "ag-producao"], TRAFEGO: ["ag-base", "ag-producao"],
};
export const trilhasDaFuncao = (f: AgenciaFuncao) => POR_FUNCAO[f];

export type AulaAgencia = Omit<Aula, "trilha"> & { trilha: TrilhaAgencia };
const A = (a: Omit<AulaAgencia, "estado" | "decisoes"> & { decisoes?: string[] }): AulaAgencia => ({ estado: "no-ar", decisoes: a.decisoes ?? ["D313", "D314"], ...a });

export const AULAS_AGENCIA: AulaAgencia[] = [
  A({ id: "ag-painel", trilha: "ag-base", titulo: "O Painel da Agência",
    oQue: "O lugar onde a agência inteira trabalha: clientes, produção, equipe e o dia de cada pessoa.",
    regra: ["Hoje: a visão geral, a fila do dia e os números do mês.", "Minha fila: o que está com você agora, atrasadas primeiro.", "Produção: todas as peças do mês por etapa, em quadro ou lista.", "Resumo da semana: entregas, atrasos e o que vem nos próximos 7 dias.", "O sino avisa quando algo chega para você."],
    dizer: ["Está no sistema: abre a peça que você vê tudo.", "Minha parte está feita, concluí a etapa."], nunca: ["Combinar entrega só pelo WhatsApp, sem registrar na peça.", "Usar o login de outra pessoa."],
    link: { rotulo: "Abrir a Minha fila", href: "/agencia/fila" }, decisoes: ["D313", "D316"] }),
  A({ id: "ag-peca", trilha: "ag-base", titulo: "O caminho de uma peça",
    oQue: "Cada conteúdo é uma peça que passa por planejamento, roteiro, captação, edição, revisão interna, aprovação do cliente, social media, publicado e métricas.",
    regra: ["Quando você conclui a sua etapa, a peça vai sozinha para a próxima pessoa da equipe daquele cliente, com prazo.", "Para sair da captação precisa do link dos brutos; da edição, do link da versão; para publicar, do link da publicação.", "Arte e carrossel pulam a captação; cliente que não aprova pula a aprovação.", "Ajuste pedido volta a peça para a edição, com o motivo no histórico."],
    exemplo: "O roteiro fica pronto, a roteirista conclui: a peça aparece na fila do filmmaker do cliente, com o prazo da captação.",
    dizer: ["Concluí, já foi para a edição."], nunca: ["Concluir a etapa sem anexar o link pedido.", "Marcar como publicado sem o link da publicação."], decisoes: ["D314"] }),
  A({ id: "ag-fila", trilha: "ag-base", titulo: "Minha fila, comentários e o sino",
    oQue: "Como trabalhar sem precisar perguntar a ninguém o que fazer.",
    regra: ["Comece pelas atrasadas (em vermelho), depois pelo prazo mais próximo.", "Comentários na peça são internos: o cliente nunca vê.", "Para chamar alguém, marque a pessoa em \"Avisar pessoas\": ela recebe no sino.", "O sino mostra o que chegou para você, ajustes, transferências e quando citam você."],
    dizer: ["Deixei um comentário na peça e avisei você."], nunca: ["Escrever no comentário algo que não poderia ser mostrado ao cliente num print."], decisoes: ["D314", "D316"] }),
  A({ id: "ag-roteiro", trilha: "ag-producao", titulo: "Roteiro e planejamento do mês",
    oQue: "O planejamento nasce do pacote de cada cliente e o roteiro é escrito na própria peça.",
    regra: ["\"Planejar o mês\" cria as peças que faltam pelo pacote (vídeos, fotos, posts, criativos) e não duplica.", "Roteiro tem situações: não iniciado, em desenvolvimento, em revisão e aprovado.", "Escreva objetivo, roteiro e referências na peça: é o que o filmmaker e o editor vão ler.", "Peça fora do pacote entra marcada como extra e conta à parte."],
    dizer: ["O roteiro está aprovado e já foi para a captação."], nunca: ["Mandar roteiro só por mensagem, fora da peça."] }),
  A({ id: "ag-edicao", trilha: "ag-producao", titulo: "Gravação e edição",
    oQue: "Os arquivos ficam no Google Drive; no sistema vai o link.",
    regra: ["Filmmaker: depois de gravar, cole o link dos brutos e conclua a captação.", "Editor: cada versão nova é um link novo em \"Link da versão editada\"; o número da versão sobe sozinho.", "Ajuste pedido chega na sua fila com o motivo; faça e envie a nova versão.", "O gestor pode transferir a peça para outro editor; o histórico registra."],
    dizer: ["Brutos no Drive, link na peça."], nunca: ["Subir vídeo pesado em grupo de WhatsApp como entrega oficial."] }),
  A({ id: "ag-social", trilha: "ag-producao", titulo: "Social media e publicação",
    oQue: "A peça aprovada chega para o social media programar e publicar.",
    regra: ["Escreva a legenda e a data e hora de publicação na peça.", "Depois de publicar, cole o link da publicação e conclua: ela conta como publicada.", "Produzido e publicado são números diferentes: o pacote do cliente se cumpre com o publicado."],
    dizer: ["Publicado, link na peça."], nunca: ["Contar como entregue o que ainda não foi publicado."] }),
  A({ id: "ag-carteira", trilha: "ag-gestao", titulo: "Carteira, contratos e quem vê o quê",
    oQue: "Cada cliente tem o contrato do mês: valor, vencimento e o que entra.",
    regra: ["Valores e vencimentos só aparecem para administrador e financeiro.", "Atendimento cadastra e organiza a carteira, sem ver valores.", "Roteiro, gravação, edição, social media e tráfego veem só os clientes em que trabalham.", "Encerrar contrato pede o motivo; o histórico fica."],
    dizer: ["O valor fica com o financeiro."], nunca: ["Passar valor de contrato para quem não é do financeiro."] }),
  A({ id: "ag-distribuir", trilha: "ag-gestao", titulo: "Distribuir trabalho e cobrar prazos",
    oQue: "A equipe de cada cliente decide para quem cada etapa vai.",
    regra: ["Na ficha do cliente, marque a equipe: roteiro, gravação, edição, social media e gestor.", "Sem ninguém da função na equipe, a etapa vai para o responsável do cliente.", "Gestor e administrador transferem peças, mudam prazo e prioridade.", "Atrasos aparecem na fila do dia, na Produção (\"Só atrasadas\") e no Resumo da semana.", "Use a Carga da equipe para ver quem está com mais clientes."],
    dizer: ["Passei a peça para o outro editor, que está com menos fila."], nunca: ["Deixar cliente sem responsável."] }),
  A({ id: "ag-crm", trilha: "ag-gestao", titulo: "Novos clientes: o funil comercial",
    oQue: "Cada empresa em negociação é uma oportunidade, da prospecção ao contrato fechado.",
    regra: ["Etapas: prospecção, contato realizado, reunião agendada, proposta enviada, negociação, fechado (ou perdido, com motivo).", "Sempre deixe a próxima atividade com data: o comercial do dia mostra o que está para hoje e atrasado.", "Fechou: \"Virar cliente\" cria o cliente na carteira com os dados da negociação e a lista de onboarding."],
    dizer: ["Qual a próxima atividade com esse cliente?"], nunca: ["Deixar oportunidade parada sem próxima atividade."], decisoes: ["D317"] }),
];

/** Regra pura: monta as opções com a certa numa posição que varia pela pergunta (como no Aprender do Master). */
function q(pergunta: string, certa: string, erradas: string[]): Pergunta {
  const pos = [...pergunta].reduce((s, c) => s + c.charCodeAt(0), 0) % (erradas.length + 1);
  return { pergunta, opcoes: [...erradas.slice(0, pos), certa, ...erradas.slice(pos)], certa: pos };
}
const PERGUNTAS: Record<string, Pergunta[]> = {
  "ag-painel": [q("Onde você vê o que está com você agora?", "Minha fila", ["Na Equipe", "No Resumo da semana", "Só no WhatsApp"]), q("O que o sino mostra?", "O que chegou para você, ajustes, transferências e menções", ["Só mensagens do cliente", "Os valores dos contratos", "Nada; é decorativo"])],
  "ag-peca": [q("O que acontece quando você conclui a sua etapa?", "A peça vai sozinha para a próxima pessoa, com prazo", ["Você precisa avisar todo mundo", "A peça some", "O cliente recebe na hora"]), q("O que é preciso para sair da captação?", "O link dos brutos", ["A legenda", "O valor do contrato", "A aprovação do cliente"])],
  "ag-fila": [q("Quem vê os comentários da peça?", "Só a equipe; o cliente nunca vê", ["O cliente", "Todo mundo na internet", "Ninguém"]), q("Como chamar alguém numa peça?", "Marcar a pessoa em Avisar pessoas", ["Mandar e-mail fora do sistema", "Trocar o responsável sem avisar", "Esperar a pessoa abrir"])],
  "ag-roteiro": [q("O que \"Planejar o mês\" faz?", "Cria as peças que faltam pelo pacote, sem duplicar", ["Apaga o mês anterior", "Publica tudo", "Cobra o cliente"]), q("Uma peça fora do pacote é…", "Extra, contada à parte", ["Ignorada", "Cobrada sozinha", "Proibida"])],
  "ag-edicao": [q("Onde ficam os vídeos?", "No Google Drive; no sistema vai o link", ["Dentro do sistema", "No grupo de WhatsApp", "No e-mail"]), q("O ajuste pedido chega para quem?", "Para o editor, com o motivo", ["Para o cliente", "Para o financeiro", "Para ninguém"])],
  "ag-social": [q("Quando a peça conta como publicada?", "Quando o link da publicação é registrado e a etapa concluída", ["Quando a edição termina", "Quando o roteiro é aprovado", "No fim do mês"]), q("O pacote do cliente se cumpre com…", "O publicado", ["O produzido", "O planejado", "O gravado"])],
  "ag-carteira": [q("Quem vê os valores dos contratos?", "Administrador e financeiro", ["Toda a equipe", "Só o editor", "O cliente de outro"]), q("Encerrar um contrato pede…", "O motivo", ["Senha do cliente", "Nada", "Aprovação da NextLevel"])],
  "ag-distribuir": [q("O que decide para quem cada etapa vai?", "A equipe marcada na ficha do cliente", ["Sorteio", "Quem abrir primeiro", "O cliente"]), q("Quem pode transferir uma peça?", "Gestor e administrador", ["Qualquer pessoa", "O cliente", "Ninguém"])],
  "ag-crm": [q("O que fazer quando a negociação fecha?", "Virar cliente: entra na carteira com o onboarding", ["Apagar a oportunidade", "Cadastrar tudo de novo à mão", "Nada"]), q("Toda oportunidade precisa de…", "Próxima atividade com data", ["Valor fechado", "Foto", "Contrato assinado no primeiro contato"])],
};
export const perguntasDaAulaAgencia = (id: string) => PERGUNTAS[id] ?? [];

export const respostaAgenciaSchema = z.object({ aulaId: z.string().regex(/^ag-[a-z-]+$/), respostas: z.array(z.number().int().min(0).max(9)).max(10) });

/** Corrige no servidor e guarda o progresso (concluída uma vez, continua concluída), como no Aprender do Master. */
export async function responderAulaDaAgencia(db: Database, actor: Actor, raw: z.input<typeof respostaAgenciaSchema>) {
  const { membro } = await escopoDaAgencia(db, actor);
  const v = respostaAgenciaSchema.parse(raw);
  const aula = AULAS_AGENCIA.find((a) => a.id === v.aulaId && trilhasDaFuncao(membro.funcao).includes(a.trilha));
  if (!aula) throw new NotFoundError("Aula não encontrada.");
  const r = corrigir(perguntasDaAulaAgencia(aula.id), v.respostas);
  const agora = new Date().toISOString();
  await db.insert(aprenderProgresso).values({ id: newId("apr"), userId: actor.userId, aulaId: aula.id, trilha: aula.trilha, acertos: r.acertos, total: r.total, tentativas: 1, concluidaAt: r.concluida ? agora : null, updatedAt: agora })
    .onConflictDoUpdate({
      target: [aprenderProgresso.userId, aprenderProgresso.aulaId],
      set: { acertos: sql`greatest(${aprenderProgresso.acertos}, ${r.acertos})`, total: r.total, trilha: aula.trilha, tentativas: sql`${aprenderProgresso.tentativas} + 1`, concluidaAt: r.concluida ? sql`coalesce(${aprenderProgresso.concluidaAt}, ${agora})` : sql`${aprenderProgresso.concluidaAt}`, updatedAt: agora },
    });
  return r;
}

/** Progresso de cada pessoa da agência nas trilhas da função dela (o administrador vê "quem está pronto"). */
export async function progressoDaAgencia(db: Database, actor: Actor) {
  const { membro } = await escopoDaAgencia(db, actor);
  const equipe = await db.select({ id: users.id, nome: users.name, funcao: agenciaMembros.funcao }).from(agenciaMembros).innerJoin(users, eq(users.id, agenciaMembros.userId))
    .where(and(eq(agenciaMembros.agenciaId, membro.agenciaId), isNull(users.disabledAt)));
  const visiveis = pode.gerirEquipe(membro) ? equipe : equipe.filter((p) => p.id === actor.userId);
  const feitas = visiveis.length ? await db.select({ userId: aprenderProgresso.userId, aulaId: aprenderProgresso.aulaId }).from(aprenderProgresso)
    .where(and(inArray(aprenderProgresso.userId, visiveis.map((p) => p.id)), sql`${aprenderProgresso.concluidaAt} is not null`)) : [];
  return visiveis.map((p) => {
    const minhas = AULAS_AGENCIA.filter((a) => trilhasDaFuncao(p.funcao).includes(a.trilha));
    const ok = new Set(feitas.filter((f) => f.userId === p.id).map((f) => f.aulaId));
    return { ...p, feitas: minhas.filter((a) => ok.has(a.id)).length, total: minhas.length, concluidas: [...ok] };
  });
}
