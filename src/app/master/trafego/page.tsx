import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { PageHeader } from "@/components/app/page-header";
import { agoraNoSite } from "@/lib/domain/trafego/coletor";
import { AbasTrafego } from "./abas";
import { AgoraAoVivo } from "./agora-client";

export const dynamic = "force-dynamic";

/** Tráfego e campanhas → Agora no site (TR2, D291): quem está no site agora, de onde veio e o que fez. */
export default async function TrafegoAgoraPage() {
  const s = await requireRole("NEXTLEVEL_MASTER");
  const inicial = await agoraNoSite(await getDb(), s.actor);
  return (
    <>
      <PageHeader eyebrow="Crescimento" title="Tráfego e campanhas" description="Quem está nos sites da NextLevel agora, de qual canal veio e o que fez. Só conta quem não recusou a medição no aviso de cookies; robôs ficam fora." />
      <AbasTrafego ativa="agora" />
      <AgoraAoVivo inicial={inicial} />
    </>
  );
}
