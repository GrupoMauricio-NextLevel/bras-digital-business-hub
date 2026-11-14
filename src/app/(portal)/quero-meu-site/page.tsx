import { redirect } from "next/navigation";

/**
 * Atalho do caminho Site (NB1, D297) para anúncios e links: leva ao formulário de entrada já com "site para a empresa"
 * marcado, mantendo as etiquetas da campanha (utm_*, fbclid…) do endereço.
 */
export default async function QueroMeuSite({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(await searchParams)) if (typeof v === "string" && k !== "para") q.set(k, v);
  q.set("para", "site");
  redirect(`/quero-minha-loja?${q.toString()}`);
}
