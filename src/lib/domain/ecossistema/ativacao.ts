import { and, count, eq, isNull } from "drizzle-orm";
import type { Database } from "@/db/client";
import { bdImporters, bdProducts, organizations, stores, trCarriers } from "@/db/schema";
import { brandByCode } from "@/lib/brand";
import { activeDoor } from "../precos/porta-entrada";
import { ECO_BRANDS, type EcoBrand } from "./lancador";

/**
 * Página de ativação ao trocar de marca (D130, fase P5A): monta a página da marca de destino para quem vem de outra
 * marca do grupo. Mensagem "de onde vem → para onde vai", **números reais da rede** (só contagens), benefício de entrada
 * da porta (D126) quando ligada e o caminho para ativar. Nunca usa dado de outra pessoa; o componente não decide regra.
 */
type Message = { title: string; points: string[] };
const DEFAULT: Record<EcoBrand, Message> = {
  NEXTLEVEL_COMMERCE: { title: "Sua loja virtual com a sua marca", points: ["Tema profissional pronto para o celular", "Pix e cartão pelo Mercado Pago da sua loja", "Você é dono do catálogo e dos clientes"] },
  SUPERDROP: { title: "Venda sem comprar estoque", points: ["O fornecedor separa e envia por você", "Loja pronta com o catálogo do fornecedor", "Você define o seu preço de venda"] },
  BRAS_DIGITAL: { title: "O Brás inteiro no seu celular", points: ["Preço de caixa fechada direto das importadoras", "Vídeo e análise dos produtos antes de comprar", "Frete até a sua cidade, de transportadora ou ônibus"] },
  NEXTLEVEL_CARGAS: { title: "Frete do Brás até a sua cidade", points: ["Transportadoras e ônibus de excursão que já rodam a sua rota", "Etiqueta com código e acompanhamento do fardo", "Retirada com código de entrega"] },
};
/** Ponte "de → para": a frase que liga o que a pessoa já faz ao que ganha na outra marca. */
const BRIDGE: Partial<Record<`${EcoBrand}>${EcoBrand}`, string>> = {
  "SUPERDROP>BRAS_DIGITAL": "Você já vende pelo SuperDrop. No Brás Digital Club você compra estoque pelo preço do Brás quando quiser ter produto próprio.",
  "NEXTLEVEL_COMMERCE>BRAS_DIGITAL": "Você já tem a sua loja. No Brás Digital Club você abastece o estoque direto das importadoras, em caixa fechada.",
  "BRAS_DIGITAL>NEXTLEVEL_CARGAS": "Você já compra no Brás. Com a NextLevel Cargas o fardo chega na sua cidade sem você viajar.",
  "BRAS_DIGITAL>NEXTLEVEL_COMMERCE": "Você já compra no Brás. Com a NextLevel Commerce você vende online o que comprou, com a sua marca.",
  "SUPERDROP>NEXTLEVEL_CARGAS": "Você já vende pelo SuperDrop. Com a NextLevel Cargas você recebe e envia fardos do Brás.",
  "NEXTLEVEL_COMMERCE>NEXTLEVEL_CARGAS": "Você já tem a sua loja. Com a NextLevel Cargas a mercadoria do Brás chega até você.",
  "NEXTLEVEL_CARGAS>BRAS_DIGITAL": "Você já transporta. No Brás Digital Club estão as importadoras que chamam coleta.",
};

export const isEcoBrand = (v: string | undefined | null): v is EcoBrand => !!v && (ECO_BRANDS as readonly string[]).includes(v);

async function networkNumbers(db: Database, to: EcoBrand): Promise<{ label: string; value: number }[]> {
  if (to === "BRAS_DIGITAL") {
    const [imp] = await db.select({ n: count() }).from(bdImporters);
    const [prod] = await db.select({ n: count() }).from(bdProducts).where(eq(bdProducts.status, "ATIVO"));
    return [{ label: "importadoras na vitrine", value: imp?.n ?? 0 }, { label: "produtos à venda em caixa", value: prod?.n ?? 0 }];
  }
  if (to === "NEXTLEVEL_CARGAS") {
    const [c] = await db.select({ n: count() }).from(trCarriers).where(eq(trCarriers.status, "ATIVA"));
    return [{ label: "transportadoras e ônibus ativos", value: c?.n ?? 0 }];
  }
  const [s] = await db.select({ n: count() }).from(stores).innerJoin(organizations, eq(organizations.id, stores.organizationId)).where(and(eq(organizations.brand, to), eq(stores.status, "ACTIVE"), isNull(stores.showcaseTheme)));
  return [{ label: "lojas no ar", value: s?.n ?? 0 }];
}

export type ActivationPage = {
  to: EcoBrand; from: EcoBrand | null; name: string; title: string; bridge: string | null; points: string[];
  numbers: { label: string; value: number }[]; benefit: string | null; ctaHref: string; ctaLabel: string;
};

export async function activationPage(db: Database, to: EcoBrand, fromRaw: string | null | undefined, now = new Date()): Promise<ActivationPage> {
  const from = isEcoBrand(fromRaw) && fromRaw !== to ? fromRaw : null;
  const msg = DEFAULT[to];
  const door = to === "SUPERDROP" || to === "NEXTLEVEL_COMMERCE" ? await activeDoor(db, to, now) : null;
  const benefit = door ? (door.trialDays ? `${door.trialDays} dias do plano completo grátis; depois a loja segue no plano grátis, sem bloquear` : "Comece no plano grátis") : to === "NEXTLEVEL_CARGAS" ? null : to === "BRAS_DIGITAL" ? "Cadastro grátis com CNPJ" : null;
  // Só mostra número que já diz algo (evita "0 lojas").
  const numbers = (await networkNumbers(db, to)).filter((n) => n.value >= 3);
  const src = from ? `?utm_source=grupo-${from.toLowerCase()}` : "";
  return {
    to, from, name: brandByCode(to).name, title: msg.title, bridge: from ? BRIDGE[`${from}>${to}`] ?? null : null, points: msg.points, numbers, benefit,
    ctaHref: to === "NEXTLEVEL_CARGAS" ? "/" : `/cadastro${src}`,
    ctaLabel: to === "NEXTLEVEL_CARGAS" ? "Ver como funciona" : door?.trialDays ? "Ativar o teste grátis" : "Criar meu cadastro grátis",
  };
}
