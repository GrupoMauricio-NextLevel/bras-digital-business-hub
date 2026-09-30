"use client";
import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/app/form-field";
import { Input } from "@/components/ui/input";
import { CredentialsCard } from "@/components/shared/credentials-card";
import { createStoreAction } from "@/app/actions/provisioning";
import { slugify } from "@/lib/ids";
import { formatBRL } from "@/lib/money";
import { cn } from "@/lib/utils";

type OfferView = { key: "DROP_MANUAL" | "STORE_SUBDOMAIN" | "STORE_OWN"; name: string; description: string; setupCents: number; monthlyCents: number; commissionCents: number };

export function NewStoreForm({ offers }: { offers: OfferView[] }) {
  const [f, setF] = React.useState({ name: "", slug: "", tagline: "", whatsapp: "", ownerName: "", ownerEmail: "", offer: (offers.find((o) => o.key === "STORE_OWN") ?? offers[0])!.key });
  const [done, setDone] = React.useState<{ slug: string; email: string; temporaryPassword: string; requiresPayment: boolean; setupCents: number; commissionCents: number; totalCents: number } | null>(null);
  const chosen = offers.find((o) => o.key === f.offer)!;
  const [pending, start] = React.useTransition();
  const slug = f.slug || slugify(f.name);
  if (done) {
    return (
      <div className="max-w-xl space-y-4">
        <CredentialsCard email={done.email} temporaryPassword={done.temporaryPassword} loginUrl={typeof window !== "undefined" ? `${window.location.origin}/login` : undefined} />
        {done.requiresPayment ? (
          <div className="rounded-lg border border-warning/40 bg-warning-soft/50 p-4 text-sm">
            <div className="font-semibold">Aguardando pagamento à NextLevel: {formatBRL(done.totalCents)}</div>
            <p className="mt-1 text-muted-foreground">Setup de {formatBRL(done.setupCents)} mais a primeira mensalidade. A loja é liberada quando a NextLevel confirmar o recebimento. Sua comissão de {formatBRL(done.commissionCents)} entra em garantia a partir da confirmação e é abatida na sua fatura de fechamento.</p>
          </div>
        ) : <p className="text-sm text-muted-foreground">Loja criada e já liberada, pois esta oferta não tem setup.</p>}
        <p className="text-sm text-muted-foreground">Endereço: <a className="underline" href={`/store/${done.slug}`} target="_blank" rel="noreferrer">/store/{done.slug}</a>. Fica visível ao público quando o lojista publicar.</p>
        <div className="flex gap-2"><Link href="/supplier/stores" className={buttonVariants()}>Ver lojistas</Link><Button variant="secondary" onClick={() => setDone(null)}>Criar outra</Button></div>
      </div>
    );
  }
  return (
    <form className="grid max-w-4xl gap-4 lg:grid-cols-2" onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await createStoreAction({ ...f, offer: f.offer, slug: slug || undefined, tagline: f.tagline || undefined, whatsapp: f.whatsapp || undefined }); if (r.ok) { toast.success("Loja criada"); setDone({ slug: r.data.slug, ...r.data.credentials, requiresPayment: r.data.requiresPayment, setupCents: r.data.setupCents, commissionCents: r.data.commissionCents, totalCents: r.data.setupCents + (offers.find((o) => o.key === r.data.offer)?.monthlyCents ?? 0) }); } else toast.error(r.error); }); }}>
      <Card className="lg:col-span-2">
        <CardHeader><CardTitle>Oferta</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          {offers.map((o) => (
            <button type="button" key={o.key} onClick={() => setF({ ...f, offer: o.key })} className={cn("rounded-lg border p-4 text-left transition-colors", f.offer === o.key ? "border-primary ring-1 ring-primary" : "border-border hover:bg-surface-muted")}>
              <div className="text-sm font-semibold">{o.name}</div>
              <div className="mt-1 text-xs text-muted-foreground">{o.description}</div>
              <div className="mt-3 text-sm"><span className="font-semibold tabular-nums">{formatBRL(o.setupCents)}</span> <span className="text-xs text-muted-foreground">setup</span> · <span className="font-semibold tabular-nums">{formatBRL(o.monthlyCents)}</span> <span className="text-xs text-muted-foreground">por mês</span></div>
              <div className="mt-1 text-xs font-medium text-success">{o.commissionCents > 0 ? `Sua comissão: ${formatBRL(o.commissionCents)}` : "Sem comissão"}</div>
            </button>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Loja</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <FormField label="Nome da loja" htmlFor="name"><Input id="name" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Mantos Shop" /></FormField>
          <FormField label="Endereço" htmlFor="slug" hint={`/store/${slug || "…"}`}><Input id="slug" value={f.slug} onChange={(e) => setF({ ...f, slug: slugify(e.target.value) })} placeholder={slugify(f.name) || "mantos-shop"} /></FormField>
          <FormField label="Slogan (opcional)" htmlFor="tag"><Input id="tag" value={f.tagline} onChange={(e) => setF({ ...f, tagline: e.target.value })} /></FormField>
          <FormField label="WhatsApp da loja (opcional)" htmlFor="wa"><Input id="wa" value={f.whatsapp} onChange={(e) => setF({ ...f, whatsapp: e.target.value })} placeholder="5511999990000" /></FormField>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Lojista (dono)</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <FormField label="Nome" htmlFor="on"><Input id="on" required value={f.ownerName} onChange={(e) => setF({ ...f, ownerName: e.target.value })} /></FormField>
          <FormField label="E-mail de acesso" htmlFor="oe" hint="Receberá uma senha temporária"><Input id="oe" type="email" required value={f.ownerEmail} onChange={(e) => setF({ ...f, ownerEmail: e.target.value })} /></FormField>
          <Button type="submit" className="w-full" loading={pending}>Criar loja ({chosen.name}) e convidar</Button>
        </CardContent>
      </Card>
    </form>
  );
}
