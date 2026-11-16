import Link from "next/link";
import { Check, Layers } from "lucide-react";
import { getDb } from "@/db/client";
import { requireStoreAdmin } from "@/lib/require-session";
import { isDemoMode } from "@/lib/auth";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { AddonCards } from "@/components/finance/addon-cards";
import { PACOTE_ROTULO, planoDoNegocio } from "@/lib/business/planos";
import { NOME_GERENCIADOR } from "@/lib/marcas/nextlevel-ecommerce";
import { LigarLoja } from "./ligar-loja";

export const dynamic = "force-dynamic";

/** Plano do negócio (NextLevel Business, NB8, D310): o pacote de hoje e a contratação do segundo caminho. */
export default async function PlanoDoNegocio() {
  const session = await requireStoreAdmin();
  const db = await getDb();
  const p = await planoDoNegocio(db, session.actor);
  if (!p.business) return <><PageHeader title="Plano do negócio" /><EmptyState icon={Layers} title="Disponível com o NextLevel Business" description="Quando o gerenciador do negócio estiver ligado na sua conta, aqui você vê o seu pacote e liga site ou loja virtual." /></>;
  return (
    <>
      <PageHeader eyebrow={NOME_GERENCIADOR.nome} title="Plano do negócio" description="O seu plano (Start, Pro ou Scale) traz o painel do negócio e a loja virtual. Quem entrou pelo site liga a loja aqui, sem cobrança nova; quem entrou pela loja pode contratar o site." />
      <Card className="mb-6"><CardContent className="space-y-3 py-5">
        <p className="text-sm text-muted-foreground">Seu pacote hoje</p>
        <p className="text-2xl font-semibold tracking-tight">{PACOTE_ROTULO[p.pacote]}</p>
        <ul className="grid gap-2 text-sm sm:grid-cols-2">
          <li className="flex items-center gap-2"><Check className="size-4 text-success" aria-hidden />{NOME_GERENCIADOR.nome}: visão geral, contatos e orçamentos, clientes, pedidos e vendas, financeiro</li>
          {p.temSite ? <li className="flex items-center gap-2"><Check className="size-4 text-success" aria-hidden />Site para a empresa{p.siteIncluido ? " (incluído no plano)" : p.adicionalSite?.endsAt ? ` (contratado até ${new Date(p.adicionalSite.endsAt).toLocaleDateString("pt-BR")})` : " (contratado)"}</li> : null}
          {p.temLoja ? <li className="flex items-center gap-2"><Check className="size-4 text-success" aria-hidden />Loja virtual (incluída no plano)</li> : null}
        </ul>
        <p className="text-sm"><Link href="/merchant/finance#assinatura" className="font-semibold text-link underline underline-offset-4">Ver a minha assinatura</Link></p>
      </CardContent></Card>
      {p.podeLigarLoja ? (
        <Card className="mb-6"><CardContent className="space-y-3 py-5">
          <h2 className="text-base font-semibold">Loja virtual</h2>
          <p className="text-sm text-muted-foreground">Já está no seu plano. Ao ligar, catálogo, carrinho e checkout aparecem no painel e no seu endereço, junto com o site.</p>
          <LigarLoja />
        </CardContent></Card>
      ) : null}
      {!p.temSite && p.adicionalSite ? (
        <section><h2 className="mb-3 text-base font-semibold">Site para a empresa</h2><AddonCards addons={[p.adicionalSite]} demo={isDemoMode()} />
          <p className="mt-4 text-xs text-muted-foreground">Contratar gera a fatura (Pix ou cartão). O site liga assim que o pagamento é confirmado; a sua loja não muda.</p></section>
      ) : null}
      {p.temSite && p.temLoja ? <p className="text-sm text-muted-foreground">Você já tem site e loja virtual.</p> : null}
    </>
  );
}
