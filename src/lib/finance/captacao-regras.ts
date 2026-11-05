import type { PartnerTier } from "@/db/schema";
import { BONUS_ATIVACAO_CENTS, BONUS_META_ATIVACOES, BONUS_META_CENTS } from "./revisao-d226";
import { NIVEIS, nivelPorClientes, recorrenteDoNivel } from "./niveis-regras";

/** Perfis, escada e simulador da página de captação de parceiros (D252, PV4). Puro: roda no servidor e no navegador. */
export const PERFIS = {
  criador: { kind: "AFFILIATE", rotulo: "Sou criador", rota: "/parceiros/criadores", titulo: "Transforme a sua audiência em renda que se repete todo mês.", quem: "Criadores de conteúdo, influenciadores de moda e negócios, professores de e-commerce.", chamada: "Quero ser criador parceiro" },
  vendedor: { kind: "REPRESENTATIVE", rotulo: "Sou vendedor", rota: "/parceiros/vendedores", titulo: "Venda a loja virtual que o Brás está usando, de porta em porta.", quem: "Representantes, vendedores de rua, consultores que já visitam lojistas.", chamada: "Quero ser vendedor parceiro" },
  agencia: { kind: "AGENCY", rotulo: "Sou agência", rota: "/parceiros/agencias", titulo: "Coloque os seus clientes na plataforma e ganhe enquanto eles ficarem.", quem: "Agências de marketing, social media, consultorias e quem cuida de várias marcas.", chamada: "Cadastrar minha agência" },
} as const;
export type PerfilCaptacao = keyof typeof PERFIS;
export const PERFIL_LISTA = Object.keys(PERFIS) as PerfilCaptacao[];

export type RegraPerfil = { primeiraBps: number; recorrenteBps: number; meses: number };

/** Quanto o parceiro ganha no mês N, se indicar `porMes` lojas todo mês e nenhuma cancelar (o nível sobe com a carteira). Puro. */
export function ganhoNoMes(r: RegraPerfil, kind: string, porMes: number, mensalCents: number, mes: number) {
  const carteira = porMes * Math.min(mes - 1, r.meses);
  const tier = nivelPorClientes(porMes * (mes - 1));
  const rec = recorrenteDoNivel(r.recorrenteBps, tier, kind);
  const primeira = (porMes * mensalCents * r.primeiraBps) / 10_000;
  const recorrente = (carteira * mensalCents * rec) / 10_000;
  const bonus = kind === "REPRESENTATIVE" ? porMes * BONUS_ATIVACAO_CENTS + (porMes >= BONUS_META_ATIVACOES ? BONUS_META_CENTS : 0) : 0;
  return { cents: Math.round(primeira + recorrente + bonus), tier, recBps: rec, bonusCents: bonus };
}

/** Escada de níveis do perfil: recorrência e ganho por cliente por mês em cada nível. Puro. */
export function escadaDoPerfil(r: RegraPerfil, kind: string, mensalCents: number) {
  return NIVEIS.map((n) => { const rec = recorrenteDoNivel(r.recorrenteBps, n.tier, kind); return { tier: n.tier as PartnerTier, nome: n.nome, minimo: n.minimo, efeito: n.efeito, recBps: rec, porClienteCents: Math.round((mensalCents * rec) / 10_000) }; });
}

