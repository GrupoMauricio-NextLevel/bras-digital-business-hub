import { PageHeader } from "@/components/app/page-header";
import { ContentGrid } from "@/components/shared/content-grid";
import { requireAreaRole } from "@/lib/require-session";
import { getSupplierContent } from "@/lib/queries/supplier";

export default async function SupplierContentPage() {
  const session = await requireAreaRole("SUPERDROP", "SUPPLIER_ADMIN");
  const items = await getSupplierContent(session.supplier!.id);
  return (
    <>
      <PageHeader title="Central de conteúdo" description="Materiais que a Central disponibiliza para os lojistas da rede (dados de demonstração)." />
      <ContentGrid items={items} />
    </>
  );
}
