import type { Metadata } from "next";
import { headers } from "next/headers";
import { brandByCode, brandOfHostStrict } from "@/lib/brand";
import { groupSiteUrl } from "@/lib/host-routing";
import { MARCAS } from "@/lib/marcas-visuais";
import { AberturaMarca, FechoMarca, VitrineMarca } from "@/components/portal/marca-institucional";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return { title: { absolute: "Meu Contador · Grupo NextLevel" }, description: MARCAS["meu-contador"].apoio, alternates: { canonical: `${groupSiteUrl()}/meu-contador` } };
}

/** Meu Contador (D152): o serviço de apoio fiscal que mora dentro do Meu Brás; a página explica e leva à Brás Digital. */
export default async function MeuContadorPage() {
  const h = await headers();
  // Na demonstração (endereço técnico) os links ficam no próprio ambiente; nas marcas, levam à Brás Digital.
  const bras = brandOfHostStrict(h.get("x-forwarded-host") ?? h.get("host")) ? brandByCode("BRAS_DIGITAL").baseUrl : "";
  return (
    <>
      <AberturaMarca slug="meu-contador" eyebrow="Serviço para membros da Brás Digital" ctas={[{ href: `${bras}/login`, label: "Entrar no Meu Brás", primary: true }, { href: `${bras}/`, label: "Conhecer a Brás Digital" }]} />
      <VitrineMarca slug="meu-contador" titulo="Como o Meu Contador ajuda" />
      <FechoMarca slug="meu-contador" cta={{ href: `${bras}/login`, label: "Abrir um chamado" }} />
    </>
  );
}
