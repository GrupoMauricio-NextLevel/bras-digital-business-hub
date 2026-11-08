/**
 * Executivos de venda (CX3, D273). Puro: prazo de prestação de contas em dias úteis, código e texto do recibo.
 */
import { dataSP, limitesDoDia, somarDias } from "./caixa-regras";

/** Prazo para entregar o dinheiro (decisão do dono: 2 dias úteis). Feriados não entram na conta. */
export const DIAS_UTEIS_PARA_ENTREGAR = 2;

/** Fim do N-ésimo dia útil depois do recebimento (sábado e domingo não contam), no fuso de São Paulo. */
export function prazoDeEntrega(recebidoEm: Date, diasUteis = DIAS_UTEIS_PARA_ENTREGAR): Date {
  let d = dataSP(recebidoEm), n = 0;
  while (n < diasUteis) {
    d = somarDias(d, 1);
    const dow = new Date(`${d}T12:00:00Z`).getUTCDay();
    if (dow !== 0 && dow !== 6) n++;
  }
  return limitesDoDia(d).fim;
}

export const atrasado = (prazoAte: string | Date, agora: Date) => new Date(prazoAte).getTime() < agora.getTime();

const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function codigoDeRecibo(aleatorio: () => number = Math.random): string {
  return `REC-${Array.from({ length: 6 }, () => ALFABETO[Math.floor(aleatorio() * ALFABETO.length)]).join("")}`;
}

const dataHora = (d: Date) => new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }).format(d);
const data = (d: Date) => new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "America/Sao_Paulo" }).format(d);

/** Texto do recibo enviado ao lojista pelo WhatsApp. */
export function textoDoRecibo(r: { codigo: string; loja: string; plano: string; valor: string; meio: "DINHEIRO" | "MAQUININHA_VENDEDOR"; executivo: string; quando: Date; pagoAte: Date | null }) {
  return [
    `Recibo NextLevel ${r.codigo}`,
    `Loja: ${r.loja}`,
    `Plano: ${r.plano}`,
    `Valor: ${r.valor} (${r.meio === "DINHEIRO" ? "dinheiro" : "maquininha"})`,
    `Recebido por: ${r.executivo}, executivo NextLevel, em ${dataHora(r.quando)}`,
    r.pagoAte ? `Sua loja está liberada até ${data(r.pagoAte)}.` : "Sua loja está liberada.",
    "Dúvidas: fale com a NextLevel pelo WhatsApp.",
  ].join("\n");
}

/** Link do WhatsApp com o recibo pronto (para o número da loja, se houver). */
export function linkDoRecibo(texto: string, whatsapp: string | null | undefined) {
  const d = (whatsapp ?? "").replace(/\D/g, "");
  const numero = d ? (d.length <= 11 ? `55${d}` : d) : "";
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
}

/** Prazo legível: o último dia para entregar ("ter., 15/12"), já que o prazo vence à meia-noite do dia seguinte. */
export function diaDoPrazo(prazoAte: string | Date) {
  const ultimo = new Date(new Date(prazoAte).getTime() - 60_000);
  return new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit", timeZone: "America/Sao_Paulo" }).format(ultimo);
}

// ---------------------------------------------------------------------------------------------------------------------
// Painel do executivo no celular (CX4 + BG3, D274)
// ---------------------------------------------------------------------------------------------------------------------
export const RESULTADOS_DA_VISITA = {
  INTERESSADO: "Gostou, vai cadastrar",
  PENSAR: "Pediu para pensar",
  NAO_QUIS: "Não quis agora",
  CADASTROU: "Cadastrou a loja",
  VENDEU: "Fechou a venda",
} as const;
export type ResultadoDaVisita = keyof typeof RESULTADOS_DA_VISITA;

