import type { Database } from "@/db/client";
import type { Actor } from "@/lib/domain/access";
import { fonteDeIa, registrarUsoIa } from "@/lib/domain/ia-por-plano";
import { conversar } from "@/lib/ia/provedor";
import { ROTULO_CANAL, type Canal } from "@/lib/trafego/canal";
import { fichaDoContato, SITUACAO_ROTULO } from "./contatos";

/**
 * Maurício dentro do funil (ecossistema, Etapa 2, D337): resumo do contato com a próxima ação e uma resposta sugerida
 * para copiar e colar. Nada é enviado sozinho. Com cota de IA do plano (ou chave da loja) a IA escreve; sem ela, as
 * regras abaixo escrevem (nunca quebra). Só lê o contato da própria loja (`fichaDoContato` confere o tenant).
 */
export type Ficha = Awaited<ReturnType<typeof fichaDoContato>>;
export type Sugestao = { resumo: string; proximaAcao: string; resposta: string; origem: "ia" | "regras" };

const horasDesde = (iso: string, agora: Date) => Math.max(0, Math.round((agora.getTime() - new Date(iso).getTime()) / 3_600_000));

/** Regra pura (testada): o que fazer agora com este contato. */
export function proximaAcaoPorRegras(c: Pick<Ficha, "situacao" | "createdAt" | "updatedAt" | "whatsapp" | "email" | "responsavelId" | "valorCents">, agora = new Date()): string {
  const canal = c.whatsapp ? "pelo WhatsApp" : c.email ? "por e-mail" : "pelo contato que ele deixou";
  switch (c.situacao) {
    case "NOVO": {
      const h = horasDesde(c.createdAt, agora);
      return `${c.responsavelId ? "" : "Assuma o contato e "}responda ${canal}${h >= 1 ? ` (chegou há ${h} h; quanto antes, maior a chance de fechar)` : " agora, enquanto o interesse está quente"}.`.replace(/^r/, "R");
    }
    case "EM_ATENDIMENTO": return `Mande o orçamento ${canal} e marque "Orçamento enviado".`;
    case "ORCAMENTO_ENVIADO": {
      const h = horasDesde(c.updatedAt, agora);
      return h >= 48 ? `O orçamento foi enviado há ${Math.round(h / 24)} dias: faça um retorno ${canal} perguntando se ficou alguma dúvida.` : `Aguarde a resposta e, se não vier em 2 dias, faça um retorno ${canal}.`;
    }
    case "GANHO": return c.valorCents ? "Fechado. Peça uma avaliação e ofereça o próximo serviço quando fizer sentido." : "Fechado. Registre o valor para os números do mês ficarem certos.";
    case "PERDIDO": return "Perdido. Registre o motivo; daqui a alguns meses vale um novo contato com uma condição diferente.";
    default: return `Responda ${canal}.`;
  }
}

/**
 * "O que fazer hoje" (D337): os contatos em aberto que pedem ação, do mais urgente ao menos, cada um com a próxima ação.
 * Sem tabela nova: as tarefas saem do próprio funil. Novo sem resposta vem primeiro (o mais antigo antes); depois
 * orçamento enviado há 2 dias ou mais sem retorno; depois em atendimento parado há 1 dia ou mais.
 */
export function tarefasDeHoje<T extends Pick<Ficha, "situacao" | "createdAt" | "updatedAt" | "whatsapp" | "email" | "responsavelId" | "valorCents">>(lista: T[], agora = new Date()) {
  const peso = (c: T): number | null => {
    if (c.situacao === "NOVO") return 3_000_000 + horasDesde(c.createdAt, agora);
    if (c.situacao === "ORCAMENTO_ENVIADO" && horasDesde(c.updatedAt, agora) >= 48) return 2_000_000 + horasDesde(c.updatedAt, agora);
    if (c.situacao === "EM_ATENDIMENTO" && horasDesde(c.updatedAt, agora) >= 24) return 1_000_000 + horasDesde(c.updatedAt, agora);
    return null;
  };
  return lista.map((c) => ({ c, p: peso(c) })).filter((x): x is { c: T; p: number } => x.p !== null).sort((a, b) => b.p - a.p)
    .map(({ c }) => ({ ...c, acao: proximaAcaoPorRegras(c, agora), urgente: c.situacao === "NOVO" }));
}

