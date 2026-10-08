import { Clapperboard } from "lucide-react";
import type { BrasFeedItem } from "@/lib/domain/bras/catalogo";
import { BrasVideoCard } from "@/components/portal/bras/video-card";

/** Grade de descobertas do Meu Brás: cada cartão leva à página da descoberta (análise, preço e pedido). */
export function BrasFeed({ items, ativo }: { items: BrasFeedItem[]; ativo: boolean }) {
  if (!items.length) return <div className="ds-card p-8 text-center"><Clapperboard className="mx-auto size-8 text-muted-foreground" aria-hidden /><p className="mt-2 font-semibold">As primeiras descobertas estão sendo gravadas.</p><p className="text-sm text-muted-foreground">Elas aparecem aqui assim que forem publicadas.</p></div>;
  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {items.map((v) => (
        <li key={v.id}>
          <BrasVideoCard tone="light" youtubeId={v.youtubeId} title={v.title} summary={v.summary} trendSignal={v.trendSignal} verdict={v.member?.verdict} score={v.member?.score} offer={v.offer}
            buy={ativo ? { href: `/meu-bras/descoberta/${v.id}`, label: "Ver descoberta", note: "Preço em preparação" } : { href: "/meu-bras/empresa", label: "Ver meu cadastro", note: "Preço oculto: cadastro em análise" }} />
        </li>
      ))}
    </ul>
  );
}
