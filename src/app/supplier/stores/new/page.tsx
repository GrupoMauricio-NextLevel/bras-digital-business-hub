import { PageHeader } from "@/components/app/page-header";
import { requireRole } from "@/lib/require-session";
import { NewStoreForm } from "./new-store-form";

export default async function NewStorePage() {
  await requireRole("SUPPLIER_ADMIN");
  return (
    <>
      <PageHeader backHref="/supplier/stores" title="Nova loja" description="Cria a loja white label na sua rede, com plano inicial e tema Starter, e convida o lojista com senha temporária." />
      <NewStoreForm />
    </>
  );
}
