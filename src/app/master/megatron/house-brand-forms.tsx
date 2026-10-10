"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/app/form-field";
import { CredentialsCard } from "@/components/shared/credentials-card";
import { createHouseBrandAdminAction, ensureHouseBrandAction } from "@/app/actions/house-brand";

export function EnsureHouseBrandButton() {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  return (
    <Button loading={pending} onClick={() => start(async () => { const r = await ensureHouseBrandAction(); if (r.ok) { toast.success("Mega Tron cadastrada"); router.refresh(); } else toast.error(r.error); })}>
      Cadastrar a Mega Tron agora
    </Button>
  );
}

export function HouseBrandAdminForm() {
  const [f, setF] = React.useState({ name: "", email: "" });
  const [done, setDone] = React.useState<{ email: string; temporaryPassword: string } | null>(null);
  const [pending, start] = React.useTransition();
  if (done) {
    return (
      <div className="space-y-3">
        <CredentialsCard email={done.email} temporaryPassword={done.temporaryPassword} loginUrl={typeof window !== "undefined" ? `${window.location.origin}/login` : undefined} />
        <Button variant="secondary" size="sm" onClick={() => { setDone(null); setF({ name: "", email: "" }); }}>Criar outro acesso</Button>
      </div>
    );
  }
  return (
    <form className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end" onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await createHouseBrandAdminAction(f); if (r.ok) { toast.success("Acesso criado"); setDone(r.data); } else toast.error(r.error); }); }}>
      <FormField label="Nome" htmlFor="hb-name"><Input id="hb-name" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Equipe Mega Tron" /></FormField>
      <FormField label="E-mail de acesso" htmlFor="hb-email"><Input id="hb-email" type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></FormField>
      <Button type="submit" loading={pending}>Criar acesso</Button>
    </form>
  );
}
