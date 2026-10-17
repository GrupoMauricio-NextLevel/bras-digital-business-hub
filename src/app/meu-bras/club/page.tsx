import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { PageHeader } from "@/components/app/page-header";
import { brandByCode } from "@/lib/brand";
import { clubPanel } from "@/lib/domain/club/pontos";
import { ClubPanel } from "@/components/club/club-panel";
import { RankingCard } from "@/components/club/ranking-card";
import { cityRanking } from "@/lib/domain/club/ranking";
import { ReferCarrierForm } from "@/components/frete/frete-forms";
import QRCode from "qrcode";
import { myClubCard } from "@/lib/domain/club/balcao";
import { RenewCardButton } from "@/components/club/balcao-forms";

export const dynamic = "force-dynamic";

/** Brás Digital Club no Meu Brás (D115): "Indique e ganhe" com pontos que viram desconto. */
export default async function Club() {
  const session = await requireRole("BRAS_MEMBER");
  const db = await getDb();
  const [data, card] = await Promise.all([clubPanel(db, session.actor), myClubCard(db, session.actor.userId)]);
  const qr = await QRCode.toDataURL(`CLUB:${card.token}`, { margin: 1, width: 200, errorCorrectionLevel: "M" });
  const ranking = await cityRanking(await getDb(), session.actor);
  return (
    <>
      <PageHeader eyebrow="Brás Digital Club" title="Indique e ganhe" description="Traga clientes, transportadoras, ônibus e importadoras para a rede. Cada indicação ativada vira pontos, e os pontos viram desconto." />
      <section aria-labelledby="club-card" className="ds-card mb-6 flex flex-wrap items-center gap-4 p-4">
        {/* eslint-disable-next-line @next/next/no-img-element -- QR gerado no servidor */}
        <img src={qr} alt="QR do cartão do Club" width={140} height={140} className="rounded bg-white p-1" />
        <div className="min-w-0">
          <h2 id="club-card" className="text-lg font-bold">Seu cartão do Club</h2>
          <p className="text-sm text-muted-foreground">Mostre no balcão das lojas participantes (Mega Tron primeiro): a compra vira pontos e você pode usar o seu vale.</p>
          <p className="mt-2 font-mono text-lg font-bold tracking-widest">{card.token}</p>
          <div className="mt-2"><RenewCardButton /></div>
        </div>
      </section>
      <ClubPanel data={data} inviteUrl={`${brandByCode("BRAS_DIGITAL").baseUrl}/c/${data.code}`} inviteMessage="Compre do Brás por caixa fechada no Brás Digital Club. Entre pelo meu convite:" referSlot={<><h3 className="mb-2 text-sm font-semibold">Indicar transportadora, ônibus ou importadora</h3><ReferCarrierForm kinds={["TRANSPORTADORA", "ONIBUS", "IMPORTADORA"]} /></>} />
      <RankingCard ranking={ranking} />
    </>
  );
}
