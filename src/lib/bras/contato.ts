/**
 * WhatsApp da equipe da Brás Digital (D92: atendimento e fechamento de pedido são da Brás, não da importadora).
 * BRAS_WHATSAPP (só dígitos, com 55); sem ele, vale o suporte geral (NEXT_PUBLIC_SUPPORT_WHATSAPP). Sem nenhum, null.
 */
export function brasWhatsappUrl(text: string, env: Record<string, string | undefined> = process.env): string | null {
  const wa = (env.BRAS_WHATSAPP || env.NEXT_PUBLIC_SUPPORT_WHATSAPP || "").replace(/\D/g, "");
  return wa ? `https://wa.me/${wa}?text=${encodeURIComponent(text)}` : null;
}

/** Mensagem pronta do membro que quer comprar o produto de um vídeo (sem dado pessoal na mensagem). */
export const brasBuyMessage = (company: string, title: string) => `Olá! Sou da ${company}, membro do Brás Digital Club. Quero comprar: ${title}.`;
