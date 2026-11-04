import { redirect } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { getDb } from "@/db/client";
import { perfilAtual } from "@/lib/perfil-loja-server";
import { requireStoreAdmin } from "@/lib/require-session";
import { editingContextFor } from "@/lib/themes/license";
import { draftRevisions, resolveGlobals, resolveTemplate } from "@/lib/themes/store";
import { BannersPainel } from "./painel";

export const dynamic = "force-dynamic";

/** Banners (D238, L2): todos os pontos de banner da loja numa tela só, com troca de imagem, texto, link e agenda. */
export default async function BannersPage() {
  const session = await requireStoreAdmin();
  const store = session.store!;
  if (!(await perfilAtual(store.id)).pode.storefront) redirect("/merchant");
  const db = await getDb();
  const [home, collection, globals, ctx, revisions] = await Promise.all([
    resolveTemplate(db, store, "home", { draft: true }), resolveTemplate(db, store, "collection", { draft: true }),
    resolveGlobals(db, store, { draft: true }), editingContextFor(db, store), draftRevisions(db, store.id),
  ]);
  return (
    <>
      <PageHeader title="Banners" description="Troque as imagens, os textos e os links de cada banner da loja, num lugar só. As mudanças entram na loja ao publicar." />
      <BannersPainel
        slug={store.slug} nivel={ctx.level} tema={ctx.themeName}
        inicial={{ home: home.template, collection: collection.template, globals: globals.globals }} revisoes={revisions}
      />
    </>
  );
}
