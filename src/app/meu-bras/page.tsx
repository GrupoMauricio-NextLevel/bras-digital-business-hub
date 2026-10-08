import Link from "next/link";
import { ArrowRight, Boxes, Clapperboard, MessageCircle, ShieldCheck } from "lucide-react";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { PageHeader } from "@/components/app/page-header";
import { getBrasMemberByUser } from "@/lib/domain/bras/membros";
import { listPublicBrasVideos } from "@/lib/domain/bras/videos";
import { brasBuyMessage, brasWhatsappUrl } from "@/lib/bras/contato";
import { BrasVideoCard } from "@/components/portal/bras/video-card";

export const dynamic = "force-dynamic";

export default async function MeuBras({ searchParams }: { searchParams: Promise<{ "bem-vindo"?: string }> }) {
  const session = await requireRole("BRAS_MEMBER");
  const db = await getDb();
  const [member, videos] = await Promise.all([getBrasMemberByUser(db, session.user.id), listPublicBrasVideos(db, 4)]);
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
            <p className="mt-2 max-w-xl text-[var(--bd-tinta-suave)]">Escolha pelo vídeo e chame a equipe da Brás Digital: ela confirma preço, caixas disponíveis e pagamento com você. Retirada no Brás pela sua transportadora.</p>
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
        {videos.length ? (
          <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {videos.map((v) => {
              const href = ativo ? brasWhatsappUrl(brasBuyMessage(company, v.title)) : null;
              return <li key={v.id}><BrasVideoCard tone="light" youtubeId={v.youtubeId} title={v.title} summary={v.summary} buy={href ? { href, label: "Quero comprar", external: true, note: "Preço e caixas: confirme com a equipe" } : { href: "/meu-bras/empresa", label: "Ver meu cadastro", note: "Preço oculto: cadastro em análise" }} /></li>;
            })}
          </ul>
        ) : (
          <div className="ds-card p-6 text-center"><Clapperboard className="mx-auto size-8 text-muted-foreground" aria-hidden /><p className="mt-2 font-semibold">Os primeiros vídeos estão sendo gravados.</p><p className="text-sm text-muted-foreground">Eles aparecem aqui assim que forem publicados.</p></div>
        )}
      </section>

      <section aria-label="O que vem a seguir" className="grid gap-4 md:grid-cols-2">
        <div className="ds-card p-5"><Boxes className="size-6 text-[var(--bd-laranja)]" aria-hidden /><h2 className="mt-2 font-bold">Catálogo com preço e caixas</h2><p className="mt-1 text-sm text-muted-foreground">Em preparação: quando as importadoras forem conectadas, o preço da caixa e o estoque aparecem aqui, e o pedido passa a ser feito pelo sistema.</p></div>
        <div className="ds-card p-5"><ShieldCheck className="size-6 text-[var(--bd-laranja)]" aria-hidden /><h2 className="mt-2 font-bold">Seus dados protegidos</h2><p className="mt-1 text-sm text-muted-foreground">A importadora recebe só o endereço de envio de cada pedido. Atendimento, ocorrências e trocas são com a Brás Digital.</p></div>
      </section>
    </>
  );
}
