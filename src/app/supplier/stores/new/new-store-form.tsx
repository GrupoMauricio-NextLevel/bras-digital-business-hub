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

export function NewStoreForm() {
  const [f, setF] = React.useState({ name: "", slug: "", tagline: "", whatsapp: "", ownerName: "", ownerEmail: "" });
  const [done, setDone] = React.useState<{ slug: string; email: string; temporaryPassword: string } | null>(null);
  const [pending, start] = React.useTransition();
  const slug = f.slug || slugify(f.name);
  if (done) {
    return (
      <div className="max-w-xl space-y-4">
        <CredentialsCard email={done.email} temporaryPassword={done.temporaryPassword} loginUrl={typeof window !== "undefined" ? `${window.location.origin}/login` : undefined} />
        <p className="text-sm text-muted-foreground">Loja criada em <a className="underline" href={`/store/${done.slug}`} target="_blank" rel="noreferrer">/store/{done.slug}</a>. Ela fica visível ao público quando o lojista publicar.</p>
        <div className="flex gap-2"><Link href="/supplier/stores" className={buttonVariants()}>Ver lojistas</Link><Button variant="secondary" onClick={() => setDone(null)}>Criar outra</Button></div>
      </div>
    );
  }
  return (
    <form className="grid max-w-3xl gap-4 lg:grid-cols-2" onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await createStoreAction({ ...f, slug: slug || undefined, tagline: f.tagline || undefined, whatsapp: f.whatsapp || undefined }); if (r.ok) { toast.success("Loja criada"); setDone({ slug: r.data.slug, ...r.data.credentials }); } else toast.error(r.error); }); }}>
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
          <Button type="submit" className="w-full" loading={pending}>Criar loja e convidar</Button>
        </CardContent>
      </Card>
    </form>
  );
}
