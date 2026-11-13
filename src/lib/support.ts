/**
 * Contato do suporte nas telas. Vale o que estiver no Render (NEXT_PUBLIC_SUPPORT_WHATSAPP, só dígitos com 55, e
 * NEXT_PUBLIC_SUPPORT_EMAIL); sem eles, o canal oficial informado pelo dono em 2026-10-27 (D181).
 */
export const SUPORTE_PADRAO = { whatsapp: "5511940862144", email: "contato@nextlevelcommerce.com.br" } as const; // D290

export function supportContacts(mensagem = "Olá! Preciso de ajuda.") {
  const wa = (process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || SUPORTE_PADRAO.whatsapp).replace(/\D/g, "");
  const email = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || SUPORTE_PADRAO.email;
  return { whatsappUrl: wa ? `https://wa.me/${wa}?text=${encodeURIComponent(mensagem)}` : null, whatsappLabel: wa ? formatarTelefone(wa) : null, email: email || null };
}

/** 5511940862144 → (11) 94086-2144 (número brasileiro); outro formato fica como veio, com "+". */
export function formatarTelefone(digitos: string): string {
  const m = digitos.match(/^55(\d{2})(\d{4,5})(\d{4})$/);
  return m ? `(${m[1]}) ${m[2]}-${m[3]}` : `+${digitos}`;
}
