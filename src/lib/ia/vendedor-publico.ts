/**
 * Vendedor 24h da home da Commerce (D195). Motor guiado, sem IA: entende o assunto pela pergunta e responde com
 * dados reais do sistema (planos, oferta, integrações). Quando a IA estiver ligada no Master, a pergunta livre vai para
 * o modelo com os mesmos fatos. Nunca inventa preço, prazo ou resultado. Arquivo puro (servidor e tela).
 */
import { formatBRL } from "@/lib/money";

export type PlanoVenda = { key: string; name: string; monthlyCents: number | null; feeBps: number | null; quote: boolean };
export type FatosVenda = {
  marca: string;
  planos: PlanoVenda[];
  oferta: { trialDays: number; firstPeriodCents: number | null; feeHolidayMonths: number } | null;
  integracoes: { grupo: string; nomes: string[] }[];
  temasGratis: number;
  cadastro: string;
  /** Black NextLevel em andamento (D232): fim real e chamada da campanha. */
  black?: { fim: string; chamada: string } | null;
};
/** Frase da Black para o vendedor (mesmo fim da contagem do site). */
export const blackTxt = (f: Pick<FatosVenda, "black">) => {
  if (!f.black) return "";
  const fim = new Date(f.black.fim).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).replace(",", " às");
  return `\n\n**Black NextLevel até ${fim}:** ${f.black.chamada.charAt(0).toLowerCase()}${f.black.chamada.slice(1)}. Depois disso, o preço sobe.`;
};
export type Atalho = { id: string; rotulo: string };
export type Acao = { rotulo: string; href: string } | { rotulo: string; contato: true };
export type RespostaVenda = { texto: string; atalhos: Atalho[]; acoes: Acao[]; assunto: string };

export const FAIXAS_VENDA = [
  { id: "fx-0", rotulo: "Estou começando", cents: 0 },
  { id: "fx-3", rotulo: "Até R$ 3 mil por mês", cents: 300_000 },
  { id: "fx-15", rotulo: "De R$ 3 mil a R$ 15 mil", cents: 1_500_000 },
  { id: "fx-50", rotulo: "De R$ 15 mil a R$ 50 mil", cents: 5_000_000 },
  { id: "fx-100", rotulo: "Mais de R$ 50 mil", cents: 10_000_000 },
] as const;

export const ATALHOS_INICIO: Atalho[] = [
  { id: "plano", rotulo: "Qual plano é ideal para mim?" },
  { id: "preco", rotulo: "Quanto custa?" },
  { id: "integracoes", rotulo: "Integra com o que eu já uso?" },
  { id: "instagram", rotulo: "Já vendo no Instagram e WhatsApp" },
  { id: "migrar", rotulo: "Quero sair de outra plataforma" },
  { id: "pessoa", rotulo: "Falar com uma pessoa" },
];

const ASSUNTOS: { id: string; palavras: RegExp }[] = [
  { id: "pessoa", palavras: /\b(pessoa|humano|atendente|ligar|liga[çc][aã]o|whats ?app da equipe|falar com algu[eé]m|vendedor de verdade)\b/i },
  { id: "plano", palavras: /\b(qual plano|plano ideal|melhor plano|recomenda|indica|qual escolher)\b/i },
  { id: "preco", palavras: /\b(pre[çc]o|quanto custa|custa|valor|mensalidade|taxa|caro|barato|planos?|black|promo[çc][aã]o|desconto)\b/i },
  { id: "teste", palavras: /\b(gr[aá]tis|teste|testar|trial|sem pagar|fidelidade|cancelar)\b/i },
  { id: "pagamento", palavras: /\b(pix|cart[aã]o|mercado ?pago|recebo|receber|dinheiro|parcel)/i },
  { id: "frete", palavras: /\b(frete|envio|correios|melhor envio|superfrete|frenet|kangu|entrega|rastreio)\b/i },
  { id: "integracoes", palavras: /\b(integra|integra[çc][aã]o|google|meta|pixel|tiktok|pinterest|analytics|erp|tiny|omie|bling|chat)\b/i },
  { id: "instagram", palavras: /\b(instagram|insta|whats ?app|direct|redes sociais)\b/i },
  { id: "migrar", palavras: /\b(migrar|mudar|sair|trocar|wbuy|nuvemshop|shopify|tray|loja integrada|woocommerce|outra plataforma)\b/i },
  { id: "tema", palavras: /\b(tema|layout|visual|design|cara da (minha )?marca|personaliz)/i },
  { id: "dominio", palavras: /\b(dom[ií]nio|\.com|endere[çc]o pr[oó]prio)\b/i },
];

