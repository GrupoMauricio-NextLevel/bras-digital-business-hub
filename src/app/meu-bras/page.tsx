import Link from "next/link";
import { ArrowRight, Boxes, Crown, LifeBuoy, MessageCircle, ShieldCheck, Sparkles } from "lucide-react";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { PageHeader } from "@/components/app/page-header";
import { getBrasMemberByUser, touchBrasMemberSeen } from "@/lib/domain/bras/membros";
import { countNewBrasDiscoveries } from "@/lib/domain/bras/videos";
import { brasAccessFor } from "@/lib/domain/bras/descobertas";
import { BRAS_NEXT_STEP, BRAS_REQUEST_LABEL, listBrasFeed, listMyBrasRequests } from "@/lib/domain/bras/catalogo";
import { brasWhatsappUrl } from "@/lib/bras/contato";
import { BrasFeed } from "./feed";
import { brasMemberPanel } from "@/lib/domain/bras/painel";
import { myBrasUnreadReplies } from "@/lib/domain/bras/suporte";
import { listCatalog } from "@/lib/domain/nl-catalog";
import { priceLines } from "@/lib/finance/catalog-labels";
import { BRAS_LEVEL_LABEL } from "@/lib/bras/perfil-perguntas";
import { BRAS_PLAN_LABEL, brasPlanRank, type BrasMemberPlan } from "@/lib/bras/planos";
import { PlanRequestButton } from "./plano-client";

export const dynamic = "force-dynamic";

