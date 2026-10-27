/** Como o pedido sai da loja independente (D180). Entrega própria não tem código de rastreio; as demais exigem. */
export const FORMAS_DE_ENVIO = [
  { key: "CORREIOS", label: "Correios", rastreio: true },
  { key: "JADLOG", label: "Jadlog", rastreio: true },
  { key: "LOGGI", label: "Loggi", rastreio: true },
  { key: "TRANSPORTADORA", label: "Outra transportadora", rastreio: true },
  { key: "ENTREGA_PROPRIA", label: "Entrega própria (motoboy ou carro)", rastreio: false },
] as const;
export type FormaDeEnvio = (typeof FORMAS_DE_ENVIO)[number]["key"];
