import { PageHeader } from "@/components/app/page-header";
import { requireAreaRole } from "@/lib/require-session";
import { NewStoreForm } from "./new-store-form";
import { getDb } from "@/db/client";
import { ensureContract, getPriceBook } from "@/lib/domain/finance";

export default async function NewStorePage() {
  const session = await requireAreaRole("SUPERDROP", "SUPPLIER_ADMIN");
  const db = await getDb();
  const [book, contract] = await Promise.all([getPriceBook(db), ensureContract(db, session.supplier!.id)]);
  const offers = (Object.keys(book.offers) as (keyof typeof book.offers)[]).map((k) => ({ key: k, ...book.offers[k], commissionCents: Math.round((book.offers[k].setupCents * contract.storeSetupCommissionBps) / 10000) }));
  return (
    <>
      <PageHeader backHref="/supplier/stores" title="Nova loja" description="Escolha a oferta, crie a loja e convide o lojista. O setup é pago diretamente à NextLevel e a loja é liberada após a confirmação. Você recebe a comissão de canal sobre o setup." />
      <NewStoreForm offers={offers} />
    </>
  );
}
