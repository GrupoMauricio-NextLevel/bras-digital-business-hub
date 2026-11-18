import Link from "next/link";
import { Check, Globe, Handshake, Layers, LayoutDashboard, Store } from "lucide-react";
import { getDb } from "@/db/client";
import { requireStoreAdmin } from "@/lib/require-session";
import { isDemoMode } from "@/lib/auth";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { AddonCards } from "@/components/finance/addon-cards";
import { PACOTE_ROTULO, planoDoNegocio } from "@/lib/business/planos";
import { NOME_GERENCIADOR } from "@/lib/marcas/nextlevel-ecommerce";
import { FRENTES } from "@/lib/marcas/frentes";
import { formatBRL } from "@/lib/money";
import { LigarLoja } from "./ligar-loja";

export const dynamic = "force-dynamic";

const Titulo = ({ icone: Icone, nome, ligado }: { icone: typeof Store; nome: string; ligado: boolean }) => (
  <h2 className="flex flex-wrap items-center gap-2 text-base font-semibold">
    <span className="grid size-8 place-items-center rounded-lg bg-[var(--ds-link)]/10 text-[var(--ds-link)]"><Icone className="size-4" aria-hidden /></span>{nome}
    {ligado ? <span className="rounded-full bg-success-soft px-2 py-0.5 text-xs font-semibold text-success">Ligado</span> : null}
  </h2>
);

/**
 * Plano do negócio (NB8, D310; ecossistema D336): a vitrine interna das quatro frentes. O que já está ligado, o site com
 * o desconto do segundo produto, a loja (que no Sites Start passa o plano ao Start da loja), o NextLevel Business
 * (incluso no Scale) e as Soluções da agência.
 */
