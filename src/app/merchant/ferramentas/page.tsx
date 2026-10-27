import { PageHeader } from "@/components/app/page-header";
import { requireRole } from "@/lib/require-session";
import { CalcAnuncio, CalcEquilibrio, CalcFreteGratis, CalcParcelado, CalcPreco, CalcPromocao } from "@/components/ferramentas/calculadoras";
import { CalendarioComercial } from "@/components/ferramentas/calendario";

/** Ferramentas do lojista (W5, D188): contas do dia a dia e o calendário do varejo. Nada aqui grava dados. */
export default async function FerramentasPage() {
  await requireRole("STORE_OWNER");
  return (
    <>
      <PageHeader title="Ferramentas" description="Contas rápidas para decidir preço, promoção, parcelamento e frete grátis. Elas calculam com os números que você digitar." />
      <div className="grid gap-6 xl:grid-cols-2">
        <CalcPreco /><CalcPromocao /><CalcFreteGratis /><CalcParcelado /><CalcEquilibrio /><CalcAnuncio />
      </div>
      <CalendarioComercial className="mt-6" />
    </>
  );
}
