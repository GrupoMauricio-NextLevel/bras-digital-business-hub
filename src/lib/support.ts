/** Contato do suporte mostrado nas telas de bloqueio. Configure NEXT_PUBLIC_SUPPORT_WHATSAPP (só dígitos, com 55) e NEXT_PUBLIC_SUPPORT_EMAIL. */
export function supportContacts() {
  const wa = (process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ?? "").replace(/\D/g, "");
  const email = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "";
  return { whatsappUrl: wa ? `https://wa.me/${wa}?text=${encodeURIComponent("Olá! Preciso de ajuda com o acesso à minha loja SuperDrop.")}` : null, whatsappLabel: wa ? `+${wa}` : null, email: email || null };
}
