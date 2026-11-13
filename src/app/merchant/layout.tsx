import { requireRole } from "@/lib/require-session";
import { RoleLayout } from "@/components/app/role-layout";
import { getDb } from "@/db/client";
import { financeInvoices } from "@/db/schema";
import { isIndependentStore } from "@/lib/domain/independent";
import { and, eq } from "drizzle-orm";
import { formatBRL } from "@/lib/money";
import { Clock, Hourglass } from "lucide-react";
import Link from "next/link";
import { BlockedScreen } from "@/components/app/blocked-screen";
import { ensurePlanInvoice, storeAccess } from "@/lib/domain/store-access";
import { isDemoMode } from "@/lib/auth";
import { logout } from "@/app/actions/auth";
import { TrialDemoButton } from "./trial-demo-button";
import { leaveOwnStoreAction } from "@/app/actions/own-store";
import { Store as StoreIcon } from "lucide-react";
import { precisaAceitarTermos } from "@/lib/domain/termos-plataforma";
import { HASH_TERMOS } from "@/lib/contratos/termos-plataforma";
import { TermosView } from "@/components/contratos/termos-view";
import { AceiteTermos } from "@/components/contratos/aceite-termos";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("STORE_OWNER");
  let banner: React.ReactNode = null;
  // Termos de uso (D279): antes de qualquer tela, o dono da loja aceita a versão atual. Sem aceite, o painel não abre.
  const contaDemo = isDemoMode() && session.user.email.endsWith(".demo");
  if (await precisaAceitarTermos(await getDb(), session.actor, { contaDemo })) {
    if (!session.support) return (
      <main className="min-h-dvh bg-background px-4 py-8 text-foreground">
        <div className="mx-auto grid max-w-3xl gap-5">
          <div>
            <p className="text-sm font-semibold text-[#294cdc]">NextLevel Commerce</p>
            <h1 className="mt-1 text-2xl font-bold">Antes de começar, leia e aceite os termos de uso</h1>
            <p className="mt-1 text-sm text-muted-foreground">É o contrato de uso da plataforma. Seu painel abre logo depois do aceite.</p>
          </div>
          <div className="ds-card max-h-[60dvh] overflow-y-auto p-5" tabIndex={0} aria-label="Texto dos termos de uso"><TermosView compacto /></div>
          <AceiteTermos hash={HASH_TERMOS} nomeSugerido={session.user.name} logout={logout} />
        </div>
      </main>
    );
    banner = <div className="mb-6 rounded-lg border border-warning/40 bg-warning-soft/50 p-4 text-sm" data-termos-pendentes><span className="font-semibold">Modo suporte:</span> o dono desta loja ainda não aceitou os termos de uso. Quando ele entrar, o painel pede o aceite antes de abrir.</div>;
  }
  const access = session.store ? storeAccess(session.store) : null;
  if (session.store && access?.state === "BLOCKED") {
    const inv = await ensurePlanInvoice(await getDb(), session.store, 1);
    const reason = session.store.paidUntil ? "PLAN" : session.store.couponId ? "TRIAL" : "NEW";
    return <BlockedScreen storeName={session.store.name} reason={reason} invoice={{ id: inv.invoiceId, amountCents: inv.amountCents, description: inv.description }} demo={isDemoMode()} logout={logout} />;
  }
  if (access?.state === "TRIAL") {
    banner = (
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-lg border border-info/30 bg-info-soft p-4 text-sm text-info" data-trial-banner>
        <Hourglass className="size-4" aria-hidden />
        <div className="min-w-0 flex-1"><span className="font-semibold">Teste gratuito: {access.daysLeft} {access.daysLeft === 1 ? "dia restante" : "dias restantes"}.</span> Tudo está liberado. Para continuar depois, assine por Pix.</div>
        <Link href="/merchant/finance" className="font-semibold underline">Assinar agora</Link>
        {isDemoMode() ? <TrialDemoButton /> : null}
      </div>
    );
  }
  if (access?.state === "GRATIS") {
    // Porta de entrada (D126): o teste acabou e a loja continua no plano grátis, pagando a taxa do grátis sobre a venda.
    const fee = (session.store?.entryOffer as { freeTierFeeBps?: number } | null)?.freeTierFeeBps ?? 0;
    banner = (
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-lg border border-info/30 bg-info-soft p-4 text-sm text-info" data-free-tier-banner>
        <Hourglass className="size-4" aria-hidden />
        <div className="min-w-0 flex-1"><span className="font-semibold">Você está no plano grátis.</span> Sua loja continua vendendo; a taxa é de {(fee / 100).toLocaleString("pt-BR")}% sobre cada venda. Assinando, a taxa cai.</div>
        <Link href="/merchant/finance" className="font-semibold underline">Ver planos</Link>
      </div>
    );
  }
  if (session.store?.kind === "SUPPLIER_OWN" && !(await isIndependentStore(await getDb(), session.store.id))) {
    banner = (
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-lg border border-info/30 bg-info-soft p-4 text-sm text-info" data-own-store-banner>
        <StoreIcon className="size-4" aria-hidden />
        <div className="min-w-0 flex-1"><span className="font-semibold">Painel da loja própria de {session.store.name}.</span> Aqui você configura a vitrine, o tema, os preços e acompanha os pedidos do público. O estoque é o mesmo da Central.</div>
        <form action={leaveOwnStoreAction}><button className="font-semibold underline">Voltar ao painel do fornecedor</button></form>
      </div>
    );
  } else if (session.store?.status === "PENDING_PAYMENT") {
    const inv = await (await getDb()).query.financeInvoices.findFirst({ where: and(eq(financeInvoices.storeId, session.store.id), eq(financeInvoices.kind, "STORE_SETUP")) });
    banner = (
      <div className="mb-6 flex items-start gap-3 rounded-lg border border-warning/40 bg-warning-soft/50 p-4 text-sm">
        <Clock className="mt-0.5 size-4 text-warning" />
        <div><div className="font-semibold">Sua loja será liberada após o pagamento{inv ? ` de ${formatBRL(inv.amountCents)}` : ""} à NextLevel</div><p className="mt-0.5 text-muted-foreground">Enquanto isso você pode configurar aparência e produtos. A publicação e as vendas são liberadas quando o pagamento for confirmado.</p></div>
      </div>
    );
  }
  return <RoleLayout session={session} banner={banner}>{children}</RoleLayout>;
}
