import { PageHeader } from "@/components/app/page-header";
import { requireStoreAdmin } from "@/lib/require-session";
import { getDb } from "@/db/client";
import { listCampaigns } from "@/lib/domain/campaigns";
import { CampaignManager } from "./campaign-manager";
import { perfilAtual } from "@/lib/perfil-loja-server";
import { campanhasAgora } from "@/lib/domain/loja-agora";
import { PrecisaDeVoce } from "@/components/app/precisa-de-voce";

export const dynamic = "force-dynamic";

export default async function CampanhasPage() {
  const session = await requireStoreAdmin();
  const rows = await listCampaigns(await getDb(), session.store!.id);
  const now = new Date().toISOString();
  return (
    <>
      <PageHeader title="Campanhas" description="Faixa de aviso no topo da sua loja, com dia e hora para começar e terminar (horário de Brasília)." />
      {(await perfilAtual(session.store!.id)).ecommerce ? <PrecisaDeVoce itens={campanhasAgora(rows)} vazio="Faixa no ar e sem nada acabando." /> : null}
      <CampaignManager rows={rows.map((c) => ({ id: c.id, text: c.text, linkUrl: c.linkUrl, startsAt: c.startsAt, endsAt: c.endsAt, state: c.endsAt <= now ? "Encerrada" : c.startsAt > now ? "Agendada" : "No ar" }))} />
    </>
  );
}
