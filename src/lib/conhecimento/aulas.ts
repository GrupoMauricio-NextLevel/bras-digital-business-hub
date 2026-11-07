/**
 * Aulas da base de conhecimento (BC1, D266). Puro. Regra de ouro: nenhum valor em reais ou percentual escrito à mão
 * aqui (o teste `base-conhecimento` procura "%" e "R$" com número no código deste arquivo): todo número vem de `Fatos`,
 * que lê o sistema ao vivo. Trilhas por função aprovadas pelo dono na D265.
 */
import type { MasterFunction } from "@/lib/master-equipe";
import type { Fatos } from "./fatos";
import { formatBRL } from "@/lib/money";

export type TrilhaId = "base" | "venda" | "parceiros" | "atacado" | "suporte" | "financeiro" | "conteudo";
export type Trilha = { id: TrilhaId; numero: number; titulo: string; resumo: string };
export const TRILHAS: Trilha[] = [
  { id: "base", numero: 1, titulo: "Base (todos)", resumo: "O que é a NextLevel, os planos, a taxa zero da plataforma e as palavras certas." },
  { id: "venda", numero: 2, titulo: "Comercial: venda direta", resumo: "Como vender a loja ao lojista: funil, comparativo honesto e Black." },
  { id: "parceiros", numero: 3, titulo: "Comercial: parceiros", resumo: "As duas frentes (CPF e CNPJ), níveis, saque e as barreiras dos concorrentes." },
  { id: "atacado", numero: 4, titulo: "Atacado", resumo: "Grade, pacote, mix e o que cada plano libera." },
  { id: "suporte", numero: 5, titulo: "Suporte ao lojista", resumo: "Ajudar o lojista no dia a dia, sem perder tempo." },
  { id: "financeiro", numero: 6, titulo: "Financeiro", resumo: "Receita, cobrança, comissões e saques." },
  { id: "conteudo", numero: 7, titulo: "Conteúdo", resumo: "Regras de texto, fotos e comparações." },
];

/** Trilhas por função (D265). Sem função (dono) = todas. A trilha 1 é obrigatória para todos. */
export const TRILHAS_POR_FUNCAO: Record<MasterFunction, TrilhaId[]> = {
  COMERCIAL: ["base", "venda", "parceiros", "atacado"],
  SUPORTE: ["base", "atacado", "suporte"],
  FINANCEIRO: ["base", "parceiros", "financeiro"],
  CONTADOR: ["base", "parceiros", "financeiro"],
  CONTEUDO: ["base", "conteudo"],
};
export const trilhasDa = (fn: MasterFunction | null | undefined): TrilhaId[] => (fn ? TRILHAS_POR_FUNCAO[fn] : TRILHAS.map((t) => t.id));

export type Estado = "no-ar" | "em-breve";
export type Aula = { id: string; trilha: TrilhaId; titulo: string; oQue: string; regra: string[]; exemplo?: string; dizer: string[]; nunca: string[]; link?: { rotulo: string; href: string }; decisoes: string[]; estado: Estado };

const brl = formatBRL;
const pct = (bps: number) => `${(bps / 100).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`;
const dataBR = (iso: string) => new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