export default async function PlanoDoNegocio() {
  const session = await requireStoreAdmin();
  const db = await getDb();
  const p = await planoDoNegocio(db, session.actor);
  if (!p.business) return <><PageHeader title="Plano do negócio" /><EmptyState icon={Layers} title="Ainda não está ligado na sua conta" description="Quando o gerenciador do negócio estiver ligado na sua conta, aqui você vê o seu pacote e liga site ou loja virtual." /></>;
  const ciclo = (c: string) => (c === "ANNUAL" ? "/ano" : "/mês");
  return (
    <>
      <PageHeader eyebrow={NOME_GERENCIADOR.nome} title="Plano do negócio" description="Uma conta, quatro portas: loja virtual, site, NextLevel Business e as soluções da agência. Ligue o que faltar sem trocar de conta." />
      <Card className="mb-6"><CardContent className="space-y-3 py-5">
        <p className="text-sm text-muted-foreground">Seu pacote hoje</p>
        <p className="text-2xl font-semibold tracking-tight">{PACOTE_ROTULO[p.pacote]}{p.temBusiness ? " + NextLevel Business" : ""}</p>
        <ul className="grid gap-2 text-sm sm:grid-cols-2">
          <li className="flex items-center gap-2"><Check className="size-4 text-success" aria-hidden />Meu negócio: visão geral, contatos e orçamentos, clientes, pedidos e vendas, financeiro</li>
          {p.temSite ? <li className="flex items-center gap-2"><Check className="size-4 text-success" aria-hidden />Site para a empresa{p.siteIncluido ? " (incluído no plano)" : p.adicionalSite?.endsAt ? ` (contratado até ${new Date(p.adicionalSite.endsAt).toLocaleDateString("pt-BR")})` : " (contratado)"}</li> : null}
          {p.temLoja ? <li className="flex items-center gap-2"><Check className="size-4 text-success" aria-hidden />Loja virtual (incluída no plano)</li> : null}
          {p.temBusiness ? <li className="flex items-center gap-2"><Check className="size-4 text-success" aria-hidden />NextLevel Business Essencial{p.businessNoPlano ? " (incluso no Scale)" : ""}</li> : null}
        </ul>
        <p className="text-sm"><Link href="/merchant/finance#assinatura" className="font-semibold text-link underline underline-offset-4">Ver a minha assinatura</Link></p>
      </CardContent></Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card id="loja" className="scroll-mt-20"><CardContent className="space-y-3 py-5">
          <Titulo icone={Store} nome={FRENTES.commerce.nome} ligado={p.temLoja} />
          <p className="text-sm text-muted-foreground">{FRENTES.commerce.linha}</p>
          {p.temLoja ? <Link href="/merchant/storefront" className="text-sm font-semibold text-link underline underline-offset-4">Abrir a minha loja</Link>
            : p.podeLigarLoja ? <>
              {p.lojaMudaPlano ? <p className="text-sm">Você está no <b>Sites Start</b>. Ao ligar a loja, o plano passa ao <b>Start da loja virtual</b> ({formatBRL(p.lojaMudaPlano.para)}{ciclo(p.lojaMudaPlano.ciclo)}, com o site incluso), a partir da próxima fatura.</p>
                : <p className="text-sm">Já está no seu plano: ao ligar, catálogo, carrinho e checkout aparecem no painel e no seu endereço, junto com o site.</p>}
              <LigarLoja mudaPlano={p.lojaMudaPlano ? `O plano passa ao Start da loja virtual (${formatBRL(p.lojaMudaPlano.para)}${ciclo(p.lojaMudaPlano.ciclo)}, com o site incluso), a partir da próxima fatura. Catálogo, carrinho e checkout aparecem no painel e no seu endereço.` : null} />
            </> : null}
        </CardContent></Card>

        <Card id="site" className="scroll-mt-20"><CardContent className="space-y-3 py-5">
          <Titulo icone={Globe} nome={FRENTES.sites.nome} ligado={p.temSite} />
          <p className="text-sm text-muted-foreground">{FRENTES.sites.linha}</p>
          {p.temSite ? <Link href="/merchant/site/paginas" className="text-sm font-semibold text-link underline underline-offset-4">Páginas do site</Link>
            : p.adicionalSite ? <>
              {p.precoSite && p.precoSite.descontoBps ? <p className="text-sm">Segundo produto com <b>{p.precoSite.descontoBps / 100}% de desconto</b>: de <s>{formatBRL(p.precoSite.cheioCents)}</s> por <b>{formatBRL(p.precoSite.monthlyCents)}/mês</b>.</p> : null}
              <AddonCards addons={[p.adicionalSite]} demo={isDemoMode()} />
              <p className="text-xs text-muted-foreground">Contratar gera a fatura (Pix ou cartão). O site liga assim que o pagamento é confirmado; a sua loja não muda.</p>
            </> : null}
        </CardContent></Card>

        <Card id="business" className="scroll-mt-20"><CardContent className="space-y-3 py-5">
          <Titulo icone={LayoutDashboard} nome={FRENTES.business.nome} ligado={p.temBusiness} />
          <p className="text-sm text-muted-foreground">{FRENTES.business.linha}</p>
          {p.temBusiness ? <p className="text-sm">O Business Essencial está ligado{p.businessNoPlano ? " pelo seu plano Scale" : ""}: funil de clientes, contatos com origem, atendimento e equipe já estão no menu.</p>
            : <p className="text-sm">Para clientes da NextLevel, a partir de <b>{formatBRL(p.businessAPartirDeCents)}/mês</b>. O plano Scale já traz o Business Essencial. A contratação é com a equipe, com demonstração antes.</p>}
          <span className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <Link href="/business" className="font-semibold text-link underline underline-offset-4">Como funciona</Link>
            {p.temBusiness ? null : <Link href="/merchant/services" className="font-semibold text-link underline underline-offset-4">Falar com a equipe</Link>}
          </span>
        </CardContent></Card>

        <Card id="solucoes" className="scroll-mt-20"><CardContent className="space-y-3 py-5">
          <Titulo icone={Handshake} nome={FRENTES.solucoes.nome} ligado={false} />
          <p className="text-sm text-muted-foreground">{FRENTES.solucoes.linha}</p>
          <span className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <Link href="/merchant/services" className="font-semibold text-link underline underline-offset-4">Loja NextLevel (serviços)</Link>
            <Link href="/merchant/anuncios" className="font-semibold text-link underline underline-offset-4">Anúncios na Meta com a equipe</Link>
          </span>
        </CardContent></Card>
      </div>
    </>
  );
}
