/**
 * Endereços de e-mail da NextLevel Commerce por assunto (D290). Todos entregam na caixa do dono na Hostinger (D289);
 * no futuro cada um pode virar a caixa de uma pessoa sem mudar nada para o cliente. Fonte única: telas, páginas e
 * o "responder para" dos e-mails do sistema leem daqui.
 */
export const CONTATOS = {
  contato: "contato@nextlevelcommerce.com.br",
  suporte: "suporte@nextlevelcommerce.com.br",
  financeiro: "financeiro@nextlevelcommerce.com.br",
  comercial: "comercial@nextlevelcommerce.com.br",
  parceiros: "parceiros@nextlevelcommerce.com.br",
} as const;
export type AssuntoContato = keyof typeof CONTATOS;

/** Para qual endereço o cliente responde, conforme o tipo do e-mail do sistema. */
export function responderPara(kind: string): string {
  const k = kind.toUpperCase();
  if (/^(CONTRATO|INVOICE|DUNNING|PAYOUT|NL_ORDER|SUBSCRIPTION|PLAN|PIX|COBRANCA|FATURA|RECEIPT|TRIAL)/.test(k)) return CONTATOS.financeiro;
  if (/^(PARTNER|PARCEIR|COMMISSION|COMISS|REFERRAL|INDICA)/.test(k)) return CONTATOS.parceiros;
  if (/^(LEAD|DIAGNOSTIC|QUOTE|PROPOSTA)/.test(k)) return CONTATOS.comercial;
  if (/^(PASSWORD|LOGIN|TERMOS|WELCOME|STORE|ORDER|DOMINIO|SUPPORT|SUPORTE|ATIVACAO)/.test(k)) return CONTATOS.suporte;
  return CONTATOS.contato;
}