/** Saudação pela hora de São Paulo. */
export function saudacao(now = new Date()) {
  const h = Number(new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", hourCycle: "h23", timeZone: "America/Sao_Paulo" }).format(now));
  return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
}

/** Meta da semana em lojas pagas: a definida pelo dono ou a primeira faixa da campanha da rua (padrão 3). */
export function metaDaSemana(metaDefinida: number | null | undefined, primeiraFaixa: number | null | undefined, feitas: number) {
  const meta = Math.max(1, metaDefinida ?? primeiraFaixa ?? 3);
  return { meta, feitas, falta: Math.max(0, meta - feitas), pct: Math.min(100, Math.round((feitas / meta) * 100)), batida: feitas >= meta };
}

export type ItemDaAgenda = { tipo: "RETORNO" | "TESTE_ACABANDO"; quando: string; titulo: string; detalhe: string; atrasado: boolean; visitaId?: string; whatsapp?: string | null };

/**
 * Agenda do executivo: retornos combinados (os vencidos primeiro) e testes das lojas dele que acabam nos próximos 7 dias
 * (avisar o lojista antes de a loja parar). `hoje` em AAAA-MM-DD (São Paulo).
 */
export function montarAgenda(
  hoje: string,
  retornos: { id: string; loja: string; contato: string | null; whatsapp: string | null; retornoEm: string; resultado: ResultadoDaVisita }[],
  testes: { loja: string; testeAte: string | null; pagoAte: string | null }[],
): ItemDaAgenda[] {
  const limite = new Date(`${hoje}T12:00:00-03:00`).getTime() + 7 * 86_400_000;
  const itens: ItemDaAgenda[] = retornos.map((r) => ({ tipo: "RETORNO", quando: r.retornoEm, titulo: `Voltar em ${r.loja}`, detalhe: `${r.contato ? `${r.contato} · ` : ""}${RESULTADOS_DA_VISITA[r.resultado].toLowerCase()}`, atrasado: r.retornoEm < hoje, visitaId: r.id, whatsapp: r.whatsapp }));
  for (const t of testes) {
    if (!t.testeAte || t.pagoAte) continue;
    const fim = new Date(t.testeAte).getTime();
    const dia = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date(t.testeAte));
    if (dia < hoje || fim > limite) continue;
    itens.push({ tipo: "TESTE_ACABANDO", quando: dia, titulo: `Teste de ${t.loja} acaba`, detalhe: "Ligue antes de a loja parar e feche o plano", atrasado: false });
  }
  return itens.sort((a, b) => a.quando.localeCompare(b.quando));
}

/** Argumentos de bolso (resumo da aula Comercial: venda direta). Só o que é verdade no produto; sem promessa de ganho. */
export function argumentosDeBolso(aPartirCents: number, preco: (c: number) => string) {
  return [
    { titulo: "Taxa zero da plataforma", texto: "Nas vendas pelo Mercado Pago a NextLevel não cobra porcentagem. O lojista paga só a mensalidade (e a tarifa do próprio Mercado Pago)." },
    { titulo: `A partir de ${preco(aPartirCents)} por mês`, texto: "Plano mensal sem fidelidade. No anual o lojista paga menos por mês." },
    { titulo: "Loja pronta no mesmo dia", texto: "Temas grátis já montados, domínio próprio e checkout. Você cadastra com ele na hora, pelo celular." },
    { titulo: "Atacado e varejo juntos", texto: "Preço de atacado por quantidade, grade por modelo e pedido mínimo: feito para o Brás." },
    { titulo: "\"Vou pensar\"", texto: "Marque o retorno aqui no painel e mande a demonstração pelo WhatsApp. Volte no dia combinado." },
    { titulo: "\"Já vendo no Instagram\"", texto: "A loja vira o link da bio: o cliente escolhe, paga e o pedido chega organizado, sem conversa perdida." },
    { titulo: "\"É caro\"", texto: "Compare com o comparativo público do site: mostra as taxas de cada plataforma com a fonte. Sem porcentagem por venda, a conta fecha mais rápido." },
  ];
}