export default async function MeuBras({ searchParams }: { searchParams: Promise<{ "bem-vindo"?: string }> }) {
  const session = await requireRole("BRAS_MEMBER");
  const db = await getDb();
  const [member, videos] = await Promise.all([getBrasMemberByUser(db, session.user.id), brasAccessFor(db, session).then((a) => listBrasFeed(db, a.level, 4))]);
  const ativo = member?.status === "ACTIVE";
  // Novas desde a última visita (D104), contadas antes de gravar a visita de agora.
  const [novas, pedidos] = await Promise.all([countNewBrasDiscoveries(db, member?.lastSeenAt ?? null), ativo ? listMyBrasRequests(db, session.actor) : Promise.resolve([])]);
  // Painel por nível e momento (D108), calculado antes de gravar a visita (o momento "esfriando" usa a última visita).
  const [panel, respostas, planos] = await Promise.all([
    member && ativo ? brasMemberPanel(db, member) : Promise.resolve(null),
    member ? myBrasUnreadReplies(db, member.id) : Promise.resolve(0),
    listCatalog(db, { includeUnpublished: true, families: ["BRAS_MEMBER_PLAN"] }),
  ]);
  if (member) await touchBrasMemberSeen(db, member.id, member.lastSeenAt);
  const andamento = pedidos.filter((r) => r.status === "NEW" || r.status === "CONFIRMED" || r.status === "PAID").slice(0, 3);
  const company = member?.companyName ?? session.user.name;
  const falar = brasWhatsappUrl(`Olá! Sou da ${company}, membro da Brás Digital. Quero fazer um pedido.`);
  const novo = (await searchParams)["bem-vindo"] === "1";
  return (
    <>
      <PageHeader eyebrow="Meu Brás" title={novo ? `Bem-vindo, ${session.user.name.split(" ")[0]}!` : `Olá, ${session.user.name.split(" ")[0]}`} description={`${company} · membro da Brás Digital`} />
      {novo ? <p role="status" className="mb-6 rounded-lg bg-success-soft px-4 py-3 text-sm text-success">Cadastro criado. Seu acesso de membro já está liberado.</p> : null}

      {respostas ? <p role="status" className="mb-6 rounded-lg bg-info-soft px-4 py-3 text-sm"><b>{respostas === 1 ? "1 resposta nova" : `${respostas} respostas novas`}</b> da equipe. <Link href="/meu-bras/suporte#chat" className="font-semibold text-link underline">Abrir o chat</Link></p> : null}
      {panel ? (
        <section aria-labelledby="mb-agora" className="mb-8">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <h2 id="mb-agora" className="text-xl font-bold">{panel.headline}</h2>
            <p className="text-sm text-muted-foreground">Painel para <b>{BRAS_LEVEL_LABEL[panel.level]}</b> · plano <b>{BRAS_PLAN_LABEL[panel.plan]}</b> · <Link href="/meu-bras/perfil" className="text-link underline">ajustar meu perfil</Link></p>
          </div>
          <ul className="grid gap-3 md:grid-cols-3">
            {panel.cards.map((c, i) => (
              <li key={c.id} className={`ds-card flex flex-col p-5 ${i === 0 ? "border-2 border-[var(--bd-laranja)]" : ""}`}>
                <p className="flex items-center gap-2 font-bold">{i === 0 ? <Sparkles className="size-4 text-[var(--bd-laranja)]" aria-hidden /> : null}{c.title}{c.soon ? <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs font-semibold">Em preparação</span> : null}</p>
                <p className="mt-1 flex-1 text-sm text-muted-foreground">{c.text}</p>
                <Link href={c.href} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-link underline">{c.cta}<ArrowRight className="size-4" aria-hidden /></Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {novas ? <p role="status" className="mb-6 rounded-lg bg-[var(--bd-laranja)]/10 px-4 py-3 text-sm"><b>{novas === 1 ? "1 descoberta nova" : `${novas} descobertas novas`}</b> desde a sua última visita. <Link href="/meu-bras/videos" className="font-semibold text-link underline">Ver agora</Link></p> : null}
      {andamento.length ? (
        <section aria-labelledby="mb-andamento" className="mb-8">
          <h2 id="mb-andamento" className="mb-3 text-xl font-bold">Seus pedidos em andamento</h2>
          <ul className="grid gap-3 md:grid-cols-3">
            {andamento.map((r) => (
              <li key={r.id} className="ds-card p-4">
                <p className="flex items-center justify-between gap-2 text-sm font-semibold"><span className="tabular-nums">Pedido {r.number}</span><span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs">{BRAS_REQUEST_LABEL[r.status]}</span></p>
                <p className="mt-1 text-sm">{r.boxes} caixa(s) de {r.productTitle}</p>
                <p className="mt-2 text-sm text-muted-foreground">{BRAS_NEXT_STEP[r.status]}</p>
                {r.status !== "NEW" ? <Link href={`/meu-bras/pedidos/${r.id}/retirada`} className="mt-2 inline-block text-sm font-semibold text-link underline">Comprovante de retirada</Link> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="mb-comprar" className="bd-dark mb-8 overflow-hidden rounded-[22px] p-6 md:p-8">
        <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <h2 id="mb-comprar" className="bd-display text-3xl text-white">Como comprar agora</h2>
            <p className="mt-2 max-w-xl text-[var(--bd-tinta-suave)]">Abra a descoberta, veja a análise e o preço da caixa, toque em Quero comprar e informe quantas caixas e para onde enviar. A equipe da Brás Digital confirma o pedido e o pagamento com você. Retirada no Brás pela sua transportadora.</p>
          </div>
          {ativo && falar
            ? <a href={falar} target="_blank" rel="noreferrer" className="bd-btn bd-btn--fogo"><MessageCircle className="size-5" aria-hidden />Falar com a equipe</a>
            : <p className="text-sm text-[var(--bd-tinta-suave)]">{ativo ? "O WhatsApp da equipe ainda não foi configurado." : "Disponível quando o cadastro estiver liberado."}</p>}
        </div>
      </section>

      <section aria-labelledby="mb-videos" className="mb-8">
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 id="mb-videos" className="text-xl font-bold">Descobertas recentes</h2>
          {videos.length ? <Link href="/meu-bras/videos" className="inline-flex items-center gap-1 text-sm font-semibold text-link underline">Ver todos<ArrowRight className="size-4" aria-hidden /></Link> : null}
        </div>
        <BrasFeed items={videos} ativo={ativo} />
      </section>

      {panel ? (
        <section id="plano" aria-labelledby="mb-plano" className="mb-8 scroll-mt-20">
          <h2 id="mb-plano" className="mb-1 flex items-center gap-2 text-xl font-bold"><Crown className="size-5 text-[var(--bd-laranja)]" aria-hidden />Seu plano: {BRAS_PLAN_LABEL[panel.plan]}</h2>
          <p className="mb-4 text-sm text-muted-foreground">Comprar caixas é grátis em qualquer plano. Os planos pagos liberam inteligência e atendimento. Nenhum plano garante venda ou lucro.</p>
          <ul className="grid gap-3 md:grid-cols-3">
            {planos.map((p) => {
              const code = (p.meta.plan as BrasMemberPlan | undefined) ?? "PRATA";
              const atual = code === panel.plan;
              const acima = brasPlanRank(code) > brasPlanRank(panel.plan);
              return (
                <li key={p.id} className={`ds-card flex flex-col p-5 ${atual ? "border-2 border-[var(--bd-laranja)]" : ""}`}>
                  <p className="font-bold">{p.name.replace("Brás ", "")}{atual ? <span className="ml-2 rounded-full bg-success-soft px-2 py-0.5 text-xs text-success">Seu plano</span> : null}</p>
                  <p className="text-sm font-semibold tabular-nums">{p.status === "PUBLISHED" ? priceLines(p).main : "Valor na abertura dos planos"}</p>
                  <ul className="mt-2 flex-1 space-y-1 text-sm text-muted-foreground">{p.content.scope.map((x) => <li key={x}>· {x}</li>)}</ul>
                  {acima && (code === "PRATA" || code === "OURO" || code === "PLATINUM") ? <div className="mt-3"><PlanRequestButton plan={code} label={p.name.replace("Brás ", "")} /></div> : null}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <section aria-label="O que vem a seguir" className="grid gap-4 md:grid-cols-3">
        <Link href="/meu-bras/suporte" className="ds-card ds-lift block p-5"><LifeBuoy className="size-6 text-[var(--bd-laranja)]" aria-hidden /><h2 className="mt-2 font-bold">Suporte</h2><p className="mt-1 text-sm text-muted-foreground">Perguntas frequentes, chat, WhatsApp e agenda na importadora, conforme o seu plano.</p></Link>
        <Link href="/meu-bras/pedidos" className="ds-card ds-lift block p-5"><Boxes className="size-6 text-[var(--bd-laranja)]" aria-hidden /><h2 className="mt-2 font-bold">Meus pedidos</h2><p className="mt-1 text-sm text-muted-foreground">Acompanhe cada pedido: recebido, confirmado, pago e retirado.</p></Link>
        <div className="ds-card p-5"><ShieldCheck className="size-6 text-[var(--bd-laranja)]" aria-hidden /><h2 className="mt-2 font-bold">Seus dados protegidos</h2><p className="mt-1 text-sm text-muted-foreground">A importadora recebe só o endereço de envio de cada pedido. Atendimento, ocorrências e trocas são com a Brás Digital.</p></div>
      </section>
    </>
  );
}
