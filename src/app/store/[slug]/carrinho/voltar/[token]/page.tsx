import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { stores } from "@/db/schema";
import { refazerCarrinho } from "@/lib/domain/carrinho-abandonado";
import { RefazerCarrinho } from "./refazer";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false }, title: "Voltar ao carrinho" };

/** Link do lembrete (D186): refaz o carrinho com o preço e o estoque de agora e leva ao checkout. */
export default async function VoltarAoCarrinho({ params }: { params: Promise<{ slug: string; token: string }> }) {
  const { slug, token } = await params;
  const db = await getDb();
  const r = await refazerCarrinho(db, token);
  const store = r ? await db.query.stores.findFirst({ where: eq(stores.id, r.storeId), columns: { slug: true } }) : null;
  if (!r || store?.slug !== slug) notFound();
  return <RefazerCarrinho slug={slug} linhas={r.linhas} />;
}
