import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { Sparkles } from "lucide-react";
import { requireRole } from "@/lib/require-session";

export default async function SupplierNextLevelStore() {
  await requireRole("SUPPLIER_ADMIN");
  return (
    <>
      <PageHeader title="Loja NextLevel" description="Serviços e upgrades para o seu negócio." />
      <EmptyState icon={Sparkles} title="Catálogo em preparação" description="Os serviços para fornecedores chegam nesta área." />
    </>
  );
}