/** Assunto da pergunta livre (sem IA). */
export function assuntoDe(texto: string): string | null {
  return ASSUNTOS.find((a) => a.palavras.test(texto))?.id ?? null;
}

const pct = (bps: number | null) => `${((bps ?? 0) / 100).toString().replace(".", ",")}%`;
const pagos = (f: FatosVenda) => f.planos.filter((p) => !p.quote && p.monthlyCents !== null);
const custo = (p: PlanoVenda, vendas: number) => (p.monthlyCents ?? 0) + Math.round((vendas * (p.feeBps ?? 0)) / 10_000);
const taxaZero = (f: FatosVenda) => pagos(f).length > 0 && pagos(f).every((p) => !p.feeBps);
const ofertaTxt = (f: FatosVenda) => f.oferta ? ` Para começar: ${f.oferta.trialDays} dias grátis${f.oferta.firstPeriodCents !== null ? `, 1º mês por ${formatBRL(f.oferta.firstPeriodCents)}` : ""}${f.oferta.feeHolidayMonths > 0 && !taxaZero(f) ? ` e taxa zero nos primeiros ${f.oferta.feeHolidayMonths} meses` : ""}.` : "";
const TAXA_ZERO_TXT = "Taxa zero da plataforma sobre as vendas, com o checkout do Mercado Pago, nosso parceiro oficial: da NextLevel, você paga só a mensalidade. As taxas do Mercado Pago (Pix e cartão) são dele, como em qualquer plataforma.";
const criar = (f: FatosVenda, plano?: string): Acao => ({ rotulo: plano ? "Criar minha loja com este plano" : "Criar minha loja", href: plano ? `${f.cadastro}?plano=${plano}` : f.cadastro });
const contato: Acao = { rotulo: "Quero que a equipe me chame", contato: true };

/** O plano que sai mais em conta para um volume de vendas (mensalidade + taxa sobre a venda). */
export function recomendarPlano(f: FatosVenda, vendasCents: number) {
  const ps = pagos(f);
  if (!ps.length) return null;
  const opcoes = ps.map((p) => ({ plano: p, totalCents: custo(p, vendasCents) }));
  return { melhor: opcoes.reduce((a, b) => (b.totalCents < a.totalCents ? b : a)), opcoes };
}