/** Regra pura (testada): resumo em uma frase e resposta pronta, sem IA. */
export function sugestaoPorRegras(c: Ficha, empresa: string, agora = new Date()): Sugestao {
  const primeiro = c.nome.split(" ")[0] ?? c.nome;
  const veio = ROTULO_CANAL[c.canal as Canal] ?? c.canal;
  const resumo = `${c.nome} pediu ${c.servicoNome ? `orçamento de ${c.servicoNome}` : "um orçamento"} (${veio}${c.utmCampaign ? `, campanha ${c.utmCampaign}` : ""}). Situação: ${SITUACAO_ROTULO[c.situacao].toLowerCase()}.${c.mensagem ? ` Mensagem: "${c.mensagem.slice(0, 160)}${c.mensagem.length > 160 ? "…" : ""}"` : ""}`;
  const resposta = c.situacao === "ORCAMENTO_ENVIADO"
    ? `Olá, ${primeiro}! Aqui é da ${empresa}. Passando para saber se ficou alguma dúvida sobre o orçamento${c.servicoNome ? ` de ${c.servicoNome}` : ""}. Posso ajudar em algo?`
    : `Olá, ${primeiro}! Aqui é da ${empresa}. Recebemos o seu pedido${c.servicoNome ? ` de ${c.servicoNome}` : ""} pelo site. Para eu preparar o orçamento, pode me contar um pouco mais do que você precisa e o melhor horário para conversarmos?`;
  return { resumo, proximaAcao: proximaAcaoPorRegras(c, agora), resposta, origem: "regras" };
}

/** Lê "RESUMO:", "PRÓXIMA AÇÃO:" e "RESPOSTA:" da resposta da IA; o que faltar vem das regras. */
export function lerRespostaDaIa(texto: string, base: Sugestao): Sugestao {
  const pega = (rotulo: RegExp) => texto.match(rotulo)?.[1]?.trim() || null;
  const resumo = pega(/RESUMO:\s*([\s\S]*?)(?:\n\s*PR[ÓO]XIMA A[ÇC][ÃA]O:|$)/i);
  const proximaAcao = pega(/PR[ÓO]XIMA A[ÇC][ÃA]O:\s*([\s\S]*?)(?:\n\s*RESPOSTA:|$)/i);
  const resposta = pega(/RESPOSTA:\s*([\s\S]*)$/i);
  if (!resumo && !resposta) return base;
  return { resumo: resumo ?? base.resumo, proximaAcao: proximaAcao ?? base.proximaAcao, resposta: resposta ?? base.resposta, origem: "ia" };
}

export async function sugestaoDoContato(db: Database, actor: Actor, storeId: string, id: string, empresa: string, agora = new Date(), conversa = conversar): Promise<Sugestao> {
  const c = await fichaDoContato(db, actor, storeId, id);
  const base = sugestaoPorRegras(c, empresa, agora);
  const fonte = await fonteDeIa(db, storeId, "painel", agora).catch(() => null);
  if (!fonte) return base;
  const dados = [
    `Empresa: ${empresa}`, `Contato: ${c.nome}`, `Serviço: ${c.servicoNome ?? "não informado"}`, `Mensagem: ${c.mensagem ?? "(sem mensagem)"}`,
    `Origem: ${ROTULO_CANAL[c.canal as Canal] ?? c.canal}${c.utmCampaign ? `, campanha ${c.utmCampaign}` : ""}`, `Situação: ${SITUACAO_ROTULO[c.situacao]}`,
    `Chegou há ${horasDesde(c.createdAt, agora)} horas`, `Anotações da equipe: ${c.notas ?? "(nenhuma)"}`, `Responde por: ${c.whatsapp ? "WhatsApp" : c.email ? "e-mail" : "não informado"}`,
  ].join("\n");
  try {
    const texto = await conversa({
      chave: fonte.chave, organizacao: fonte.organizacao, modelo: fonte.modelo, maxTokens: 450,
      mensagens: [
        { role: "system", content: "Você é o Maurício, assistente do painel de um pequeno negócio brasileiro. Escreva em português claro, sem jargão, sem prometer resultado nem prazo que a empresa não informou e sem inventar preço. Responda exatamente em três partes: RESUMO: (uma ou duas frases), PRÓXIMA AÇÃO: (uma frase, o que a equipe faz agora), RESPOSTA: (mensagem curta e cordial para o cliente, pronta para colar no WhatsApp, assinada pela empresa)." },
        { role: "user", content: dados },
      ],
    });
    await registrarUsoIa(db, storeId, fonte, agora);
    return lerRespostaDaIa(texto, base);
  } catch {
    return base;
  }
}
