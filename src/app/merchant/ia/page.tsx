import { PageHeader } from "@/components/app/page-header";
import { requireIndependent } from "@/lib/require-independent";
import { getDb } from "@/db/client";
import { mauricioDaLoja } from "@/lib/domain/ia";
import { CentralIa } from "@/components/ia/central";
import { situacaoIa } from "@/lib/domain/ia-por-plano";
import { SuaIa } from "./sua-ia";

export const dynamic = "force-dynamic";

/** Central do Maurício na loja (IA0, D194). */
export default async function MauricioLojaPage() {
  const { session } = await requireIndependent();
  const db = await getDb();
  const [m, s] = await Promise.all([mauricioDaLoja(db, session.store!.id), situacaoIa(db, session.store!.id)]);
  return (
    <>
      <PageHeader title="Pede pro Maurício" description="Descrições, respostas, análises e tarefas preparadas para você conferir. Em fase Beta." />
      <SuaIa s={s} />
      <CentralIa m={m} upgrade="/merchant/finance#assinatura" />
    </>
  );
}