export function aulas(f: Fatos): Aula[] {
  const pro = f.planos[1];
  const pl = (fn: (p: Fatos["planos"][number]) => string) => f.planos.map((p) => `${p.nome}: ${fn(p)}`).join(" · ");
  const n = f.parceiros.niveis;
  const regua = (k: "cnpjBps" | "cpfBps") => n.map((x) => `${pct(x[k])} ${x.minimo ? `com ${x.minimo}+ clientes ativos` : "desde o 1º cliente"}`).join(", ");
  const ex = pro ? { cnpj: Math.round((pro.mensalCents * (n[0]?.cnpjBps ?? 0)) / 10_000), cpf: Math.round((pro.mensalCents * (n[0]?.cpfBps ?? 0)) / 10_000) } : { cnpj: 0, cpf: 0 };
  const taxas = f.concorrentes.taxas.map((t) => `${t.nome} ${pct(t.maxBps)}`).join(", ");
  return [
    // ------------------------------------------------------------------ 1. Base
    { id: "o-que-e", trilha: "base", titulo: "O que é a NextLevel E-commerce", estado: "no-ar", decisoes: ["D216", "D220", "D257"],
      oQue: "A plataforma de lojas virtuais da NextLevel, feita no Brás e com foco no atacado. É a nossa frente principal hoje.",
      regra: ["O lojista monta a loja, vende no varejo e no atacado (grade, pacote, mix) e recebe pelo Mercado Pago dele.", "O Master está focado na E-commerce; as outras marcas do grupo voltam depois.", "A meta do momento é chegar aos primeiros lojistas pagantes."],
      dizer: ["\"A loja virtual que vende como o Brás vende.\"", "\"Equipe no Brás e no Canindé, perto de você.\""], nunca: ["Prometer faturamento ou prazo de resultado.", "Falar de marcas que ainda não estão abertas como se estivessem."] },
    { id: "planos", trilha: "base", titulo: "Planos e preços", estado: "no-ar", decisoes: ["D220", "D229", "D247"],
      oQue: "Três planos, mensal ou anual, sem fidelidade. Os valores abaixo são os do sistema agora.",
      regra: [
        `Mensal: ${pl((p) => brl(p.mensalCents))}.`,
        `Anual (por mês): ${pl((p) => brl(p.anualMesCents))}.`,
        `Produtos: ${pl((p) => (p.produtos === null ? "sem limite" : p.produtos.toLocaleString("pt-BR")))}. Pessoas no painel: ${pl((p) => String(p.pessoas))}.`,
        `Maurício IA por mês: ${pl((p) => `${p.ia.toLocaleString("pt-BR")} usos`)}. Tema pago: ${pl((p) => (p.temaPago ? "sim" : "não"))}.`,
        `Suporte: ${pl((p) => p.suporte)}. Migração: ${pl((p) => p.migracao)}.`,
        f.diasDeTeste > 0 ? `Teste grátis: ${f.diasDeTeste} dias.` : "Sem teste grátis no momento.",
        "Caiu de plano? Ninguém perde nada: só não cadastra coisas novas acima do limite.",
      ],
      exemplo: pro ? `Lojista no ${pro.nome} paga ${brl(pro.mensalCents)} por mês, ou ${brl(pro.anualMesCents)} por mês no anual.` : undefined,
      dizer: ["\"Sem fidelidade: você pode mudar de plano quando quiser.\""], nunca: ["Inventar desconto que não está no sistema.", "Dizer \"sem limite de produtos\" para Start ou Pro."], link: { rotulo: "Ver planos no site", href: "/planos" } },
    { id: "taxa-zero", trilha: "base", titulo: "Taxa zero da plataforma", estado: "no-ar", decisoes: ["D220", "D221"],
      oQue: "A NextLevel não cobra taxa sobre as vendas do lojista: ele paga só a mensalidade.",
      regra: ["Sempre falar \"taxa zero da plataforma\".", "As taxas do Mercado Pago (Pix e cartão) são do Mercado Pago, à parte, e precisam ser lembradas.", `Taxa máxima dos concorrentes usando o Mercado Pago: ${taxas}.`],
      dizer: ["\"A única com taxa zero no checkout do Mercado Pago.\"", "\"Mais vantajosa no custo total.\""], nunca: ["\"Mais barato\" (use \"mais vantajoso\").", "\"A única plataforma com taxa zero\" ou \"cem por cento das vendas na sua conta\"."] },
    { id: "palavras", trilha: "base", titulo: "As palavras certas (e as proibidas)", estado: "no-ar", decisoes: ["D220", "D221", "D261"],
      oQue: "Como a NextLevel fala com lojistas, parceiros e no site.",
      regra: ["Nunca inventar dado, cliente, depoimento ou número.", "Só anunciar o que existe no sistema; o resto é \"em breve\".", "Comparação com concorrente: tom agressivo, sempre com fato, fonte e data."],
      dizer: ["\"Mais vantajoso\", \"paga mais\", \"vence\".", "\"Confira na regra deles\" (com o link)."], nunca: ["\"Mais barato\".", "Prometer ganho ou faturamento.", "Ofender pessoa ou empresa."] },

    // ------------------------------------------------------------------ 2. Venda direta
    { id: "funil", trilha: "venda", titulo: "O funil comercial", estado: "no-ar", decisoes: ["D200"],
      oQue: "Cada interessado aparece uma vez, do primeiro contato até virar pagante.",
      regra: ["As etapas andam sozinhas pelo que a pessoa faz no sistema.", "Abra a ficha para ver a linha do tempo, assumir o cliente e marcar a próxima ação.", "A tela Agora mostra quem chamar primeiro."],
      dizer: ["Use a mensagem pronta do WhatsApp e personalize o nome."], nunca: ["Deixar conversa esperando sem resposta."], link: { rotulo: "Abrir Comercial", href: "/master/comercial" } },
    { id: "comparativo", trilha: "venda", titulo: "Comparativo com a concorrência", estado: "no-ar", decisoes: ["D221", "D230"],
      oQue: "A comparação é pelo custo total: mensalidade mais taxa da plataforma usando o Mercado Pago.",
      regra: [`Taxas dos concorrentes com o Mercado Pago: ${taxas}.`, "Em alguns planos de entrada a mensalidade deles é menor: o argumento é o custo total, não a mensalidade.", "O placar só mostra o que vencemos, com a súmula no Master."],
      dizer: ["\"Some a taxa que eles cobram em cada venda e veja quanto sobra.\""], nunca: ["Dizer que a nossa mensalidade é a menor em todos os planos."], link: { rotulo: "Abrir o comparativo", href: "/comparativo" } },
    { id: "black", trilha: "venda", titulo: "Black NextLevel", estado: f.black.ativa ? "no-ar" : "em-breve", decisoes: ["D227", "D229", "D242"],
      oQue: f.black.ativa ? `Campanha no ar até ${dataBR(f.black.fim)} (Brasília).` : "Campanha encerrada ou desligada no Master.",
      regra: [
        `Anual na Black: ${f.black.mesesGratisAnual} meses grátis, com o preço travado enquanto a assinatura estiver ativa.`,
        `Depois da Black: ${pl((p) => (p.depoisDaBlackMensalCents ? `${brl(p.depoisDaBlackMensalCents)}/mês` : "—"))}; anual ${pl((p) => (p.depoisDaBlackAnualMesCents ? `${brl(p.depoisDaBlackAnualMesCents)}/mês` : "—"))}.`,
        "O Master pode prorrogar, nunca encurtar o fim anunciado.",
        "O lojista liga o kit Black na loja dele em 1 clique.",
      ],
      dizer: ["\"Quem assina agora trava o preço.\""], nunca: ["Contagem falsa ou \"últimas vagas\" que não existem."], link: { rotulo: "Abrir Black", href: "/master/black" } },
    { id: "dominio-email", trilha: "venda", titulo: "Domínio próprio e e-mail", estado: "no-ar", decisoes: ["D234", "D245"],
      oQue: "Todo lojista da E-commerce pode usar o próprio domínio, com passo a passo e verificação.",
      regra: ["O painel mostra os registros de DNS e confere sozinho.", "E-mail com o domínio: caminho grátis guiado (Zoho Mail, na conta do lojista).", "O pacote pago de e-mail está bloqueado até termos um provedor sem custo para nós."],
      dizer: ["\"Seu domínio, sua marca, sem custo extra.\""], nunca: ["Vender e-mail pago."] },

    // ------------------------------------------------------------------ 3. Parceiros
    { id: "duas-frentes", trilha: "parceiros", titulo: "As duas frentes: CPF e CNPJ", estado: "no-ar", decisoes: ["D260", "D263"],
      oQue: "A comissão segue o documento do cadastro e vale sobre TODA mensalidade paga, desde a 1ª, enquanto o cliente ficar.",
      regra: [`Parceiro com CNPJ (criador, vendedor, agência): ${regua("cnpjBps")}.`, `Programa de Indicações pelo CPF (qualquer pessoa): ${regua("cpfBps")}.`, "O percentual vale para a carteira inteira.", "Agência é só com CNPJ e tem benefícios exclusivos (não detalhar em público).", "Sem Black. Bônus em dinheiro só pelas campanhas que o dono liga (aula Bônus gamificado); o desafio do mês é reconhecimento."],
      exemplo: pro ? `Cliente no ${pro.nome}: ${brl(ex.cnpj)} por mês para quem tem CNPJ e ${brl(ex.cpf)} por mês pelo CPF, no 1º nível.` : undefined,
      dizer: ["\"Recebe no CPF, por Pix, sem abrir empresa.\"", "\"Régua pública, sem letra miúda.\""], nunca: ["Contar quais são os benefícios exclusivos da agência.", "Prometer ganho."], link: { rotulo: "Ver a página de parceiros", href: "/parceiros" } },
    { id: "niveis", trilha: "parceiros", titulo: "Níveis: sobe na hora, desce devagar", estado: "no-ar", decisoes: ["D249", "D260"],
      oQue: "O nível conta os clientes pagantes ativos do parceiro.",
      regra: [...n.map((x) => `${x.nome}: ${x.minimo ? `${x.minimo}+ clientes` : "desde o 1º"} (CNPJ ${pct(x.cnpjBps)}, CPF ${pct(x.cpfBps)}).`), "Sobe na hora da venda.", `Só desce depois de ${f.parceiros.mesesParaDescer} meses seguidos abaixo do mínimo.`, "O Master pode fixar um nível, com motivo obrigatório."],
      dizer: ["\"Cada cliente novo aumenta o seu percentual em toda a carteira.\""], nunca: ["Falar em Diamante ou Agência Elite (não existem mais)."] },
    { id: "bonus", trilha: "parceiros", titulo: "Bônus gamificado: semana e mês, online e rua", estado: "no-ar", decisoes: ["D271"],
      oQue: "Além da comissão, campanhas de bônus ligadas pelo dono premiam quem traz lojas novas na semana e no mês. Online e executivos de rua têm campanhas diferentes.",
      regra: [
        "Conta só a 1ª venda de cada loja (renovação já paga comissão) e só depois da garantia: loja estornada ou cancelada na garantia não conta.",
        "Pontos pelo valor pago: 1 ponto = 1 mensalidade do Start; Pro e Scale valem proporcionalmente; anual vale um pouco mais. Desconto reduz os pontos.",
        `Teto por loja, somando as campanhas: online ${pct(f.bonus.tetoBps.ONLINE)} e rua ${pct(f.bonus.tetoBps.RUA)} de uma mensalidade; cada campanha tem orçamento por período.`,
        ...f.bonus.campanhas.map((c) => `${c.publico === "RUA" ? "Rua" : "Online"} · ${c.nome} (${c.periodo === "SEMANA" ? "semana" : "mês"}): ${c.faixas.map((x) => `${x.pontos} pts → ${brl(x.valorCents)}`).join(" · ")}.`),
        "Vale a faixa mais alta atingida no período (não soma faixas); o bônus entra no saldo do parceiro e segue para saque.",
      ],
      dizer: ["\"Ao atingir a faixa, o bônus entra no seu saldo depois da garantia das vendas.\"", "\"A regra completa está na página Comissões e bônus do site.\""], nunca: ["Prometer valor fixo por mês.", "Dizer que renovação ou loja em teste conta pontos."], link: { rotulo: "Abrir Bônus e metas", href: "/master/partners/bonus" } },
    { id: "missoes", trilha: "parceiros", titulo: "Missões, sequência, selos e ranking", estado: "no-ar", decisoes: ["D272"],
      oQue: "No painel do parceiro e do executivo, a semana vira jogo: missões com barra, sequência de semanas com venda, selos de conquista e ranking. Nada disso paga dinheiro: o dinheiro está só nas campanhas de bônus.",
      regra: [
        "Missões online: levar gente ao link, trazer cadastro, fechar venda e vender um plano maior. Missões da rua: cadastros, vendas, plano maior e plano anual.",
        "Cumpriu todas as missões da semana: selo \"Semana completa\" e celebração na tela.",
        "Sequência: semanas seguidas com pelo menos uma venda; a semana atual vazia só quebra a sequência quando acaba.",
        "Selos: primeira venda, 5 no mês, primeiro Scale, fechou anual, 4 semanas seguidas, semana completa, cliente fiel (6 meses), níveis Prata e Ouro.",
        "Ranking da semana e do mês, separado entre online e rua, mostra a posição e quanto falta para passar quem está logo acima.",
      ],
      dizer: ["\"Olha quanto falta para você passar o próximo do ranking.\""], nunca: ["Prometer dinheiro por missão ou selo."] },
    { id: "saque", trilha: "parceiros", titulo: "Saque, garantia e link", estado: "no-ar", decisoes: ["D248", "D260"],
      oQue: "Como e quando o parceiro recebe.",
      regra: [`Cada comissão fica ${f.parceiros.garantiaDias} dias em garantia (cobre estornos).`, `Saque por Pix a partir de ${brl(f.parceiros.saqueMinimoCents)}, para o mesmo CPF ou CNPJ do cadastro, sem anexar nota fiscal.`, `O link vale ${f.parceiros.atribuicaoDias} dias; o cupom tem prioridade.`, `Fica inativo depois de ${f.parceiros.inativoMeses} meses sem cliente ativo e sem comissão.`],
      dizer: ["\"Ninguém pede nota fiscal para te pagar.\""], nunca: ["Prometer data de pagamento fora da regra."] },
    { id: "concorrentes-parceiros", trilha: "parceiros", titulo: "Barreiras dos concorrentes", estado: "no-ar", decisoes: ["D261", "D262", "D263"],
      oQue: `O que os outros programas exigem, segundo os sites oficiais (consulta em ${f.concorrentes.consulta}).`,
      regra: [...f.concorrentes.barreiras.map((b) => `${b.nome}: ${b.barreira}`), "A Loja Integrada fica fora da comparação, por decisão do dono."],
      dizer: ["\"Eles exigem nota fiscal para te pagar. Aqui, não.\"", `"A Shopify paga US$ ${f.concorrentes.shopifyUsd} uma vez por loja do Brasil."`], nunca: ["Afirmar regra de concorrente sem fonte."], link: { rotulo: "Ver o raio-x na página", href: "/parceiros#raio-x" } },
    { id: "crm-parceiros", trilha: "parceiros", titulo: "CRM de parceiros", estado: "no-ar", decisoes: ["D251"],
      oQue: "Funil, ficha 360, fila do dia, ranking, segmentos, avisos e desafio do mês.",
      regra: ["Arraste o parceiro entre as etapas do funil.", "Use segmentos para mandar aviso só para quem importa.", "O desafio do mês é reconhecimento: ranking e destaque, sem dinheiro."],
      dizer: ["Ligue para quem está parado há mais tempo."], nunca: ["Criar desafio com prêmio em dinheiro."], link: { rotulo: "Abrir Parceiros", href: "/master/partners" } },

    // ------------------------------------------------------------------ 4. Atacado
    { id: "modalidades", trilha: "atacado", titulo: "Como o Brás vende", estado: "no-ar", decisoes: ["D257", "D259"],
      oQue: "Grade fechada, pacote sortido, mix da loja toda, peça avulsa e pedido do balcão, na mesma loja.",
      regra: ["Um motor de preço só: loja, carrinho, pedido, proposta e balcão calculam igual, e o servidor sempre confere.", "As peças das grades contam para o mix.", "Caiu abaixo do mínimo do mix, o preço volta ao varejo na hora.", "O preço nunca fica abaixo do custo nem do mínimo do produto."],
      dizer: ["\"Grade, pacote, mix e varejo na mesma loja.\""], nunca: ["Prometer excursão ou tabela por cliente (ainda em breve)."] },
    { id: "atacado-planos", trilha: "atacado", titulo: "O que cada plano libera no atacado", estado: "no-ar", decisoes: ["D258"],
      oQue: "Limites que valem para criar coisas novas; ninguém perde o que já tem.",
      regra: f.planos.map((p) => `${p.nome}: ${p.atacado.faixas} faixas de preço, ${p.atacado.gradesPorProduto >= 99 ? "grades sem limite" : `${p.atacado.gradesPorProduto} grade(s) por produto`}, ${p.atacado.regrasMix} regra(s) de mix, ${p.atacado.pacote ? "com" : "sem"} pacote sortido, ${p.atacado.gradeLivre ? "com" : "sem"} grade livre (mínimo por modelo e múltiplos).`),
      dizer: ["\"Começa no Start e cresce com você.\""], nunca: ["Dizer que o Start tem pacote sortido."] },
    { id: "box", trilha: "atacado", titulo: "O que o cliente vê na loja", estado: "no-ar", decisoes: ["D259"],
      oQue: "Escada de preço por peça, barra do mix e \"a partir de… a peça\" no card.",
      regra: ["O box mostra varejo, faixa, atacado e grade, com \"seu preço\" marcado.", "A barra do mix soma o carrinho e a escolha atual.", "O carrinho mostra quanto o cliente economizou com o atacado."],
      dizer: ["Mostre a loja de demonstração no celular."], nunca: ["Dizer que o atacado funciona na loja de rede do SuperDrop."] },
    { id: "grade-livre", trilha: "atacado", titulo: "Grade livre: cor × tamanho, mínimo e múltiplos", estado: "no-ar", decisoes: ["D268"],
      oQue: "O cliente monta a própria grade numa tabela de cores e tamanhos, e a loja pode exigir um mínimo de peças por modelo ou vender em múltiplos.",
      regra: [
        `Mínimo por modelo e múltiplos: ${f.planos.filter((p) => p.atacado.gradeLivre).map((p) => p.nome).join(" e ")}. Cores: todos os planos.`,
        "Conta a peça avulsa do mesmo modelo em qualquer tamanho e cor; grades e pacotes são lotes à parte.",
        "O mínimo precisa fechar no múltiplo (ex.: de 6 em 6, mínimo 12).",
        "A loja virtual só fecha o pedido com a grade completa; o pedido do balcão não é barrado.",
        "Cor nova entra com os mesmos tamanhos e estoque zero; o lojista lança o estoque depois.",
      ],
      exemplo: "Camiseta com mínimo de 12 e de 6 em 6: o cliente escolhe 7 pretas M e 5 azuis G (12 peças) e fecha. Com 13 peças, o box avisa que faltam 5 para fechar.",
      dizer: ["\"Seu cliente monta a grade do jeito dele, em cores e tamanhos.\""], nunca: ["Dizer que o Start tem mínimo por modelo."] },
    { id: "atacado-proximo", trilha: "atacado", titulo: "O que vem depois no atacado", estado: "em-breve", decisoes: ["D257", "D268"],
      oQue: "Excursão e retirada, romaneio por grade, recompra rápida, tabelas por cliente e catálogo fechado.",
      regra: ["Fases AT4 a AT8.", "Só anunciar quando estiver no ar."],
      dizer: ["\"Está no nosso plano; aviso quando chegar.\""], nunca: ["Vender como pronto."] },

    // ------------------------------------------------------------------ 5. Suporte
    { id: "ver-como", trilha: "suporte", titulo: "Ver o painel como o lojista", estado: "no-ar", decisoes: ["D205"],
      oQue: "Para ajudar sem pedir print.",
      regra: ["Informe o motivo (fica registrado).", "Começa só olhando; agir em nome do cliente é um passo a mais.", "Saia pela faixa do topo quando terminar."],
      dizer: ["\"Vou abrir o seu painel aqui para te mostrar.\""], nunca: ["Mudar algo sem avisar o lojista."], link: { rotulo: "Abrir Lojistas", href: "/master/clientes" } },
    { id: "conversas", trilha: "suporte", titulo: "Responder conversas", estado: "no-ar", decisoes: ["D206"],
      oQue: "Visitantes do site e lojistas pedindo ajuda chegam no Atendimento.",
      regra: ["Ao responder, você assume a conversa.", "No fim, marque Ganha ou Perdida e deixe notas.", "Devolva ao Maurício quando terminar com um visitante."],
      dizer: ["Responda primeiro quem espera há mais tempo."], nunca: ["Pedir senha ou chave do lojista."], link: { rotulo: "Abrir Atendimento", href: "/master/ia" } },
    { id: "pedidos-comuns", trilha: "suporte", titulo: "Os pedidos mais comuns do lojista", estado: "no-ar", decisoes: ["D234", "D243"],
      oQue: "Produto, frete, Mercado Pago, domínio e tema: o Maurício do painel do lojista tem o passo a passo de cada um.",
      regra: ["Domínio que não conecta sozinho cai na fila do Master.", "A chave de IA do lojista fica guardada com segurança e nunca aparece na tela.", "O comprador pode desistir em até 7 dias depois de receber."],
      dizer: ["\"Te mando o passo a passo agora.\""], nunca: ["Pedir que o lojista mande a chave do Mercado Pago por mensagem."] },

    // ------------------------------------------------------------------ 6. Financeiro
    { id: "receita", trilha: "financeiro", titulo: "Receita e pagantes", estado: "no-ar", decisoes: ["D200"],
      oQue: "A receita mensal soma os planos ativos (anual dividido por 12).",
      regra: ["Cortesia é acesso dado à mão: não conta como pagante.", "Vencidas e aguardando pagamento aparecem primeiro.", "Sem o Mercado Pago da NextLevel conectado, os planos não são cobrados."],
      dizer: ["Chame pelo WhatsApp quem está com pagamento pendente."], nunca: ["Contar cortesia como venda."], link: { rotulo: "Abrir Receita", href: "/master/receita" } },
    { id: "comissoes", trilha: "financeiro", titulo: "Comissões e saques", estado: "no-ar", decisoes: ["D248", "D260", "D263"],
      oQue: "O percentual depende do nível e do documento (CPF ou CNPJ) do parceiro.",
      regra: [`CNPJ: ${regua("cnpjBps")}. CPF: ${regua("cpfBps")}.`, `Garantia de ${f.parceiros.garantiaDias} dias; depois, disponível para saque a partir de ${brl(f.parceiros.saqueMinimoCents)}.`, "Estorno do cliente devolve a comissão, inclusive por débito no saldo.", "A base é o valor pago, menos o imposto configurado no Master."],
      dizer: ["\"O extrato mostra cada lançamento.\""], nunca: ["Pagar fora do sistema."], link: { rotulo: "Abrir Parceiros", href: "/master/partners" } },
    { id: "receber-assinatura", trilha: "financeiro", titulo: "Receber assinatura à mão e cuidar das assinaturas", estado: "no-ar", decisoes: ["D270"],
      oQue: "Quando o cliente paga fora do checkout online (Pix na chave, maquininha ou dinheiro), o Master recebe pelo Caixa: a assinatura renova, a loja é liberada, a comissão nasce e o valor entra no caixa do dia.",
      regra: [
        "Só o dono e o Financeiro recebem; o caixa de hoje precisa estar aberto.",
        "Vazio = valor da tabela. Valor menor é desconto e exige motivo; valor maior que a tabela é recusado.",
        "Quem vendeu vira a indicação da loja se ela ainda não tiver uma; se já tiver, a comissão segue com quem indicou primeiro.",
        "A comissão é a mesma do programa de parceiros (nível e CPF ou CNPJ), com a mesma garantia.",
        "Estornar desfaz tudo: tira do caixa, cancela a fatura, desfaz a comissão e volta o período pago.",
        "Na aba Assinaturas: vencem em 7 dias, vencidas, em teste, pagas à mão e sem plano; estender vencimento, trocar plano e cancelar, sempre com motivo.",
      ],
      exemplo: "Lojista paga o Start no Pix da chave da NextLevel: Caixa → Receber assinatura → loja, Start, mensal, Pix → Receber e liberar. A loja fica paga por mais um mês e o executivo que vendeu ganha a comissão dele.",
      dizer: ["\"Recebi, já liberei a sua loja; o comprovante fica no nosso caixa.\""], nunca: ["Liberar a loja à mão sem registrar o pagamento.", "Dar desconto sem motivo."], link: { rotulo: "Abrir Caixa", href: "/master/receita/caixa?aba=assinaturas" } },
    { id: "caixa", trilha: "financeiro", titulo: "Caixa do dia: abrir, lançar e fechar", estado: "no-ar", decisoes: ["D269"],
      oQue: "Todo dia o caixa abre com o dinheiro da gaveta e fecha contando. Cada entrada e saída guarda a forma de pagamento: checkout online, maquininha do Mercado Pago com o Mauricio, maquininha com vendedor, Pix na chave do CNPJ da NextLevel ou dinheiro.",
      regra: [
        "Abrem, lançam e fecham: o dono e a função Financeiro. Dia fechado fica travado; só o dono reabre, com motivo.",
        "O Mercado Pago entra sozinho e não mexe na gaveta. Lance à mão só o que veio por outro meio.",
        "Todo lançamento diz para qual conta foi o dinheiro: dinheiro com o Mauricio, Mercado Pago (CNPJ Mega Tron), Pix Itaú (CNPJ NextLevel) ou Pix Nubank (CPF Mauricio).",
        "Toda entrada é ligada ao que foi pago: assinatura (por Receber assinatura), template, serviço adicional ou outros com descrição.",
        "Sangria e reforço de troco são sempre em dinheiro.",
        "No fechamento, o sistema mostra o esperado na gaveta e a diferença; sobra ou falta exige motivo.",
        "Nada se apaga: errou, edite ou estorne com motivo; o histórico guarda o antes e o depois.",
      ],
      exemplo: "Abriu com o troco, recebeu um plano em dinheiro e um serviço no Pix e fez uma sangria. Na gaveta deve estar: troco + dinheiro recebido − sangria. O Pix aparece no resumo do dia, mas não na gaveta.",
      dizer: ["\"Cada real tem origem e meio no caixa.\""], nunca: ["Apagar ou deixar sem motivo um lançamento errado.", "Lançar à mão um pagamento do Mercado Pago (fica em dobro)."], link: { rotulo: "Abrir Caixa", href: "/master/receita/caixa" } },
    { id: "beneficios-plano", trilha: "financeiro", titulo: "Benefícios por plano", estado: "no-ar", decisoes: ["D247"],
      oQue: "Uma tabela só, editável no Master, alimenta site, checkout, placar e as travas.",
      regra: ["Só Comercial e Financeiro editam, com registro de quem mudou.", "Quem já passou do limite continua vendendo tudo; só não cadastra novos."],
      dizer: ["Mudou a tabela? A página de planos muda junto."], nunca: ["Prometer limite diferente do da tabela."], link: { rotulo: "Abrir Assinaturas", href: "/master/plans" } },

    // ------------------------------------------------------------------ 7. Conteúdo
    { id: "texto", trilha: "conteudo", titulo: "Regras de texto", estado: "no-ar", decisoes: ["D220", "D221", "D261"],
      oQue: "O que vale em toda página, post e mensagem.",
      regra: ["\"Taxa zero da plataforma\", sempre lembrando que o Mercado Pago cobra as dele.", "Nunca \"mais barato\".", "Comparação: tom agressivo, fato, fonte e data.", "Só o que existe no sistema; o resto é \"em breve\"."],
      dizer: ["Frases curtas, português simples."], nunca: ["Número inventado, depoimento falso ou logo de terceiros sem o material oficial."] },
    { id: "fotos", trilha: "conteudo", titulo: "Fotos e selos", estado: "no-ar", decisoes: ["D221"],
      oQue: "Imagem conta a verdade da NextLevel.",
      regra: ["Fotos reais da equipe NextLevel; nunca foto genérica para tapar buraco.", "Selos próprios com prompt de imagem; selos de terceiros só com o material oficial deles."],
      dizer: ["Prefira a foto real, mesmo simples."], nunca: ["Usar logo do Mercado Pago, Google ou Reclame Aqui sem autorização."] },
  ].filter(Boolean) as Aula[];
}

/** Busca simples (sem acento, sem maiúscula) no título e no texto das aulas. */
export const semAcento = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
export function buscarAulas(lista: Aula[], q: string): Aula[] {
  const termos = semAcento(q).split(/\s+/).filter((t) => t.length >= 2);
  if (!termos.length) return [];
  return lista.filter((a) => { const txt = semAcento([a.titulo, a.oQue, ...a.regra, a.exemplo ?? "", ...a.dizer, ...a.nunca].join(" ")); return termos.every((t) => txt.includes(t)); });
}
