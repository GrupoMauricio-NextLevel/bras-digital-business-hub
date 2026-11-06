/**
 * Guia do Programa de Parceiros nas páginas /parceiros (D253). Motor guiado, sem IA externa (offline): entende o assunto
 * e responde com os números reais das regras (regra única da D260: percentual por nível, garantia, saque). Nunca promete ganho.
 * Puro: mesmo formato de resposta do vendedor da home, para usar a mesma conversa e o mesmo CRM ao vivo do Master.
 */
import { formatBRL } from "@/lib/money";
import { BARREIRAS, CONSULTA_CONCORRENTES, ganhoNoMes, PERFIS, type PerfilCaptacao, type RegraPerfil } from "@/lib/finance/captacao-regras";
import { NIVEIS, recorrenteDoNivel } from "@/lib/finance/niveis-regras";
import type { Acao, Atalho, RespostaVenda } from "./vendedor-publico";

export type FatosParceiros = {
  marca: string;
  regras: Record<PerfilCaptacao, RegraPerfil>;
  plano: { nome: string; mensalCents: number } | null;
  atribuicaoDias: number;
  saqueMinimoCents: number;
  garantiaDias: number;
  cadastro: string;
};

const pct = (bps: number) => `${(bps / 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
const NOME: Record<PerfilCaptacao, string> = { indicacao: "Indicador", criador: "Criador", vendedor: "Vendedor", agencia: "Agência" };
const cadastrar = (f: FatosParceiros, perfil?: PerfilCaptacao): Acao => ({ rotulo: perfil ? `Quero ser ${NOME[perfil].toLowerCase()} parceiro` : "Quero ser parceiro", href: perfil ? `${f.cadastro}?perfil=${perfil}` : f.cadastro });
const contato: Acao = { rotulo: "Quero que a equipe me chame", contato: true };

export const ATALHOS_PARCEIROS: Atalho[] = [
  { id: "p-como", rotulo: "Como funciona o programa?" },
  { id: "p-ganho", rotulo: "Quanto eu ganho?" },
  { id: "p-perfil", rotulo: "Criador, vendedor ou agência?" },
  { id: "p-niveis", rotulo: "Como funcionam os níveis?" },
  { id: "p-simular", rotulo: "Simular meus ganhos" },
  { id: "p-receber", rotulo: "Como e quando eu recebo?" },
  { id: "p-custo", rotulo: "Quanto custa participar?" },
  { id: "pessoa", rotulo: "Falar com uma pessoa" },
];
export const SIMULACOES = [1, 3, 5, 10] as const;

const ASSUNTOS: { id: string; palavras: RegExp }[] = [
  { id: "pessoa", palavras: /\b(pessoa|humano|atendente|ligar|liga[çc][aã]o|falar com algu[eé]m|equipe)\b/i },
  { id: "p-simular", palavras: /\b(simul|calcul|quanto (d[aá]|daria|rende|renderia)|se eu indicar|por m[eê]s eu)/i },
  { id: "p-black", palavras: /\b(black|cyber|100 ?%|cem por cento)\b/i },
  { id: "p-concorrentes", palavras: /\b(nuvemshop|wbuy|tray|shopify|concorr|outros programas|comparar|compara)\b/i },
  { id: "p-niveis", palavras: /\b(n[ií]ve(l|is)|prata|ouro|diamante|elite|subir)\b/i },
  { id: "p-bonus", palavras: /\b(b[oô]nus|ativa[çc][aã]o|loja ativada|meta)\b/i },
  { id: "p-receber", palavras: /\b(receb|saque|sacar|pix|pagamento|pago|quando (cai|recebo)|dinheiro)\b/i },
  { id: "p-garantia", palavras: /\b(garantia|estorno|chargeback|cancel|desist)/i },
  { id: "p-custo", palavras: /\b(custa|custo|pagar para|gr[aá]tis|taxa de|mensalidade do parceiro|meta mensal|inativ)/i },
  { id: "p-atribuicao", palavras: /\b(link|cupom|atribu|cookie|ligad[ao] a mim|outro parceiro|cr[eé]dito)\b/i },
  { id: "p-agencia", palavras: /\b(ag[eê]ncia|selo|social media|consultoria|meus clientes)\b/i },
  { id: "p-vendedor", palavras: /\b(vendedor|representante|porta em porta|visita|rua|br[aá]s)\b/i },
  { id: "p-criador", palavras: /\b(criador|influenc|seguidor|conte[uú]do|instagram|tiktok|youtube|audi[eê]ncia)\b/i },
  { id: "p-perfil", palavras: /\b(qual perfil|diferen[çc]a|tipo de parceiro|perfis?)\b/i },
  { id: "p-vender", palavras: /\b(vender|argumento|convenc|por que|vantage|taxa zero|concorr|f[aá]cil)/i },
  { id: "p-regras", palavras: /\b(regra|proibid|n[aã]o pode|spam|eu mesmo|minha pr[oó]pria loja|autoindica|termos?)\b/i },
  { id: "p-painel", palavras: /\b(painel|escrit[oó]rio|ferramenta|crm|qr|material)\b/i },
  { id: "p-cadastro", palavras: /\b(cadastr|inscrev|entrar no programa|como (come[çc]o|participo)|cnpj|cpf|requisito)/i },
  { id: "p-ganho", palavras: /\b(ganh|comiss|quanto|porcentagem|percentual|recorr)/i },
  { id: "p-como", palavras: /\b(como funciona|o que [eé]|programa|explica)\b/i },
];

export function assuntoParceiro(texto: string): string | null {
  return ASSUNTOS.find((a) => a.palavras.test(texto))?.id ?? null;
}

function exemplo(f: FatosParceiros) {
  if (!f.plano) return "";
  return `Ex.: loja no ${f.plano.nome} (${formatBRL(f.plano.mensalCents)}/mês) = ${formatBRL(Math.round((f.plano.mensalCents * recorrenteDoNivel(f.regras.criador.recorrenteBps, "INICIAL")) / 10_000))} por mês, todo mês.`;
}

export function responderParceiro(f: FatosParceiros, assunto: string | null): RespostaVenda {
  const sim = /^sim-(\d+)$/.exec(assunto ?? "");
  if (sim && f.plano) {
    const n = Number(sim[1]);
    const r = f.regras.criador, mensal = f.plano.mensalCents;
    const linhas = [1, 12, 24].map((m) => { const g = ganhoNoMes(r, n, mensal, m); return `• **${m}º mês:** ${formatBRL(g.cents)} (${g.carteira} clientes, ${pct(g.recBps)})`; }).join("\n");
    return { assunto: "p-simular", texto: `Indicando ${n} loja${n === 1 ? "" : "s"} por mês no ${f.plano.nome}, sem nenhuma cancelar (a mesma conta para qualquer perfil):\n\n${linhas}\n\nÉ uma estimativa pelas regras de hoje, não uma promessa: cancelamentos reduzem o valor.`, atalhos: [{ id: "p-niveis", rotulo: "Como funcionam os níveis?" }, { id: "p-receber", rotulo: "Como eu recebo?" }], acoes: [{ rotulo: "Abrir o simulador completo", href: "/parceiros#simulador" }, cadastrar(f)] };
  }
  const c = f.regras.criador, v = f.regras.vendedor, a = f.regras.agencia;
  switch (assunto) {
    case "p-como":
      return { assunto, texto: `É simples:\n\n1. Você se cadastra grátis e recebe o seu link, cupom e QR code na hora.\n2. Indica a ${f.marca} para lojistas: no Instagram, no WhatsApp, na rua ou para os clientes da sua agência.\n3. Você ganha uma parte de **toda mensalidade que a loja pagar, desde a 1ª, enquanto o cliente ficar**.\n4. O dinheiro fica ${f.garantiaDias} dias em garantia e depois você saca por Pix.\n\nQuanto mais clientes ativos, maior o seu nível e a sua porcentagem.`, atalhos: [{ id: "p-ganho", rotulo: "Quanto eu ganho?" }, { id: "p-perfil", rotulo: "Qual perfil é o meu?" }, { id: "p-simular", rotulo: "Simular meus ganhos" }], acoes: [cadastrar(f)] };
    case "p-ganho":
      return { assunto, texto: `São duas frentes:\n\n• **Parceiro com CNPJ** (criador, vendedor, agência): ${NIVEIS.map((n) => `${pct(recorrenteDoNivel(c.recorrenteBps, n.tier))}${n.minimo ? ` com ${n.minimo}+` : " desde o 1º cliente"}`).join(", ")}\n• **Indicação pelo CPF** (qualquer pessoa): ${NIVEIS.map((n) => `${pct(recorrenteDoNivel(c.recorrenteBps, n.tier, undefined, true))}${n.minimo ? ` com ${n.minimo}+` : " desde o 1º cliente"}`).join(", ")}\n\nSobre **toda mensalidade paga, desde a 1ª, enquanto o cliente ficar**. Saque por Pix, sem anexar nota fiscal. ${exemplo(f)}`, atalhos: [{ id: "p-simular", rotulo: "Simular meus ganhos" }, { id: "p-concorrentes", rotulo: "Comparado com outros programas?" }], acoes: [cadastrar(f)] };
    case "p-perfil":
      return { assunto, texto: `Escolha pelo seu documento e pelo jeito que você trabalha:\n\n• **Indicação pelo CPF:** ${PERFIS.indicacao.quem}\n• **Criador (CNPJ):** ${PERFIS.criador.quem}\n• **Vendedor (CNPJ):** ${PERFIS.vendedor.quem}\n• **Agência (CNPJ):** ${PERFIS.agencia.quem} Agências têm benefícios exclusivos, apresentados pela equipe.`, atalhos: [{ id: "p-criador", rotulo: "Sou criador" }, { id: "p-vendedor", rotulo: "Sou vendedor" }, { id: "p-agencia", rotulo: "Sou agência" }], acoes: [] };
    case "p-niveis": {
      const linhas = NIVEIS.map((n) => `• **${n.nome}** (${n.minimo ? `${n.minimo}+ clientes ativos` : "desde o 1º cliente"}): ${pct(recorrenteDoNivel(c.recorrenteBps, n.tier))} com CNPJ, ${pct(recorrenteDoNivel(c.recorrenteBps, n.tier, undefined, true))} pelo CPF`).join("\n");
      return { assunto, texto: `O nível conta os seus clientes pagantes ativos:\n\n${linhas}\n\nO nível sobe na hora e vale para toda a carteira. Só desce depois de 2 meses seguidos abaixo do mínimo.`, atalhos: [{ id: "p-simular", rotulo: "Simular meus ganhos" }], acoes: [{ rotulo: "Ver a escada de níveis", href: "/parceiros#escada-t" }, cadastrar(f)] };
    }
    case "p-simular":
      return { assunto, texto: f.plano ? `Quantas lojas você acha que indica por mês? Eu calculo com o plano ${f.plano.nome}.` : "O simulador da página calcula pelos planos atuais.", atalhos: SIMULACOES.map((n) => ({ id: `sim-${n}`, rotulo: `${n} loja${n === 1 ? "" : "s"} por mês` })), acoes: [] };
    case "p-bonus":
      return { assunto, texto: "Não tem bônus avulso: a regra é uma só e transparente. Quanto mais clientes ativos, maior o percentual de **toda** a carteira (20%, 24% e 28%). O desafio do mês vale destaque no ranking, não dinheiro.", atalhos: [{ id: "p-niveis", rotulo: "Como funcionam os níveis?" }], acoes: [cadastrar(f)] };
    case "p-black":
      return { assunto, texto: "A regra do parceiro é a mesma o ano todo, sem campanha que muda a conta: o percentual do seu nível sobre toda mensalidade, enquanto o cliente ficar. A Black NextLevel é para os lojistas (e ajuda você a fechar mais lojas).", atalhos: [{ id: "p-ganho", rotulo: "Quanto eu ganho?" }], acoes: [cadastrar(f)] };
    case "p-concorrentes":
      return { assunto, texto: `O que os outros programas exigem (sites oficiais, ${CONSULTA_CONCORRENTES}):\n\n${BARREIRAS.map((b) => `• **${b.nome}:** ${b.barreira}`).join("\n")}\n\nAqui: CPF ou CNPJ, saque por Pix sem anexar nota, e comissão de toda mensalidade enquanto o cliente ficar.`, atalhos: [{ id: "p-simular", rotulo: "Simular meus ganhos" }], acoes: [{ rotulo: "Abrir a comparação", href: "/parceiros#comparar" }, cadastrar(f)] };
    case "p-receber":
      return { assunto, texto: `Cada comissão fica **${f.garantiaDias} dias em garantia** (para cobrir estornos) e depois vai para o saldo disponível. Você pede o saque no painel a partir de ${formatBRL(f.saqueMinimoCents)}, e a equipe paga por **Pix**, sempre para o mesmo CPF ou CNPJ do cadastro. O extrato mostra cada lançamento.`, atalhos: [{ id: "p-garantia", rotulo: "E se o cliente cancelar?" }, { id: "p-custo", rotulo: "Tem algum custo?" }], acoes: [cadastrar(f)] };
    case "p-garantia":
      return { assunto, texto: "Se o cliente pedir estorno durante a garantia, aquela comissão é anulada. Se já estava disponível, entra um débito igual, compensado nas próximas comissões. Se o cliente cancelar o plano, você para de receber a recorrência dele a partir dali; o que já foi pago é seu.", atalhos: [{ id: "p-receber", rotulo: "Como eu recebo?" }], acoes: [] };
    case "p-custo":
      return { assunto, texto: "Participar é **grátis**: não tem mensalidade de parceiro, meta mensal nem taxa de manutenção. O cadastro só fica inativo depois de 6 meses sem nenhum cliente ativo e sem nenhuma venda. Enquanto você tiver cliente pagando, continua ativo e recebendo.", atalhos: [{ id: "p-cadastro", rotulo: "Como me cadastro?" }], acoes: [cadastrar(f)] };
    case "p-atribuicao":
      return { assunto, texto: `A loja fica ligada a você de três jeitos:\n\n• **Link:** quem se cadastra em até ${f.atribuicaoDias} dias depois de clicar.\n• **Cupom de 7 dias:** vale mais que qualquer link; o cliente testa sem cartão.\n• **CRM:** contato que você registrou no seu painel.\n\nDepois de criada, a loja não muda de parceiro.`, atalhos: [{ id: "p-painel", rotulo: "O que tem no painel?" }, { id: "p-regras", rotulo: "O que não pode?" }], acoes: [cadastrar(f)] };
    case "p-agencia":
      return { assunto, texto: `Agência é parceira com CNPJ: **${pct(a.recorrenteBps)} de toda mensalidade desde o 1º cliente**, 24% com 10 e 28% com 25 clientes ativos, e **benefícios exclusivos para agências**, que a nossa equipe apresenta depois do cadastro. Traga a sua carteira: a migração já vem com desconto no Pro e inclusa no Scale.`, atalhos: [{ id: "p-vender", rotulo: "Como convenço meus clientes?" }, { id: "p-niveis", rotulo: "E os níveis?" }], acoes: [cadastrar(f, "agencia")] };
    case "p-vendedor":
      return { assunto, texto: `Vendedor ganha como todo parceiro: **${pct(v.recorrenteBps)} de toda mensalidade desde o 1º cliente**, 24% com 10 e 28% com 25 clientes ativos. Dá para criar a conta do lojista na hora da visita, pelo QR code ou pelo seu cupom: a loja já nasce ligada a você. O painel tem CRM para anotar cada visita.`, atalhos: [{ id: "p-vender", rotulo: "O que eu falo para o lojista?" }], acoes: [cadastrar(f, "vendedor")] };
    case "p-criador":
      return { assunto, texto: `Criador ganha como todo parceiro: **${pct(c.recorrenteBps)} de toda mensalidade desde o 1º cliente**, 24% com 10 e 28% com 25 clientes ativos, enquanto o cliente ficar. Você usa um link por rede (para saber de onde veio cada cliente) e um cupom fácil de falar no vídeo. No painel, o Maurício traz um plano de conteúdo de 4 semanas pronto. Use #publi nos conteúdos de parceria.`, atalhos: [{ id: "p-vender", rotulo: "O que falar no conteúdo?" }, { id: "p-niveis", rotulo: "E os níveis?" }], acoes: [cadastrar(f, "criador")] };
    case "p-vender":
      return { assunto, texto: `Os argumentos que mais convencem o lojista:\n\n• **Taxa zero da plataforma** sobre as vendas, com o checkout do Mercado Pago: ele paga só a mensalidade (as taxas do Mercado Pago são do Mercado Pago).\n• **Custo total mais vantajoso**, com o comparativo aberto no site (data e fonte de cada concorrente).\n• **Feita para o atacado:** grade e peça avulsa no mesmo produto, preço por quantidade e pedido mínimo.\n• **Loja pronta rápido** no tema grátis, e **teste sem cartão**, sem fidelidade.\n• **Equipe no Brás.**`, atalhos: [{ id: "p-perfil", rotulo: "Qual perfil é o meu?" }], acoes: [{ rotulo: "Ver o comparativo", href: "/comparativo" }, cadastrar(f)] };
    case "p-regras":
      return { assunto, texto: "Para manter a comissão:\n\n• Indicar a si mesmo (mesmo CPF, CNPJ ou e-mail) não conta.\n• Não use a marca NextLevel como se fosse a empresa (perfil, anúncio ou domínio com o nosso nome).\n• Não prometa faturamento, prazo ou desconto que não estão no site.\n• Nada de spam ou lista comprada.\n\nOs termos completos estão na página do programa.", atalhos: [{ id: "p-atribuicao", rotulo: "Quando a loja fica comigo?" }], acoes: [{ rotulo: "Ler os termos", href: "/parceiros/termos" }] };
    case "p-painel":
      return { assunto, texto: "No painel do parceiro você tem: link e QR code, links por campanha com cliques, cupons de 7 dias, CRM dos seus contatos com diagnóstico e pedido de proposta, catálogo comercial, indicados com a situação de cada loja, financeiro com saque por Pix, o desafio do mês e o Maurício, que guia o seu dia a dia passo a passo.", atalhos: [{ id: "p-cadastro", rotulo: "Como me cadastro?" }], acoes: [cadastrar(f)] };
    case "p-cadastro":
      return { assunto, texto: "O cadastro é grátis e tem 4 passos: perfil (criador, vendedor ou agência), seus dados (nome, e-mail, CPF ou CNPJ e WhatsApp), um pouco sobre você (região e onde divulga) e o aceite dos termos. Pessoas físicas e empresas podem participar. O link sai na hora.", atalhos: [], acoes: [cadastrar(f)] };
    case "pessoa":
      return { assunto, texto: "Claro. Deixa o seu nome e WhatsApp que a equipe de parceiros da NextLevel te chama, em horário comercial.", atalhos: [], acoes: [contato] };
    default:
      return { assunto: "inicio", texto: `Oi! Eu sou o Maurício, guia do Programa de Parceiros da ${f.marca}. Te explico como funciona, quanto dá para ganhar, os níveis e como receber. Por onde começamos?`, atalhos: ATALHOS_PARCEIROS, acoes: [] };
  }
}

export function responderTextoParceiro(f: FatosParceiros, texto: string): RespostaVenda {
  const n = /\b(\d{1,2})\s*(lojas?|clientes?|indica)/i.exec(texto);
  if (n && Number(n[1]) > 0) return responderParceiro(f, `sim-${Math.min(30, Number(n[1]))}`);
  const a = assuntoParceiro(texto);
  if (a) return responderParceiro(f, a);
  return { assunto: "nao-entendi", texto: "Essa eu ainda não sei responder. Escolhe um dos assuntos abaixo ou deixa o seu contato que a equipe de parceiros te responde.", atalhos: ATALHOS_PARCEIROS, acoes: [contato] };
}
