import { redirect } from "next/navigation";
import { getDb } from "@/db/client";
import { requireStoreAdmin } from "@/lib/require-session";
import { PageHeader } from "@/components/app/page-header";
import { configDaAcademia, ehAcademia } from "@/lib/domain/business/academia";
import { FormPaginaAcademia } from "./form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Página da academia" };

/** Página pública da academia: textos, modalidades, horários e dias da aula experimental (só o dono muda). */
export default async function Page() {
  const session = await requireStoreAdmin();
  const db = await getDb();
  if (!(await ehAcademia(db, session.actor.storeId))) redirect("/merchant");
  const { config, loja } = await configDaAcademia(db, session.actor);
  return (
    <div className="grid gap-6">
      <PageHeader backHref="/merchant/academia" eyebrow="NextLevel Business · Academia" title="Página da academia" description="O que aparece para quem chega pelo Instagram, WhatsApp, Google ou panfleto. Nome, logo, WhatsApp, Instagram e endereço vêm de Empresa e loja." />
      <FormPaginaAcademia inicial={config} pagina={`/academia/${loja.slug}`} />
    </div>
  );
}
