import { PageHeader } from "@/components/app/page-header";
import { requireIndependent } from "@/lib/require-independent";
import { getDb } from "@/db/client";
import { mauricioDaLoja } from "@/lib/domain/ia";
import { CentralIa } from "@/components/ia/central";

export const dynamic = "force-dynamic";

/** Central do Maurício na loja (IA0, D194). */
export default async function MauricioLojaPage() {
  const { session } = await requireIndependent();
  const m = await mauricioDaLoja(await getDb(), session.store!.id);
  return (
    <>
      <PageHeader title="Maurício, a IA da sua loja" description="Descrições, respostas, análises e tarefas preparadas para você conferir. Em fase Beta." />
      <CentralIa m={m} upgrade="/merchant/finance#assinatura" />
    </>
  );
}
