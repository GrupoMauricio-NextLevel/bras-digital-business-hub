import Link from "next/link";
import { ArrowRight, Boxes, MessageCircle, ShieldCheck } from "lucide-react";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { PageHeader } from "@/components/app/page-header";
import { brasCommercialAccessFor, getBrasMemberByUser } from "@/lib/domain/bras/membros";
import { listBrasFeed } from "@/lib/domain/bras/catalogo";
import { brasWhatsappUrl } from "@/lib/bras/contato";
import { BrasFeed } from "./feed";

export const dynamic = "force-dynamic";

export default async function MeuBras({ searchParams }: { searchParams: Promise<{ "bem-vindo"?: string }> }) {
  const session = await requireRole("BRAS_MEMBER");
  const db = await getDb();
  const [member, videos] = await Promise.all([getBrasMemberByUser(db, session.user.id), brasCommercialAccessFor(db, session).then((a) => listBrasFeed(db, a, 4))]);
  const ativo = member?.status === "ACTIVE";
  const company = member?.companyName ?? session.user.name;
  const falar = brasWhatsappUrl(`Olá! Sou da ${company}, membro da Brás Digital. Quero fazer um pedido.`);
  const novo = (await searchParams)["bem-vindo"] === "1";
  return (
    <>
      <PageHeader eyebrow="Meu Brás" title={novo ? `Bem-vindo, ${session.user.name.split(" ")[0]}!` : `Olá, ${session.user.name.split(" ")[0]}`} description={`${company} · membro da Brás Digital`} />
      {novo ? <p role="status" className="mb-6 rounded-lg bg-success-soft px-4 py-3 text-sm text-success">Cadastro criado. Seu acesso de membro já está liberado.</p> : null}

      <section aria-labelledby="mb-comprar" className="bd-dark mb-8 overflow-hidden rounded-[22px] p-6 md:p-8">
        <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <h2 id="mb-comprar" className="bd-display text-3xl text-white">Como comprar agora</h2>
            <p className="mt-2 max-w-xl text-[var(--bd-tinta-suave)]">Escolha pelo vídeo, toque em Quero comprar e informe quantas caixas e para onde enviar. A equipe da Brás Digital confirma o pedido e o pagamento com você. Retirada no Brás pela sua transportadora.</p>
          </div>
          {ativo && falar
            ? <a href={falar} target="_blank" rel="noreferrer" className="bd-btn bd-btn--fogo"><MessageCircle className="size-5" aria-hidden />Falar com a equipe</a>
            : <p className="text-sm text-[var(--bd-tinta-suave)]">{ativo ? "O WhatsApp da equipe ainda não foi configurado." : "Disponível quando o cadastro estiver liberado."}</p>}
        </div>
      </section>

      <section aria-labelledby="mb-videos" className="mb-8">
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 id="mb-videos" className="text-xl font-bold">Vídeos recentes</h2>
          {videos.length ? <Link href="/meu-bras/videos" className="inline-flex items-center gap-1 text-sm font-semibold text-link underline">Ver todos<ArrowRight className="size-4" aria-hidden /></Link> : null}
        </div>
        <BrasFeed items={videos} ativo={ativo} company={company} />
      </section>

      <section aria-label="O que vem a seguir" className="grid gap-4 md:grid-cols-2">
        <Link href="/meu-bras/pedidos" className="ds-card ds-lift block p-5"><Boxes className="size-6 text-[var(--bd-laranja)]" aria-hidden /><h2 className="mt-2 font-bold">Meus pedidos</h2><p className="mt-1 text-sm text-muted-foreground">Acompanhe cada pedido: recebido, confirmado, pago e retirado.</p></Link>
        <div className="ds-card p-5"><ShieldCheck className="size-6 text-[var(--bd-laranja)]" aria-hidden /><h2 className="mt-2 font-bold">Seus dados protegidos</h2><p className="mt-1 text-sm text-muted-foreground">A importadora recebe só o endereço de envio de cada pedido. Atendimento, ocorrências e trocas são com a Brás Digital.</p></div>
      </section>
    </>
  );
}
