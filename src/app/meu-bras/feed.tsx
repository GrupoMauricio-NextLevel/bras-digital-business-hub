import { Clapperboard } from "lucide-react";
import type { BrasFeedItem } from "@/lib/domain/bras/catalogo";
import { brasBuyMessage, brasWhatsappUrl } from "@/lib/bras/contato";
import { BrasVideoCard } from "@/components/portal/bras/video-card";

/** Grade de vídeos do Meu Brás. Com oferta: "Quero comprar" abre o pedido; sem oferta: conversa com a equipe. */
export function BrasFeed({ items, ativo, company }: { items: BrasFeedItem[]; ativo: boolean; company: string }) {
  if (!items.length) return <div className="ds-card p-8 text-center"><Clapperboard className="mx-auto size-8 text-muted-foreground" aria-hidden /><p className="mt-2 font-semibold">Os primeiros vídeos estão sendo gravados.</p><p className="text-sm text-muted-foreground">Eles aparecem aqui assim que forem publicados.</p></div>;
  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {items.map((v) => {
        let buy: { href: string; label: string; external?: boolean; note?: string };
        if (!ativo) buy = { href: "/meu-bras/empresa", label: "Ver meu cadastro", note: "Preço oculto: cadastro em análise" };
        else if (v.offer && v.offer.boxesAvailable !== 0) buy = { href: `/meu-bras/pedir/${v.id}`, label: "Quero comprar" };
        else { const wa = brasWhatsappUrl(brasBuyMessage(company, v.title)); buy = wa ? { href: wa, label: "Consultar", external: true, note: v.offer ? undefined : "Preço e caixas: consulte a equipe" } : { href: "/meu-bras", label: "Em breve", note: "Preço em preparação" }; }
        return <li key={v.id}><BrasVideoCard tone="light" youtubeId={v.youtubeId} title={v.title} summary={v.summary} offer={v.offer} buy={buy} /></li>;
      })}
    </ul>
  );
}
