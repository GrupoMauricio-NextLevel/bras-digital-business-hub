import { notFound } from "next/navigation";
import { getDb } from "@/db/client";
import { NotFoundError } from "@/lib/domain/errors";
import { requireStoreAdmin } from "@/lib/require-session";
import { PageHeader } from "@/components/app/page-header";
import { salaDaCampanha } from "@/lib/domain/anuncios";
import { listStoreCatalog } from "@/lib/domain/catalog";
import { SalaDaCampanha } from "@/components/anuncios/sala";
import { Diagnostico } from "./diagnostico";

export const dynamic = "force-dynamic";
export const metadata = { title: "Campanha · Anúncios na Meta" };

/** Campanha da loja (D299): diagnóstico enquanto é rascunho; depois, a sala da campanha. */
export default async function AnuncioPage({ params }: { params: Promise<{ id: string }> }) {
  const s = await requireStoreAdmin();
  const db = await getDb();
  const sala = await salaDaCampanha(db, s.actor, (await params).id).catch((e) => { if (e instanceof NotFoundError) notFound(); throw e; });
  const catalogo = await listStoreCatalog(db, s.store!.id, { onlyActive: true }).catch(() => []);
  const produtos = catalogo.slice(0, 60).map((c) => ({ id: c.product.id, nome: c.product.name, imagem: c.product.images[0] ?? null }));
  const a = sala.anuncio;
  if (a.status === "RASCUNHO") {
    return (
      <>
        <PageHeader backHref="/merchant/anuncios" title="Diagnóstico da campanha" description="Responda com calma: tudo fica salvo, e você pode voltar depois." />
        <Diagnostico id={a.id} inicial={a.diagnostico as never} loja={s.store!.name} produtos={produtos} />
      </>
    );
  }
  const nomes = produtos.filter((p) => ((a.diagnostico.produtos as string[] | undefined) ?? []).includes(p.id)).map((p) => p.nome);
  return (
    <>
      <PageHeader backHref="/merchant/anuncios" eyebrow="Anúncios na Meta" title={a.nome} description="Acompanhe cada passo da sua campanha e fale com a equipe por aqui." />
      <SalaDaCampanha s={sala} lado="LOJISTA" nomesProdutos={nomes} />
    </>
  );
}
