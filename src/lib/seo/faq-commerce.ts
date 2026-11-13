import { formatBRL } from "@/lib/money";

/**
 * Perguntas frequentes públicas da NextLevel Commerce (D293). Arquivo puro: todo número vem dos fatos do sistema
 * (planos e oferta do catálogo do Master, benefícios por plano, limites do atacado), nunca escrito à mão. As mesmas
 * perguntas viram o `FAQPage` da página, só com o que está visível.
 */
export type FatosFaq = {
  planos: { nome: string; mensalCents: number | null; taxaBps: number | null; suporte: string; migracao: string; faixasAtacado: number; produtos: number | null }[];
  diasDeTeste: number | null;
};
export type PerguntaFaq = { q: string; a: string };

const lista = (itens: string[]) => (itens.length <= 1 ? itens.join("") : `${itens.slice(0, -1).join(", ")} e ${itens.at(-1)}`);

export function faqCommerce(f: FatosFaq): PerguntaFaq[] {
  const pagos = f.planos.filter((p) => p.mensalCents !== null && p.mensalCents > 0);
  const taxaZero = pagos.length > 0 && pagos.every((p) => !p.taxaBps);
  const nomes = lista(f.planos.map((p) => p.nome));
  const menor = pagos.length ? pagos.reduce((a, b) => (a.mensalCents! <= b.mensalCents! ? a : b)) : null;
  const precos = lista(pagos.map((p) => `${p.nome} ${formatBRL(p.mensalCents!)}`));
  const faixas = [...new Set(f.planos.map((p) => p.faixasAtacado))].sort((a, b) => a - b);
  const out: PerguntaFaq[] = [
    { q: "O que é a NextLevel Commerce?", a: `É a plataforma de lojas virtuais da NextLevel, nascida no Brás (São Paulo), para quem vende no varejo e no atacado. Você monta a loja com um tema do seu nicho, recebe por Pix e cartão e acompanha pedidos, estoque e frete num painel só.${taxaZero ? " Com o Mercado Pago, a plataforma não cobra tarifa sobre as vendas." : ""}` },
    ...(menor ? [{ q: "Quanto custa?", a: `Os planos são ${nomes}. Mensalidade de hoje: ${precos}${pagos.length > 1 ? ", respectivamente" : ""}. No plano anual sai mais barato por mês. Os valores atualizados estão na página de planos.` }] : []),
    ...(f.diasDeTeste ? [{ q: "Posso testar antes de pagar?", a: `Sim. Você tem ${f.diasDeTeste} dias grátis para montar e testar a loja. Não tem fidelidade: dá para cancelar quando quiser, direto no painel.` }] : []),
    ...(taxaZero ? [{ q: "A plataforma cobra taxa sobre as minhas vendas?", a: "Não, quando você usa o Mercado Pago, que é o nosso parceiro oficial: da NextLevel você paga só a mensalidade. As taxas do Mercado Pago (Pix e cartão) são dele, como em qualquer plataforma." }] : []),
    { q: "Dá para vender no atacado e no varejo na mesma loja?", a: `Sim, em todos os planos. A loja tem grade, preço por quantidade${faixas.length ? ` (de ${faixas[0]} a ${faixas.at(-1)} faixas de preço, conforme o plano)` : ""}, pedido mínimo e regras de mix. Os planos maiores liberam mais grades por produto e venda por pacote.` },
    { q: "Como recebo dos clientes?", a: "Pelo Mercado Pago, com Pix e cartão. O pagamento é conferido automaticamente na conta do Mercado Pago antes de o pedido ser liberado." },
    { q: "Como funciona o frete?", a: "A loja calcula o frete na hora pelo Melhor Envio, pela Frenet ou pelos Correios com contrato. O cliente vê o prazo e o valor antes de pagar." },
    { q: "Posso usar o meu domínio próprio?", a: "Sim, em todos os planos. Você informa o domínio no painel, o painel mostra o que cadastrar no DNS e confere sozinho quando a loja já abre no seu endereço com cadeado (HTTPS)." },
    { q: "Vocês ajudam a migrar a minha loja de outra plataforma?", a: `Sim. A equipe faz a migração dos produtos. Hoje: ${lista(f.planos.map((p) => `${p.nome}, ${p.migracao.toLowerCase()}`))}.` },
    { q: "Como é o atendimento?", a: `Por pessoas da equipe, desde o primeiro plano: ${lista(f.planos.map((p) => `${p.nome}, ${p.suporte.toLowerCase()}`))}.` },
    { q: "Quantos produtos posso cadastrar?", a: lista(f.planos.map((p) => `${p.nome}: ${p.produtos === null ? "sem limite" : `até ${p.produtos.toLocaleString("pt-BR")} produtos`}`)) + "." },
    { q: "Como abro a minha loja?", a: "Crie a conta, escolha o plano e o tema do seu nicho e cadastre os produtos no painel. Se você já tem loja em outra plataforma, a equipe pode trazer os produtos. Se preferir ajuda, deixe o contato em \"Quero minha loja\" e a equipe fala com você pelo WhatsApp." },
  ];
  return out;
}

/** Dados estruturados das perguntas: o mesmo texto que aparece na página. */
export const faqJsonLd = (perguntas: PerguntaFaq[]) => ({
  "@context": "https://schema.org", "@type": "FAQPage",
  mainEntity: perguntas.map((p) => ({ "@type": "Question", name: p.q, acceptedAnswer: { "@type": "Answer", text: p.a } })),
});
