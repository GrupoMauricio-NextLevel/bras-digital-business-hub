import { permanentRedirect } from "next/navigation";

/** Endereço antigo do financeiro da operação SuperDrop (D149): agora é uma seção do financeiro NextLevel. Mantém a aba pedida. */
export default async function FinanceAntigo({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const tab = typeof sp.tab === "string" && /^[a-z]+$/.test(sp.tab) ? `?tab=${sp.tab}` : "";
  permanentRedirect(`/master/financeiro/operacao${tab}`);
}
