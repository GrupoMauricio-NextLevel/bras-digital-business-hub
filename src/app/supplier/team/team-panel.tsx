"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { FormField } from "@/components/app/form-field";
import { createDispatchUserAction } from "@/app/actions/dispatch";

export function TeamPanel({ seatsUsed, seatsTotal }: { seatsUsed: number; seatsTotal: number }) {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [created, setCreated] = React.useState<{ email: string; temporaryPassword: string } | null>(null);
  const full = seatsUsed >= seatsTotal;
  return (
    <Card><CardContent className="space-y-4 pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-base font-semibold">Novo usuário de expedição</h2><span className="text-sm text-muted-foreground">{seatsUsed} de {seatsTotal} assentos usados{full ? " · contrate um assento extra em Financeiro > Add-ons" : ""}</span></div>
      <form className="flex flex-wrap items-end gap-3" onSubmit={async (e) => { e.preventDefault(); setBusy(true); const r = await createDispatchUserAction({ name, email }); setBusy(false); if (r.ok) { setCreated(r.data); setName(""); setEmail(""); router.refresh(); } else toast.error(r.error); }}>
        <FormField label="Nome" htmlFor="tm-name" className="min-w-48 flex-1"><Input id="tm-name" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} /></FormField>
        <FormField label="E-mail" htmlFor="tm-email" className="min-w-56 flex-1"><Input id="tm-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></FormField>
        <Button type="submit" loading={busy} disabled={full}><UserPlus /> Criar acesso</Button>
      </form>
      {created ? (
        <div role="status" className="rounded-lg border border-success/40 bg-success-soft/50 p-3 text-sm">
          <p className="font-medium">Acesso criado. Entregue estes dados ao funcionário (a senha só aparece agora):</p>
          <dl className="mt-2 grid gap-1 sm:grid-cols-2"><div><dt className="text-xs text-muted-foreground">E-mail</dt><dd className="select-all font-mono">{created.email}</dd></div><div><dt className="text-xs text-muted-foreground">Senha temporária</dt><dd className="select-all font-mono">{created.temporaryPassword}</dd></div></dl>
        </div>
      ) : null}
    </CardContent></Card>
  );
}
