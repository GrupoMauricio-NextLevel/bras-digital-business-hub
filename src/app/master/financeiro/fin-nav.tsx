import { LinkTabs } from "@/components/app/link-tabs";

const ITEMS = [
  { key: "visao", label: "Visão executiva", href: "/master/financeiro" },
  { key: "catalogo", label: "Catálogo e preços", href: "/master/financeiro/catalogo" },
  { key: "ofertas", label: "Ofertas e comissões", href: "/master/financeiro/ofertas" },
  { key: "assinaturas", label: "Assinaturas", href: "/master/financeiro/assinaturas" },
  { key: "pagamentos", label: "Pagamentos", href: "/master/financeiro/pagamentos" },
  { key: "propostas", label: "Propostas e entregas", href: "/master/financeiro/propostas" },
  { key: "parceiros", label: "Parceiros", href: "/master/financeiro/parceiros" },
  { key: "gateways", label: "Gateways e conciliação", href: "/master/financeiro/gateways" },
  { key: "superdrop", label: "SuperDrop", href: "/master/financeiro/superdrop" },
  { key: "jornada", label: "Jornada", href: "/master/financeiro/jornada" },
  { key: "auditoria", label: "Auditoria", href: "/master/financeiro/auditoria" },
];

/** Navegação do financeiro corporativo da NextLevel (`nextlevel_corporate_finance`, só Master). */
export function FinNav({ active }: { active: string }) {
  return <LinkTabs items={ITEMS} active={active} label="Seções do financeiro NextLevel" />;
}

export const CORPORATE_BADGE = "Financeiro corporativo NextLevel";
