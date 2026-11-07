/**
 * Perguntas rápidas de cada aula (BC2, D267). Puro. Como nas aulas, nenhum valor em reais ou percentual escrito à mão:
 * a resposta certa e as erradas saem dos `Fatos` (o sistema de agora). A correção acontece no servidor.
 */
import { formatBRL } from "@/lib/money";
import type { Fatos } from "./fatos";

export type Pergunta = { pergunta: string; opcoes: string[]; certa: number };

const pct = (bps: number) => `${(bps / 100).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`;
const brl = formatBRL;
/** Monta as opções com a certa numa posição que varia pela pergunta (sem ficar sempre na 1ª). */
function q(pergunta: string, certa: string, erradas: string[]): Pergunta {
  const unicas = [...new Set(erradas.filter((e) => e !== certa))].slice(0, 3);
  const pos = [...pergunta].reduce((s, c) => s + c.charCodeAt(0), 0) % (unicas.length + 1);
  const opcoes = [...unicas.slice(0, pos), certa, ...unicas.slice(pos)];
  return { pergunta, opcoes, certa: pos };
}

export function perguntasDa(aulaId: string, f: Fatos): Pergunta[] {
  const [start, pro, scale] = f.planos;
  const n = f.parceiros.niveis;
  const n0 = n[0], n1 = n[1], n2 = n[2];
  const m = (v: number, k: number) => Math.round(v * k);
  const P: Record<string, () => Pergunta[]> = {
    "o-que-e": () => [
      q("Qual é o foco da NextLevel E-commerce?", "Lojas virtuais com foco no atacado do Brás", ["Só marketplace", "Só lojas de importados", "Revenda sem estoque apenas"]),
      q("Por onde o lojista recebe as vendas?", "Pelo Mercado Pago dele", ["Pela conta da NextLevel", "Por boleto da NextLevel", "Só em dinheiro"]),
      q("O que podemos prometer a um lojista?", "Nada de faturamento ou prazo de resultado", ["Dobrar as vendas em 30 dias", "Faturamento mínimo garantido", "Primeira venda na primeira semana"]),
    ],
    planos: () => [
      q(`Quanto custa o ${pro?.nome} no mensal?`, brl(pro?.mensalCents ?? 0), [brl(start?.mensalCents ?? 0), brl(scale?.mensalCents ?? 0), brl(m(pro?.mensalCents ?? 0, 1.2))]),
      q(`Quantos produtos o ${start?.nome} permite?`, start?.produtos === null ? "Sem limite" : (start?.produtos ?? 0).toLocaleString("pt-BR"), ["Sem limite", (pro?.produtos ?? 0).toLocaleString("pt-BR"), (m(start?.produtos ?? 0, 2)).toLocaleString("pt-BR")]),
      q("O lojista caiu para um plano menor. O que acontece?", "Não perde nada; só não cadastra novos acima do limite", ["Perde os produtos acima do limite", "A loja sai do ar", "Paga multa"]),
    ],
    "taxa-zero": () => [
      q("Qual frase é a certa?", "Taxa zero da plataforma", ["A única plataforma sem nenhuma taxa", "Todas as vendas na sua conta, sem nenhum desconto", "Sem taxa nenhuma, nem do Mercado Pago"]),
      q("E as taxas do Mercado Pago?", "São do Mercado Pago, à parte, e precisamos lembrar disso", ["A NextLevel paga", "Não existem", "Só no cartão parcelado"]),
      q("Como falamos do nosso preço?", "Mais vantajoso", ["Mais barato", "O mais barato do Brasil", "De graça"]),
    ],
    palavras: () => [
      q("Comparando com um concorrente, o tom é…", "Agressivo, com fato, fonte e data", ["Neutro, sem citar nomes", "Ofensivo", "Sem fonte, só opinião"]),
      q("Um recurso ainda não existe. Como anunciar?", "Como \"em breve\"", ["Como pronto", "Não falar nunca", "Prometer data exata"]),
      q("Qual palavra é proibida?", "Mais barato", ["Mais vantajoso", "Vence", "Paga mais"]),
    ],
    funil: () => [
      q("Como as etapas do funil andam?", "Sozinhas, pelo que a pessoa faz no sistema", ["Só à mão", "Uma vez por semana", "Pelo financeiro"]),
      q("Onde ver quem chamar primeiro?", "Na tela Agora", ["No Financeiro", "No Sistema", "Em Templates"]),
      q("Conversa esperando resposta: o que fazer?", "Responder primeiro quem espera há mais tempo", ["Esperar o cliente chamar de novo", "Deixar para o fim do dia", "Encerrar a conversa"]),
    ],
    comparativo: () => [
      q("Como comparamos com a concorrência?", "Custo total: mensalidade + taxa da plataforma", ["Só a mensalidade", "Só o número de temas", "Só a quantidade de clientes"]),
      q(`Qual a taxa máxima da ${f.concorrentes.taxas[0]?.nome ?? "concorrente"} com o Mercado Pago?`, pct(f.concorrentes.taxas[0]?.maxBps ?? 0), [pct(0), pct((f.concorrentes.taxas[0]?.maxBps ?? 0) * 2), pct(m(f.concorrentes.taxas[0]?.maxBps ?? 0, 0.5))]),
      q("O placar mostra…", "Só o que vencemos, com súmula", ["Todos os jogos, inclusive derrotas", "Números estimados", "Opinião da equipe"]),
    ],
    black: () => [
      q("Quantos meses grátis no anual da Black?", String(f.black.mesesGratisAnual), [String(f.black.mesesGratisAnual + 1), String(Math.max(0, f.black.mesesGratisAnual - 1)), "Nenhum"]),
      q("O Master pode encurtar o fim anunciado da Black?", "Não, só prorrogar", ["Sim, quando quiser", "Só no último dia", "Só o financeiro"]),
      q(`Depois da Black, o ${pro?.nome} mensal passa a…`, brl(pro?.depoisDaBlackMensalCents ?? 0), [brl(pro?.mensalCents ?? 0), brl(scale?.depoisDaBlackMensalCents ?? 0), brl(m(pro?.depoisDaBlackMensalCents ?? 0, 1.5))]),
    ],
    "dominio-email": () => [
      q("Quem pode usar domínio próprio?", "Todo lojista da E-commerce", ["Só o Scale", "Só o Pro e o Scale", "Ninguém ainda"]),
      q("Qual o caminho do e-mail com o domínio?", "Grátis guiado, na conta do lojista (Zoho Mail)", ["Pacote pago da NextLevel", "Não existe", "Só com Google pago"]),
      q("O domínio não conectou sozinho. E aí?", "Cai na fila do Master para a equipe cadastrar", ["O lojista desiste", "Cobra taxa extra", "Precisa trocar de plano"]),
    ],
    "duas-frentes": () => [
      q("Quanto ganha um parceiro com CNPJ no 1º nível?", pct(n0?.cnpjBps ?? 0), [pct(n0?.cpfBps ?? 0), pct(n2?.cnpjBps ?? 0), pct(m(n0?.cnpjBps ?? 0, 2.5))]),
      q("E quem se cadastra com CPF, no 1º nível?", pct(n0?.cpfBps ?? 0), [pct(n0?.cnpjBps ?? 0), pct(n1?.cpfBps ?? 0), pct(0)]),
      q("O que dizemos sobre os benefícios da agência em público?", "Que existem benefícios exclusivos, sem dizer quais", ["A lista completa", "Que não existem", "Que é a mesma regra do CPF"]),
    ],
    niveis: () => [
      q(`Com quantos clientes ativos o parceiro chega ao nível ${n1?.nome}?`, String(n1?.minimo ?? 0), [String(n2?.minimo ?? 0), String(Math.max(1, (n1?.minimo ?? 0) - 7)), String((n1?.minimo ?? 0) * 3)]),
      q("Quando o nível desce?", `Depois de ${f.parceiros.mesesParaDescer} meses seguidos abaixo do mínimo`, ["Na hora em que um cliente cancela", "Todo começo de ano", "Nunca"]),
      q(`No nível ${n2?.nome}, com CNPJ, o parceiro ganha…`, pct(n2?.cnpjBps ?? 0), [pct(n1?.cnpjBps ?? 0), pct(n2?.cpfBps ?? 0), pct(m(n2?.cnpjBps ?? 0, 1.5))]),
    ],
    saque: () => [
      q("Qual o saque mínimo?", brl(f.parceiros.saqueMinimoCents), [brl(f.parceiros.saqueMinimoCents * 2), brl(m(f.parceiros.saqueMinimoCents, 0.5)), brl(f.parceiros.saqueMinimoCents * 10)]),
      q("Quantos dias de garantia antes de liberar o saque?", String(f.parceiros.garantiaDias), [String(f.parceiros.garantiaDias * 2), String(Math.max(1, f.parceiros.garantiaDias - 23)), "Nenhum"]),
      q("Precisa anexar nota fiscal para receber?", "Não", ["Sim, sempre", "Só com CPF", "Só acima do saque mínimo"]),
    ],
    "concorrentes-parceiros": () => [
      q("O que a WBuy exige para pagar comissão?", "CNPJ e nota fiscal em cada saque", ["Nada", "Só CPF", "Um vídeo de divulgação"]),
      q(`Quanto a Shopify paga por loja do Brasil?`, `US$ ${f.concorrentes.shopifyUsd}, uma vez só`, [`US$ ${f.concorrentes.shopifyUsd * 6}, uma vez só`, `US$ ${f.concorrentes.shopifyUsd} todo mês`, "Uma parte de toda mensalidade"]),
      q("Que concorrente fica fora da comparação, por decisão do dono?", "Loja Integrada", ["Nuvemshop", "Shopify", "Tray"]),
    ],
    "crm-parceiros": () => [
      q("O desafio do mês paga dinheiro?", "Não: é reconhecimento (ranking e destaque)", ["Sim, um bônus fixo", "Sim, dobra a comissão", "Só para agências"]),
      q("Para que servem os segmentos?", "Mandar aviso só para quem importa", ["Mudar a comissão", "Bloquear parceiros", "Gerar nota fiscal"]),
      q("Onde fica o funil de parceiros?", "Master → Parceiros", ["Master → Sistema", "Painel do lojista", "Página pública"]),
    ],
    modalidades: () => [
      q("As peças das grades contam para o mix?", "Sim", ["Não", "Só no Scale", "Só no pacote sortido"]),
      q("O carrinho caiu abaixo do mínimo do mix. O preço…", "Volta ao varejo na hora", ["Continua no atacado", "Fica travado até pagar", "Some do carrinho"]),
      q("Quem confere o preço do pedido?", "O servidor, sempre, com o mesmo cálculo da loja", ["O navegador do cliente", "O lojista à mão", "Ninguém"]),
    ],
    "atacado-planos": () => [
      q(`O ${start?.nome} tem pacote sortido?`, start?.atacado.pacote ? "Sim" : "Não", [start?.atacado.pacote ? "Não" : "Sim", "Só na Black", "Só com CNPJ"]),
      q(`Quantas regras de mix o ${pro?.nome} permite?`, String(pro?.atacado.regrasMix ?? 0), [String(start?.atacado.regrasMix ?? 0), String(scale?.atacado.regrasMix ?? 0), String((pro?.atacado.regrasMix ?? 0) + 7)]),
      q("Ao mudar para um plano menor, o lojista perde grades?", "Não; só não cria novas acima do limite", ["Sim, todas", "Sim, as mais antigas", "Perde o atacado inteiro"]),
    ],
    box: () => [
      q("O que o box do produto marca para o cliente?", "\"Seu preço\" na escada de preço", ["Só o preço de varejo", "O custo do produto", "O lucro do lojista"]),
      q("A barra do mix soma…", "O carrinho e a escolha atual", ["Só o produto aberto", "As vendas do mês", "As visitas da loja"]),
      q("O carrinho mostra…", "Quanto o cliente economizou com o atacado", ["O custo do lojista", "A comissão do parceiro", "Nada de atacado"]),
    ],
    "grade-livre": () => [
      q(`O ${start?.nome} pode exigir mínimo de peças por modelo?`, start?.atacado.gradeLivre ? "Sim" : `Não; vem no ${pro?.nome}`, [start?.atacado.gradeLivre ? `Não; vem no ${pro?.nome}` : "Sim", "Só na Black", "Só com CNPJ"]),
      q("O que conta para o mínimo do modelo?", "Peças avulsas do modelo, em qualquer tamanho e cor", ["Só peças do mesmo tamanho", "Também as grades fechadas", "Qualquer produto da loja"]),
      q("Vendido de 6 em 6, o cliente escolheu 13. O que acontece?", "O box avisa que faltam 5 para fechar", ["Fecha o pedido assim mesmo", "Arredonda para 12 sozinho", "Cobra multa"]),
    ],
    "atacado-proximo": () => [
      q("Excursão e retirada já estão no ar?", "Ainda não: em breve", ["Sim, em todos os planos", "Sim, só no Scale", "Foram canceladas"]),
      q("Como falar de um recurso em breve?", "\"Está no nosso plano; aviso quando chegar\"", ["\"Já funciona\"", "\"Chega amanhã\"", "Não responder"]),
      q("Quem decidiu pausar as próximas fases do atacado?", "O dono", ["O suporte", "Um parceiro", "O Mercado Pago"]),
    ],
    "ver-como": () => [
      q("Ao entrar como lojista, o que é obrigatório?", "Informar o motivo (fica registrado)", ["Pedir a senha dele", "Avisar o financeiro", "Nada"]),
      q("Começa podendo…", "Só olhar; agir é um passo a mais", ["Mudar tudo", "Apagar produtos", "Trocar o plano"]),
      q("Pode mudar algo sem avisar o lojista?", "Não", ["Sim", "Só preços", "Só o tema"]),
    ],
    conversas: () => [
      q("Ao responder uma conversa, você…", "Assume a conversa", ["Encerra a conversa", "Passa para o financeiro", "Apaga o histórico"]),
      q("No fim do atendimento de um visitante:", "Marcar Ganha ou Perdida e deixar notas", ["Não fazer nada", "Bloquear o visitante", "Mandar e-mail em massa"]),
      q("Podemos pedir a senha do lojista?", "Nunca", ["Sim, para ajudar", "Só por WhatsApp", "Só no primeiro acesso"]),
    ],
    "pedidos-comuns": () => [
      q("Em quantos dias o comprador pode desistir?", "7 dias depois de receber", ["30 dias", "Não pode", "1 dia"]),
      q("A chave de IA do lojista aparece na tela?", "Nunca: fica guardada com segurança", ["Sim, para o suporte copiar", "Só para o dono da NextLevel", "Só no celular"]),
      q("O lojista pode mandar a chave do Mercado Pago por mensagem?", "Não; ele cola direto no painel", ["Sim, no WhatsApp", "Sim, por e-mail", "Sim, no chat público"]),
    ],
    receita: () => [
      q("Como entra o plano anual na receita mensal?", "Dividido por 12", ["O valor inteiro no mês", "Não entra", "Dividido por 6"]),
      q("Cortesia conta como pagante?", "Não", ["Sim", "Só no Scale", "Só na Black"]),
      q("Sem o Mercado Pago da NextLevel conectado…", "Os planos não são cobrados", ["Tudo funciona igual", "A loja sai do ar", "O lojista paga em dobro"]),
    ],
    comissoes: () => [
      q("Do que depende o percentual de comissão?", "Do nível e do documento (CPF ou CNPJ)", ["Só do plano do lojista", "Do humor do dia", "Da cidade do parceiro"]),
      q("O cliente pediu estorno. E a comissão?", "Volta, inclusive por débito no saldo", ["Fica com o parceiro", "Dobra", "Some sem registro"]),
      q("Pagar comissão fora do sistema pode?", "Não", ["Sim", "Só em dinheiro", "Só para agências"]),
    ],
    "receber-assinatura": () => [
      q("O cliente pagou no Pix da chave da NextLevel. Como liberar a loja?", "Caixa → Receber assinatura, com Pix na chave", ["Esperar o checkout online", "Mudar a data na mão sem registrar", "Pedir para o cliente pagar de novo"]),
      q("Recebi menos que a tabela. O que acontece?", "É desconto e precisa de motivo", ["É recusado sempre", "Vira dívida do cliente", "Nada, passa direto"]),
      q("Estornar um recebimento faz o quê?", "Tira do caixa, cancela a fatura, desfaz a comissão e volta o período", ["Só apaga o lançamento", "Só avisa o cliente", "Nada"]),
    ],
    caixa: () => [
      q("Quem reabre um dia de caixa já fechado?", "Só o dono, com motivo", ["Qualquer pessoa da equipe", "O Financeiro, sem motivo", "Ninguém, nunca"]),
      q("Um plano foi pago pelo Mercado Pago. O que fazer no caixa?", "Nada: ele entra sozinho", ["Lançar à mão como dinheiro", "Lançar à mão como Pix", "Fazer uma sangria"]),
      q("No fechamento faltou dinheiro na gaveta. E agora?", "Fecha informando o motivo da diferença", ["Apaga um lançamento", "Não fecha nunca", "Lança uma entrada falsa"]),
    ],
    "beneficios-plano": () => [
      q("Quem pode editar os benefícios por plano?", "Comercial e Financeiro, com registro", ["Qualquer pessoa", "Só o lojista", "Ninguém"]),
      q("Mudou a tabela de benefícios. A página de planos…", "Muda junto", ["Precisa ser editada à mão", "Não muda", "Sai do ar"]),
      q("Quem já passou do limite do plano…", "Continua vendendo tudo; só não cadastra novos", ["Perde os produtos", "Paga multa", "Tem a loja bloqueada"]),
    ],
    texto: () => [
      q("Sempre que falar da taxa zero, lembrar que…", "O Mercado Pago cobra as dele", ["Não existe nenhuma taxa", "A NextLevel paga tudo", "Só vale na Black"]),
      q("Depoimento de cliente inventado pode?", "Nunca", ["Sim, se for bom", "Só no Instagram", "Só para parceiros"]),
      q("Recurso que ainda não existe aparece como…", "\"Em breve\"", ["Pronto", "Grátis", "Exclusivo"]),
    ],
    fotos: () => [
      q("Que fotos usamos?", "Fotos reais da equipe NextLevel", ["Banco de imagens genérico", "Fotos de concorrentes", "Qualquer foto bonita"]),
      q("Logo do Mercado Pago pode usar livremente?", "Só com o material oficial deles", ["Sim, sempre", "Sim, se for pequeno", "Sim, redesenhado"]),
      q("Faltou imagem. O que fazer?", "Pedir a foto real; nunca tapar com genérica", ["Usar qualquer foto", "Deixar a foto de outro site", "Gerar com logo falso"]),
    ],
  };
  return P[aulaId]?.() ?? [];
}

/** Correção no servidor: quantas certas, e se a aula fica concluída (todas certas). */
export function corrigir(perguntas: Pergunta[], respostas: number[]): { acertos: number; total: number; certas: boolean[]; concluida: boolean } {
  const certas = perguntas.map((p, i) => respostas[i] === p.certa);
  const acertos = certas.filter(Boolean).length;
  return { acertos, total: perguntas.length, certas, concluida: perguntas.length > 0 && acertos === perguntas.length };
}
