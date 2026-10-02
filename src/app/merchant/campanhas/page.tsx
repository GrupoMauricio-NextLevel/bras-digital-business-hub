import { PageHeader } from "@/components/app/page-header";
import { requireRole } from "@/lib/require-session";
import { getDb } from "@/db/client";
import { listCampaigns } from "@/lib/domain/campaigns";
import { CampaignManager } from "./campaign-manager";

export const dynamic = "force-dynamic";

export default async function CampanhasPage() {
  const session = await requireRole("STORE_OWNER");
  const rows = await listCampaigns(await getDb(), session.store!.id);
  const now = new Date().toISOString();
  return (
    <>
      <PageHeader title="Campanhas" description="Faixa de aviso no topo da sua loja, com dia e hora para começar e terminar (horário de Brasília)." />
      <CampaignManager rows={rows.map((c) => ({ id: c.id, text: c.text, linkUrl: c.linkUrl, startsAt: c.startsAt, endsAt: c.endsAt, state: c.endsAt <= now ? "Encerrada" : c.startsAt > now ? "Agendada" : "No ar" }))} />
    </>
  );
}
