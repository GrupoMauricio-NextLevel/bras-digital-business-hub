import { PageHeader } from "@/components/app/page-header";
import { requireRole } from "@/lib/require-session";
import { NewSupplierForm } from "./new-supplier-form";

export default async function NewSupplierPage() {
  await requireRole("NEXTLEVEL_MASTER");
  return (
    <>
      <PageHeader backHref="/master/suppliers" title="Novo fornecedor" description="Cria a organização, o fornecedor, sua rede e o usuário administrador com senha temporária." />
      <NewSupplierForm />
    </>
  );
}
