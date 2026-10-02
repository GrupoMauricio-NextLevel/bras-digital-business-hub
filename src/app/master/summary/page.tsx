import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { requireRole } from "@/lib/require-session";
import { getDb } from "@/db/client";
import { summaryForMaster } from "@/lib/domain/daily-summary";

export const dynamic = "force-dynamic";

export default async function SummaryPage() {
  const session = await requireRole("NEXTLEVEL_MASTER");
  const s = await summaryForMaster(await getDb(), session.actor);
  return (
    <>
      <PageHeader title="Resumo do dia" description="O mesmo texto que sai por e-mail todas as manhãs (quando o e-mail estiver configurado)." />
      <Card><CardContent className="whitespace-pre-line py-5 text-sm leading-relaxed">{s.text}</CardContent></Card>
    </>
  );
}
