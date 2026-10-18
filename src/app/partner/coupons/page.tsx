import { Ticket } from "lucide-react";
import { PageHeader, SectionTitle } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { listPartnerCoupons, partnerOfActor } from "@/lib/domain/partners";
import { getBaseUrl } from "@/lib/base-url";
import { getBrand } from "@/lib/brand-server";
import { textoConvite } from "@/lib/parceiros/convite";
import { CopyButton, CouponToggle, CreateCouponForm, WhatsAppShare } from "../partner-client";

export const dynamic = "force-dynamic";

export default async function PartnerCoupons() {
  const session = await requireRole("AFFILIATE");
  const db = await getDb();
  const [p, coupons, base] = await Promise.all([partnerOfActor(db, session.actor), listPartnerCoupons(db, session.actor), getBaseUrl()]);
  const marca = await getBrand();
  const link = (code: string) => `${base}/cadastro?cupom=${code}`;
  return (
    <>
      <PageHeader title="Cupons de 7 dias" description="O cliente que entra com o seu cupom testa 7 dias sem cartão e fica atribuído a você. O cupom vale mais que qualquer link." />
      <Card className="mb-8"><CardContent className="pt-5"><CreateCouponForm disabled={p.status !== "ACTIVE"} /></CardContent></Card>
      <SectionTitle title="Seus cupons" />
      {coupons.length === 0 ? <EmptyState compact icon={Ticket} title="Nenhum cupom ainda" description="Crie um código fácil de lembrar e mande o link pronto." /> : (
        <ul className="space-y-2">{coupons.map((c) => (
          <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface p-3">
            <div className="min-w-0"><p className="font-mono text-sm font-semibold">{c.code} <span className="ml-2 font-sans text-xs font-normal text-muted-foreground">{c.active ? "ativo" : "pausado"}</span></p><p className="text-xs text-muted-foreground">{c.redemptions} uso(s){c.maxRedemptions ? ` de ${c.maxRedemptions}` : ""} · {c.conversions} virou(aram) cliente pagante</p></div>
            <div className="flex flex-wrap items-center gap-2"><CopyButton text={link(c.code)} label="Copiar link com cupom" /><WhatsAppShare text={textoConvite(marca, link(c.code), c.code)} /><CouponToggle id={c.id} active={c.active} /></div>
          </li>
        ))}</ul>
      )}
    </>
  );
}
