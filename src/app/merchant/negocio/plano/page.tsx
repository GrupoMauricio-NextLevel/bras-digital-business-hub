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

export const dynamic = "force-dynamic";

/** Plano do negócio (NextLevel Business, NB8, D310): o pacote de hoje e a contratação do segundo caminho. */
export default async function PlanoDoNegocio() {
  const session = await requireStoreAdmin();
  const db = await getDb();
  const p = await planoDoNegocio(db, session.actor);
  if (!p.business) return <><PageHeader title="Plano do negócio" /><EmptyState icon={Layers} title="Disponível com o NextLevel Business" description="Quando o gerenciador do negócio estiver ligado na sua conta, aqui você vê o seu pacote e liga site ou loja virtual." /></>;
  const incluidos = p.ofertas.filter((o) => o.ativo);
  const paraContratar = p.ofertas.filter((o) => !o.incluido);
  return (
    <>
      <PageHeader eyebrow={NOME_GERENCIADOR.nome} title="Plano do negócio" description="O seu plano já traz o painel do negócio e o primeiro caminho que você escolheu. O outro caminho você liga aqui, quando precisar, sem trocar de conta." />
      <Card className="mb-6"><CardContent className="space-y-3 py-5">
        <p className="text-sm text-muted-foreground">Seu pacote hoje</p>
        <p className="text-2xl font-semibold tracking-tight">{PACOTE_ROTULO[p.pacote]}</p>
        <ul className="grid gap-2 text-sm sm:grid-cols-2">
          <li className="flex items-center gap-2"><Check className="size-4 text-success" aria-hidden />{NOME_GERENCIADOR.nome}: visão geral, contatos e orçamentos, clientes, pedidos e vendas, financeiro</li>
          {incluidos.map((o) => <li key={o.key} className="flex items-center gap-2"><Check className="size-4 text-success" aria-hidden />{o.name}{o.incluido ? " (incluído no plano)" : o.endsAt ? ` (contratado até ${new Date(o.endsAt).toLocaleDateString("pt-BR")})` : " (contratado)"}</li>)}
        </ul>
        <p className="text-sm"><Link href="/merchant/finance#assinatura" className="font-semibold text-link underline underline-offset-4">Ver a minha assinatura</Link></p>
      </CardContent></Card>
      <h2 className="mb-3 text-base font-semibold">Ligar mais um caminho</h2>
      {paraContratar.length ? <AddonCards addons={paraContratar} demo={isDemoMode()} /> : <p className="text-sm text-muted-foreground">Você já tem site e loja virtual.</p>}
      <p className="mt-4 text-xs text-muted-foreground">Contratar gera a fatura (Pix ou cartão). O módulo liga assim que o pagamento é confirmado; nada do que você já tem muda.</p>
    </>
  );
}
