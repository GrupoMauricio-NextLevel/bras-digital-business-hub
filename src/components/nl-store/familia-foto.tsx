import type { CatalogFamily } from "@/db/schema";
import { FotoOpcional, formatosDisponiveis } from "@/components/portal/imagem-em-criacao";

/**
 * Foto de cada família de solução NextLevel (`public/portal/nextlevel/v3/nl-familia-*`): a mesma imagem no cartão de
 * `/solucoes`, na abertura de `/solucoes/<produto>` e no cartão da Loja NextLevel do painel. Família sem foto: nada aparece.
 */
const FOTO: Partial<Record<CatalogFamily, string>> = {
  COMMERCE_PLAN: "nl-familia-planos",
  LOJA_PRONTA: "nl-familia-loja-pronta",
  MIGRACAO: "nl-familia-migracao",
  TEMA: "nl-familia-temas",
  MARKETING: "nl-familia-marketing",
  CONSULTORIA: "nl-familia-consultoria",
  WHITE_LABEL: "nl-familia-white-label",
};

export function temFamiliaFoto(family: CatalogFamily): boolean {
  const nome = FOTO[family];
  return !!nome && formatosDisponiveis("nextlevel", nome).length > 0;
}

/** Decorativa (alt vazio): o nome da família está escrito logo ao lado, no cartão ou no selo. */
export function FamiliaFoto({ family, ratio = "16 / 9", className, priority }: { family: CatalogFamily; ratio?: string; className?: string; priority?: boolean }) {
  const nome = FOTO[family];
  if (!nome) return null;
  return <FotoOpcional marca="nextlevel" nome={nome} alt="" ratio={ratio} className={className} priority={priority} />;
}
