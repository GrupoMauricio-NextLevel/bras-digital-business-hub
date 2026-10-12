import { LinkTabs } from "@/components/app/link-tabs";

const ITEMS = [
  { key: "visao", label: "Visão executiva", href: "/master/financeiro" },
  { key: "precos", label: "Preços do grupo", href: "/master/financeiro/precos" },
  { key: "descoberta", label: "Descoberta", href: "/master/financeiro/descoberta" },
  { key: "proposta", label: "Proposta de preço", href: "/master/financeiro/proposta" },
  { key: "experimentos", label: "Experimentos", href: "/master/financeiro/experimentos" },
  { key: "catalogo", label: "Catálogo e preços", href: "/master/financeiro/catalogo" },
  { key: "ofertas", label: "Ofertas e comissões", href: "/master/financeiro/ofertas" },
  { key: "assinaturas", label: "Assinaturas", href: "/master/financeiro/assinaturas" },
  { key: "pagamentos", label: "Pagamentos", href: "/master/financeiro/pagamentos" },
  { key: "propostas", label: "Propostas e entregas", href: "/master/financeiro/propostas" },
  { key: "parceiros", label: "Parceiros", href: "/master/financeiro/parceiros" },
  { key: "gateways", label: "Gateways e conciliação", href: "/master/financeiro/gateways" },
  { key: "superdrop", label: "SuperDrop", href: "/master/financeiro/superdrop" },
  { key: "operacao", label: "Operação SuperDrop", href: "/master/financeiro/operacao" },
  { key: "jornada", label: "Jornada", href: "/master/financeiro/jornada" },
  { key: "auditoria", label: "Auditoria", href: "/master/financeiro/auditoria" },
];

/** Navegação do financeiro corporativo da NextLevel (`nextlevel_corporate_finance`, só Master). */
export function FinNav({ active }: { active: string }) {
  return <LinkTabs items={ITEMS} active={active} label="Seções do financeiro NextLevel" />;
}

export const CORPORATE_BADGE = "Financeiro corporativo NextLevel";
