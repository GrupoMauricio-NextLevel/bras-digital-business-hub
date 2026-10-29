import { formatBRL } from "@/lib/money";

/**
 * "Precisa de você agora" das telas do lojista (D212): uma regra pura por tela, todas no mesmo formato, para o bloco
 * único `PrecisaDeVoce`. Pedidos (D208) e Produtos (D211) têm as regras deles; aqui ficam Financeiro, Minha loja,
 * Cupons, Avaliações e Campanhas. Ordem: vermelho, amarelo, azul.
 */
export type Tom = "danger" | "warning" | "info";
export type ItemAgora = { id: string; titulo: string; detalhe: string; tom: Tom; href?: string; acao?: string };

const PESO: Record<Tom, number> = { danger: 0, warning: 1, info: 2 };
export const ordenar = (l: ItemAgora[]) => [...l].sort((a, b) => PESO[a.tom] - PESO[b.tom]);
const DIA = 86_400_000;
const dias = (ate: string, agora: Date) => Math.ceil((new Date(ate).getTime() - agora.getTime()) / DIA);

type Fatura = { id: string; description: string; amountCents: number; dueDate: string; status: string };
type Pronto = { key: string; ok: boolean; blocking: boolean; label: string; detail: string; fixHref: string };

/** Financeiro: pagamento das vendas, faturas e plano com a NextLevel. */
export function financeiroAgora(e: { faturas: Fatura[]; assinatura: { status: string; trialEndsAt: string | null } | null; pagamento: Pronto | undefined; aReceberCents: number; aReceberPedidos: number }, agora = new Date()): ItemAgora[] {
  const l: ItemAgora[] = [];
  if (e.pagamento && !e.pagamento.ok) l.push({ id: "pagamento", titulo: "Conecte o Mercado Pago para receber", detalhe: e.pagamento.detail, tom: "danger", href: e.pagamento.fixHref, acao: "Conectar" });
  for (const f of e.faturas.filter((x) => x.amountCents > 0 && (x.status === "OPEN" || x.status === "OVERDUE"))) {
    const vencida = f.status === "OVERDUE";
    l.push({ id: `fatura-${f.id}`, titulo: vencida ? "Fatura vencida com a NextLevel" : "Fatura em aberto com a NextLevel", detalhe: `${f.description} · ${formatBRL(f.amountCents)}`, tom: vencida ? "danger" : "warning", href: "#faturas", acao: "Pagar" });
  }
  const s = e.assinatura;
  if (s && ["past_due", "suspended"].includes(s.status)) l.push({ id: "plano", titulo: s.status === "suspended" ? "Plano suspenso" : "Plano em atraso", detalhe: "Pague a mensalidade para a loja continuar vendendo.", tom: "danger", href: "#faturas", acao: "Regularizar" });
  else if (s?.status === "trial" && s.trialEndsAt) {
    const d = dias(s.trialEndsAt, agora);
    if (d <= 5) l.push({ id: "teste", titulo: d <= 0 ? "O teste grátis terminou" : `O teste grátis termina em ${d} dia(s)`, detalhe: "Escolha o plano para não parar de vender.", tom: d <= 2 ? "danger" : "warning", href: "#evolucao", acao: "Escolher plano" });
  }
  if (e.aReceberPedidos) l.push({ id: "receber", titulo: `${formatBRL(e.aReceberCents)} a receber`, detalhe: `${e.aReceberPedidos} pedido(s) ainda sem pagamento confirmado.`, tom: "info", href: "/merchant/orders?ver=atencao", acao: "Ver pedidos" });
  return ordenar(l);
}

/** Minha loja: o que falta para vender (bloqueia = vermelho) e o que dá confiança (amarelo). */
export function lojaVirtualAgora(itens: Pronto[]): ItemAgora[] {
  return ordenar(itens.filter((i) => !i.ok).map((i) => ({ id: i.key, titulo: i.label, detalhe: i.detail, tom: i.blocking ? "danger" : "warning", href: i.fixHref, acao: "Resolver" })));
}

/** Cupons: vencendo, vencidos ainda ligados e esgotados. */
export function cuponsAgora(cupons: { id: string; code: string; active: boolean; expiresAt: string | null; maxRedemptions: number | null; redemptions: number }[], agora = new Date()): ItemAgora[] {
  const l: ItemAgora[] = [];
  for (const c of cupons.filter((x) => x.active)) {
    if (c.maxRedemptions && c.redemptions >= c.maxRedemptions) { l.push({ id: c.id, titulo: `Cupom ${c.code} esgotado`, detalhe: `Usado ${c.redemptions} de ${c.maxRedemptions} vezes: aumente o limite ou crie outro.`, tom: "warning" }); continue; }
    if (!c.expiresAt) continue;
    const d = dias(c.expiresAt, agora);
    if (d <= 0) l.push({ id: c.id, titulo: `Cupom ${c.code} venceu`, detalhe: "Ainda está ligado, mas não vale mais no carrinho. Desligue ou mude a validade.", tom: "warning" });
    else if (d <= 7) l.push({ id: c.id, titulo: `Cupom ${c.code} vence em ${d} dia(s)`, detalhe: "Divulgue agora ou estenda a validade.", tom: "info" });
  }
  return ordenar(l);
}

/** Avaliações: esperando aprovação (nota baixa primeiro, para responder antes). */
export function avaliacoesAgora(av: { id: string; product: string; author: string; rating: number; status: string }[]): ItemAgora[] {
  return ordenar(av.filter((a) => a.status === "PENDING").map((a) => ({ id: a.id, titulo: `${"★".repeat(a.rating)}${"☆".repeat(5 - a.rating)} ${a.author} avaliou ${a.product}`, detalhe: a.rating <= 2 ? "Nota baixa: leia com atenção e fale com o cliente antes de decidir." : "Aprove para aparecer na sua loja.", tom: a.rating <= 2 ? "danger" : "warning" })));
}

/** Campanhas: faixa acabando e loja sem nenhuma faixa no ar. */
export function campanhasAgora(c: { id: string; text: string; startsAt: string; endsAt: string }[], agora = new Date()): ItemAgora[] {
  const iso = agora.toISOString();
  const noAr = c.filter((x) => x.startsAt <= iso && x.endsAt > iso);
  const l: ItemAgora[] = noAr.filter((x) => new Date(x.endsAt).getTime() - agora.getTime() <= DIA).map((x) => ({ id: x.id, titulo: "Faixa termina em menos de 24 h", detalhe: x.text, tom: "warning" as Tom }));
  if (!noAr.length) l.push({ id: "nenhuma", titulo: "Nenhuma faixa no ar", detalhe: "Uma faixa no topo da loja avisa promoção, frete grátis ou lançamento. Crie a primeira abaixo.", tom: "info" });
  return ordenar(l);
}
