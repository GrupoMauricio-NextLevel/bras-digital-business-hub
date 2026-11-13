import { LinkTabs } from "@/components/app/link-tabs";

/** Abas de Master → Tráfego e campanhas (D290, D291). */
export function AbasTrafego({ ativa }: { ativa: "agora" | "origens" | "links" | "conexoes" }) {
  return <LinkTabs label="Tráfego e campanhas" active={ativa} items={[
    { key: "agora", label: "Agora no site", href: "/master/trafego" },
    { key: "origens", label: "Origens", href: "/master/trafego/origens" },
    { key: "links", label: "Links rastreados", href: "/master/trafego/links" },
    { key: "conexoes", label: "Pixel e Google", href: "/master/trafego/conexoes" },
  ]} />;
}