/** Responde a um atalho ou a uma pergunta livre já classificada. */
export function responder(f: FatosVenda, assunto: string | null): RespostaVenda {
  const faixa = FAIXAS_VENDA.find((x) => x.id === assunto);
  if (faixa) {
    const r = recomendarPlano(f, faixa.cents);
    if (!r) return { assunto: "plano", texto: "Os planos estão sendo atualizados agora. A equipe te passa os valores em minutos.", atalhos: [], acoes: [contato] };
    if (taxaZero(f)) {
      // D220: com taxa zero, todo plano custa só a mensalidade; o Start atende qualquer volume e os outros somam o Maurício.
      const linhasZ = r.opcoes.map((o) => `• ${o.plano.name}: ${formatBRL(o.plano.monthlyCents ?? 0)}/mês`).join("\n");
      return { assunto: "plano", texto: `${TAXA_ZERO_TXT} Então, vendendo quanto for, o custo é o da mensalidade:\n\n${linhasZ}\n\nO **${r.melhor.plano.name}** já tem tudo para vender; os outros somam o Maurício escrevendo e analisando por você. Sem fidelidade.${ofertaTxt(f)}`, atalhos: [{ id: "integracoes", rotulo: "E as integrações?" }, { id: "pagamento", rotulo: "Como recebo as vendas?" }], acoes: [criar(f, r.melhor.plano.key), contato] };
    }
    const linhas = r.opcoes.map((o) => `• ${o.plano.name}: ${formatBRL(o.totalCents)}/mês (${formatBRL(o.plano.monthlyCents ?? 0)} + ${pct(o.plano.feeBps)} das vendas)`).join("\n");
    const base = faixa.cents === 0 ? "Para quem está começando" : `Vendendo ${faixa.rotulo.charAt(0).toLowerCase()}${faixa.rotulo.slice(1)}`;
    return { assunto: "plano", texto: `${base}, o que sai mais em conta é o **${r.melhor.plano.name}**: cerca de ${formatBRL(r.melhor.totalCents)} por mês, com a taxa incluída.\n\n${linhas}\n\nSem fidelidade: você troca de plano quando quiser.${ofertaTxt(f)}`, atalhos: [{ id: "integracoes", rotulo: "E as integrações?" }, { id: "pagamento", rotulo: "Como recebo as vendas?" }], acoes: [criar(f, r.melhor.plano.key), contato] };
  }
  switch (assunto) {
    case "plano":
      return { assunto, texto: taxaZero(f) ? `${TAXA_ZERO_TXT} Me diz quanto você vende por mês que eu te mostro quanto economiza.` : "Me diz quanto você vende por mês (ou espera vender) que eu calculo o plano que sai mais em conta, com a taxa incluída.", atalhos: FAIXAS_VENDA.map(({ id, rotulo }) => ({ id, rotulo })), acoes: [] };
    case "preco": {
      const ps = pagos(f);
      const linhas = ps.map((p) => taxaZero(f) ? `• ${p.name}: ${formatBRL(p.monthlyCents ?? 0)}/mês` : `• ${p.name}: ${formatBRL(p.monthlyCents ?? 0)}/mês + ${pct(p.feeBps)} sobre as vendas pagas`).join("\n");
      return { assunto, texto: `${linhas || "Os planos estão sendo atualizados."}\n\n${taxaZero(f) ? TAXA_ZERO_TXT : "Quanto mais você vende, menor a taxa."} Operações grandes têm o Enterprise, por proposta.${ofertaTxt(f)}${blackTxt(f)}`, atalhos: [{ id: "plano", rotulo: "Qual sai mais em conta para mim?" }, { id: "teste", rotulo: "Tem teste grátis?" }], acoes: [criar(f)] };
    }
    case "teste":
      return { assunto, texto: `${f.oferta ? `Sim: ${f.oferta.trialDays} dias grátis para montar e testar a loja.${ofertaTxt(f).replace(" Para começar:", "")}` : "Você monta a loja e só publica quando estiver pronta."} Não tem fidelidade: cancela quando quiser, direto no painel.`, atalhos: [{ id: "plano", rotulo: "Qual plano escolher?" }], acoes: [criar(f)] };
    case "pagamento":
      return { assunto, texto: `Você recebe pela sua própria conta Mercado Pago: Pix com confirmação automática e cartão em até 6x. o dinheiro cai direto para você${taxaZero(f) ? ", sem taxa da NextLevel sobre as vendas (o Mercado Pago é nosso parceiro oficial e cobra só as taxas dele de Pix e cartão); da NextLevel, você paga só a mensalidade" : "; a NextLevel cobra o plano e a taxa em fatura separada"}. Também dá para mandar link de pagamento pelo WhatsApp.`, atalhos: [{ id: "frete", rotulo: "E o frete?" }, { id: "preco", rotulo: "Quanto custa?" }], acoes: [criar(f)] };
    case "frete": {
      const fr = f.integracoes.find((g) => g.grupo === "frete");
      return { assunto, texto: `O frete é cotado por CEP no checkout${fr ? ` com ${fr.nomes.slice(0, 6).join(", ")}` : ""}. Você também cria regras próprias (frete grátis a partir de um valor, retirada na loja) e o cliente recebe o rastreio.`, atalhos: [{ id: "integracoes", rotulo: "Outras integrações" }], acoes: [{ rotulo: "Ver todas as integrações", href: "/integracoes" }, criar(f)] };
    }
    case "integracoes": {
      const total = f.integracoes.reduce((s, g) => s + g.nomes.length, 0);
      const linhas = f.integracoes.map((g) => `• ${g.nomes.slice(0, 4).join(", ")}${g.nomes.length > 4 ? "…" : ""}`).join("\n");
      return { assunto, texto: `São ${total} integrações prontas, ligadas no painel sem programar:\n${linhas}`, atalhos: [{ id: "pagamento", rotulo: "Como recebo?" }, { id: "migrar", rotulo: "Venho de outra plataforma" }], acoes: [{ rotulo: "Ver como cada uma funciona", href: "/integracoes" }, criar(f)] };
    }
    case "instagram":
      return { assunto, texto: "Perfeito: os pedidos do Instagram e do WhatsApp entram no mesmo painel da loja. Você manda o link de pagamento pelo WhatsApp, coloca o catálogo no Instagram e mede as vendas com o Pixel da Meta.", atalhos: [{ id: "plano", rotulo: "Qual plano para mim?" }, { id: "pagamento", rotulo: "Como recebo?" }], acoes: [criar(f)] };
    case "migrar":
      return { assunto, texto: "Dá para trazer os produtos por planilha e cadastrar os endereços antigos, para quem chega pelo Google cair no produto novo sem perder a posição. Se preferir, a nossa equipe faz a migração para você.", atalhos: [{ id: "integracoes", rotulo: "Integrações" }, { id: "pessoa", rotulo: "Quero ajuda da equipe" }], acoes: [criar(f), contato] };
    case "tema":
      return { assunto, texto: `Você começa com ${f.temasGratis} temas grátis e ajusta cores, fontes, logo e seções num editor visual, com prévia antes de publicar. Também há temas pagos por segmento, com instalação em um clique.`, atalhos: [{ id: "dominio", rotulo: "E o domínio?" }], acoes: [{ rotulo: "Ver os temas", href: "/temas" }, criar(f)] };
    case "dominio":
      return { assunto, texto: "O domínio próprio (suamarca.com.br) faz parte dos planos. Enquanto não liga o seu, a loja já funciona num endereço nosso.", atalhos: [{ id: "preco", rotulo: "Quanto custa?" }], acoes: [criar(f)] };
    case "pessoa":
      return { assunto, texto: "Claro. Deixa o seu nome e WhatsApp que a equipe da NextLevel te chama, em horário comercial, na nossa sede em São Paulo.", atalhos: [], acoes: [contato] };
    default:
      return { assunto: "inicio", texto: `Oi! Eu sou o Maurício, da ${f.marca}. Te ajudo a escolher o plano, entender as integrações e colocar a sua loja no ar. Por onde começamos?`, atalhos: ATALHOS_INICIO, acoes: [] };
  }
}

