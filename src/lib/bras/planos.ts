/** Planos e canais de suporte da Brás (D108). Puro: serve telas (cliente) e domínio (servidor). */
export const BRAS_MEMBER_PLANS = ["GRATIS", "PRATA", "OURO", "PLATINUM"] as const;
export type BrasMemberPlan = (typeof BRAS_MEMBER_PLANS)[number];
export const BRAS_PLAN_LABEL: Record<BrasMemberPlan, string> = { GRATIS: "Grátis", PRATA: "Prata", OURO: "Ouro", PLATINUM: "Platinum" };
/** Ordem dos planos (para "o maior plano vale"). */
export const brasPlanRank = (p: BrasMemberPlan) => BRAS_MEMBER_PLANS.indexOf(p);

export const BRAS_SUPPORT_CHANNELS = ["FAQ", "CHAT", "WHATSAPP", "AGENDA"] as const;
export type BrasSupportChannel = (typeof BRAS_SUPPORT_CHANNELS)[number];
export const BRAS_SUPPORT_LABEL: Record<BrasSupportChannel, string> = { FAQ: "Perguntas frequentes", CHAT: "Chat com a equipe", WHATSAPP: "WhatsApp da equipe", AGENDA: "Agenda pessoal na importadora" };

export const CARRIER_PLANS = ["GRATIS", "PRO", "PREMIUM"] as const;
export type CarrierPlan = (typeof CARRIER_PLANS)[number];

