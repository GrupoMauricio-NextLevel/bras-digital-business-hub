import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { PageHeader } from "@/components/app/page-header";
import { getBrasMemberByUser } from "@/lib/domain/bras/membros";
import { BRAS_LEVEL_LABEL } from "@/lib/bras/perfil-perguntas";
import { brasMemberPanel } from "@/lib/domain/bras/painel";
import { ProfileForm } from "./profile-form";

export const dynamic = "force-dynamic";

/** Meu perfil (D108): as perguntas do cadastro, para quem se cadastrou antes delas ou mudou de momento. */
export default async function MeuPerfil() {
  const session = await requireRole("BRAS_MEMBER");
  const db = await getDb();
  const m = await getBrasMemberByUser(db, session.user.id);
  const panel = m ? await brasMemberPanel(db, m) : null;
  return (
    <>
      <PageHeader eyebrow="Meu Brás" title="Meu perfil de compra" description="Suas respostas deixam o painel do tamanho do seu negócio: quem está começando vê primeiro como acertar a primeira caixa; quem compra em volume vê contêiner e atendimento de perto." />
      {panel ? <p className="mb-6 rounded-lg bg-surface-muted px-4 py-3 text-sm">Seu painel hoje está ajustado para <b>{BRAS_LEVEL_LABEL[panel.level]}</b>. Mudou de momento? Atualize as respostas.</p> : null}
      <div className="ds-card max-w-3xl p-5"><ProfileForm initial={m?.profile ?? null} /></div>
    </>
  );
}
