import { and, eq } from "drizzle-orm";
import type { Database } from "@/db/client";
import { experiments } from "@/db/schema";
import { requireMaster, type Actor } from "../access";
import { activeOffer, getCatalogItem } from "../nl-catalog";
import { getBenefitsSettings } from "../beneficios/painel";
import { getEcoSettings } from "../ecossistema/lancador";
import { getSurveySettings } from "./questionario";
import { DOOR_OFFER_KEYS, type DoorBrand } from "./porta-entrada";

/**
 * Roteiro "ligar em ordem" (D140), aprovado pelo dono: questionário → benefícios → porta como experimento (com os preços
 * da Proposta) → barra e fio → Club. Lê só as chaves que já existem; não liga nada sozinho.
 */
export type RoadmapState = "LIGADO" | "PARCIAL" | "DESLIGADO";
export type RoadmapStep = { n: number; title: string; state: RoadmapState; detail: string; href: string; next: boolean };

const DOOR_LABEL: Record<DoorBrand, string> = { SUPERDROP: "SuperDrop", NEXTLEVEL_COMMERCE: "Commerce" };

export async function launchRoadmap(db: Database, actor: Actor, now = new Date()): Promise<RoadmapStep[]> {
  requireMaster(actor);
  const [survey, benefits, eco] = await Promise.all([getSurveySettings(db), getBenefitsSettings(db), getEcoSettings(db)]);
  const doors = await Promise.all((Object.keys(DOOR_OFFER_KEYS) as DoorBrand[]).map(async (brand) => {
    const offer = await activeOffer(db, DOOR_OFFER_KEYS[brand], now);
    const exp = await db.query.experiments.findFirst({ where: and(eq(experiments.piece, brand === "SUPERDROP" ? "PORTA_SUPERDROP" : "PORTA_COMMERCE"), eq(experiments.status, "RODANDO")) });
    return { brand, on: !!offer, proposal: offer?.rules.priceSource === "PROPOSTA", experiment: !!exp };
  }));
  const [clubPlus, clubTotal] = await Promise.all([getCatalogItem(db, { key: "CLUB_PLUS" }), getCatalogItem(db, { key: "CLUB_TOTAL" })]);
  const ecoAny = eco.brands.length > 0 || eco.capture || eco.emailFooter || eco.publicPages;
  const ecoAll = eco.brands.length > 0 && eco.capture && eco.emailFooter && eco.publicPages;
  const doorsOn = doors.filter((d) => d.on);
  const doorsSafe = doorsOn.filter((d) => d.experiment);

  const steps: Omit<RoadmapStep, "n" | "next">[] = [
    { title: "Questionário de preço e entrevistas", state: survey.enabled ? "LIGADO" : "DESLIGADO", href: "/master/financeiro/descoberta#questionario", detail: survey.enabled ? `Ligado em ${survey.brands.length} marca(s). Ouvir de 2 a 4 semanas antes de mexer em preço.` : "Ligue o questionário e marque as entrevistas (roteiros em docs/descoberta/ROTEIROS.md)." },
    { title: "Benefícios nos painéis", state: benefits.brands.length === 0 ? "DESLIGADO" : benefits.brands.includes("NEXTLEVEL_COMMERCE") && benefits.brands.includes("SUPERDROP") ? "LIGADO" : "PARCIAL", href: "/master/financeiro/descoberta#beneficios", detail: benefits.brands.length ? `Ligado em ${benefits.brands.length} marca(s). Não muda preço, só mostra.` : "Comece pela Commerce, depois o SuperDrop." },
    {
      title: "Porta de entrada como experimento, com os preços da Proposta",
      state: doorsOn.length === 0 ? "DESLIGADO" : doorsSafe.length === doors.length && doorsSafe.every((d) => d.proposal) ? "LIGADO" : "PARCIAL",
      href: "/master/financeiro/experimentos",
      detail: doorsOn.length === 0
        ? "Na porta de cada marca, marque “Usar os preços da Proposta” e ligue; depois crie o experimento (50% no grupo novo). Quem já é cliente não muda."
        : doors.map((d) => `${DOOR_LABEL[d.brand]}: ${d.on ? `ligada${d.proposal ? " com os preços da Proposta" : " com os preços de hoje"}${d.experiment ? ", em experimento" : ", sem experimento (vale para todos os novos)"}` : "desligada"}`).join(" · "),
    },
    { title: "Barra do ecossistema, fio na captação, e-mails e páginas públicas", state: !ecoAny ? "DESLIGADO" : ecoAll ? "LIGADO" : "PARCIAL", href: "/master/financeiro/descoberta#ecossistema", detail: ecoAny ? `Barra em ${eco.brands.length} marca(s) · captação ${eco.capture ? "ligada" : "desligada"} · e-mails ${eco.emailFooter ? "ligados" : "desligados"} · páginas públicas ${eco.publicPages ? "ligadas" : "desligadas"}.` : "Quando houver duas marcas abertas para o mesmo público." },
    { title: "Club+ e Club Total", state: clubPlus && clubTotal ? "LIGADO" : clubPlus || clubTotal ? "PARCIAL" : "DESLIGADO", href: "/master/financeiro/proposta", detail: clubPlus || clubTotal ? "Publicado no catálogo." : "Em rascunho no catálogo. Publicar depois da conta do grupo." },
  ];
  const firstOpen = steps.findIndex((s) => s.state !== "LIGADO");
  return steps.map((s, i) => ({ ...s, n: i + 1, next: i === firstOpen }));
}
