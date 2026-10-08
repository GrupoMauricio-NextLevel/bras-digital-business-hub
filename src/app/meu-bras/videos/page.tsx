import { Clapperboard } from "lucide-react";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { PageHeader } from "@/components/app/page-header";
import { getBrasMemberByUser } from "@/lib/domain/bras/membros";
import { listPublicBrasVideos } from "@/lib/domain/bras/videos";
import { brasBuyMessage, brasWhatsappUrl } from "@/lib/bras/contato";
import { BrasVideoCard } from "@/components/portal/bras/video-card";

export const dynamic = "force-dynamic";

export default async function Videos() {
  const session = await requireRole("BRAS_MEMBER");
  const db = await getDb();
  const [member, videos] = await Promise.all([getBrasMemberByUser(db, session.user.id), listPublicBrasVideos(db, 60)]);
  const ativo = member?.status === "ACTIVE";
  const company = member?.companyName ?? session.user.name;
  return (
    <>
      <PageHeader eyebrow="Meu Brás" title="Vídeos de produtos" description="Análise de cada produto em vídeo. Gostou? Toque em Quero comprar e a equipe confirma preço, caixas e pagamento." />
      {videos.length ? (
        <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {videos.map((v) => {
            const href = ativo ? brasWhatsappUrl(brasBuyMessage(company, v.title)) : null;
            return <li key={v.id}><BrasVideoCard tone="light" youtubeId={v.youtubeId} title={v.title} summary={v.summary} buy={href ? { href, label: "Quero comprar", external: true, note: "Preço e caixas: confirme com a equipe" } : { href: "/meu-bras/empresa", label: "Ver meu cadastro", note: "Preço oculto: cadastro em análise" }} /></li>;
          })}
        </ul>
      ) : (
        <div className="ds-card p-8 text-center"><Clapperboard className="mx-auto size-8 text-muted-foreground" aria-hidden /><p className="mt-2 font-semibold">Os primeiros vídeos estão sendo gravados.</p></div>
      )}
    </>
  );
}
