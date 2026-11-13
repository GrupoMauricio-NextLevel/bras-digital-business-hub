/**
 * A NextLevel Commerce como "entidade" para buscadores e IAs (D290, plano de busca v3, seção 15): o mesmo nome, a mesma
 * empresa e os mesmos fatos em todo lugar. Arquivo puro: a home passa o endereço, o contato e os planos do sistema.
 * `sameAs` (perfis oficiais) só entra com endereço real, vindo de PERFIS_COMMERCE (lista separada por vírgula).
 */
export const FRASE_ENTIDADE =
  "NextLevel Commerce é a plataforma de lojas virtuais da NextLevel, nascida no Brás (São Paulo), com atacado nativo em todos os planos e 0% de tarifa da plataforma sobre as vendas com o Mercado Pago.";
export const EMPRESA = { nome: "NextLevel Marketing Ltda", cnpj: "51.392.006/0001-92" } as const;
export const LOGO_COMMERCE = "/marcas/nextlevel-ecommerce/logos/app-icons/icon-512.png";

export type EntradaEntidade = {
  baseUrl: string;
  whatsapp: string | null;
  email: string | null;
  perfis: string[];
  planos: { nome: string; mensalCents: number | null }[];
};

export const perfisOficiais = (v: string | undefined) => (v ?? "").split(",").map((s) => s.trim()).filter((s) => /^https:\/\/[^\s,]+$/.test(s));

export function entidadeCommerce(e: EntradaEntidade): Record<string, unknown>[] {
  const id = `${e.baseUrl}/#organizacao`;
  const contato = [
    ...(e.whatsapp ? [{ "@type": "ContactPoint", contactType: "customer support", telephone: `+${e.whatsapp}`, areaServed: "BR", availableLanguage: "Portuguese" }] : []),
    ...(e.email ? [{ "@type": "ContactPoint", contactType: "customer support", email: e.email, areaServed: "BR", availableLanguage: "Portuguese" }] : []),
  ];
  const ofertas = e.planos.filter((p) => p.mensalCents !== null && p.mensalCents > 0).map((p) => ({
    "@type": "Offer", name: `Plano ${p.nome} (mensal)`, price: (p.mensalCents! / 100).toFixed(2), priceCurrency: "BRL", url: `${e.baseUrl}/planos`,
  }));
  return [
    {
      "@context": "https://schema.org", "@type": "Organization", "@id": id, name: "NextLevel Commerce", url: e.baseUrl,
      logo: `${e.baseUrl}${LOGO_COMMERCE}`, description: FRASE_ENTIDADE,
      address: { "@type": "PostalAddress", addressLocality: "São Paulo", addressRegion: "SP", addressCountry: "BR" },
      areaServed: { "@type": "Country", name: "Brasil" },
      parentOrganization: { "@type": "Organization", name: EMPRESA.nome, legalName: EMPRESA.nome, taxID: EMPRESA.cnpj },
      ...(contato.length ? { contactPoint: contato } : {}),
      ...(e.perfis.length ? { sameAs: e.perfis } : {}),
    },
    { "@context": "https://schema.org", "@type": "WebSite", name: "NextLevel Commerce", url: e.baseUrl, inLanguage: "pt-BR", publisher: { "@id": id } },
    {
      "@context": "https://schema.org", "@type": "SoftwareApplication", name: "NextLevel Commerce", url: e.baseUrl,
      applicationCategory: "BusinessApplication", operatingSystem: "Web", inLanguage: "pt-BR", description: FRASE_ENTIDADE,
      featureList: ["Atacado em todos os planos: grade, preço por quantidade e pedido mínimo", "Pix e cartão pelo Mercado Pago", "Temas por nicho", "Domínio próprio", "Frete calculado na hora"],
      publisher: { "@id": id },
      ...(ofertas.length ? { offers: ofertas } : {}),
    },
  ];
}