/** Resposta a texto livre sem IA: assunto conhecido ou um convite claro com os atalhos. */
export function responderTexto(f: FatosVenda, texto: string): RespostaVenda {
  const a = assuntoDe(texto);
  if (a) return responder(f, a);
  return { assunto: "nao-entendi", texto: "Ainda estou aprendendo a responder perguntas assim. Escolhe um dos assuntos abaixo ou deixa o seu contato que a equipe te responde.", atalhos: ATALHOS_INICIO.slice(0, 5), acoes: [contato] };
}

/** Fatos para o modelo (quando a IA estiver ligada): o mesmo conteúdo que o motor guiado usa, nada além. */
export function fatosEmTexto(f: FatosVenda): string {
  const planos = pagos(f).map((p) => `${p.name}: ${formatBRL(p.monthlyCents ?? 0)}/mês + ${pct(p.feeBps)} sobre vendas pagas`).join("; ");
  return [`Marca: ${f.marca}.`, `Planos: ${planos}. Enterprise por proposta.`, ofertaTxt(f).trim(), `Integrações: ${f.integracoes.map((g) => g.nomes.join(", ")).join("; ")}.`, `Temas grátis: ${f.temasGratis}.`, "Recebimento pela conta Mercado Pago do lojista (Pix e cartão até 6x). Sem fidelidade."].filter(Boolean).join("\n");
}
