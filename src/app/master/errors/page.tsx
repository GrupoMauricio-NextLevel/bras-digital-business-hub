import { PageHeader } from "@/components/app/page-header";
import { requireRole } from "@/lib/require-session";
import { getDb } from "@/db/client";
import { listErrors } from "@/lib/domain/error-log";
import { ErrorList } from "./error-list";

export const dynamic = "force-dynamic";

export default async function ErrorsPage() {
  const session = await requireRole("NEXTLEVEL_MASTER");
  const rows = await listErrors(await getDb(), session.actor);
  return (
    <>
      <PageHeader title="Erros do sistema" description="Falhas do servidor e das telas, agrupadas. Dados pessoais e segredos são removidos antes de guardar. Marque como resolvido depois de corrigir: se voltar, reabre sozinho." />
      <ErrorList rows={rows.map((e) => ({ id: e.id, origin: e.origin, route: e.route, message: e.message, stack: e.stack, count: e.count, firstAt: e.firstAt, lastAt: e.lastAt, resolved: !!e.resolvedAt, context: e.context, storeSlug: e.lastStoreSlug, ref: e.lastRef }))} />
    </>
  );
}
