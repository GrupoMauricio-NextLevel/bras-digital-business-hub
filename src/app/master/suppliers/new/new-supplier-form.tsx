"use client";
import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/app/form-field";
import { Input, Select } from "@/components/ui/input";
import { CredentialsCard } from "@/components/shared/credentials-card";
import { createSupplierAction } from "@/app/actions/provisioning";

export function NewSupplierForm() {
  const [f, setF] = React.useState({ name: "", city: "", state: "SP", businessModel: "SUPERDROP" as "SUPERDROP" | "WHITE_LABEL", adminName: "", adminEmail: "" });
  const [done, setDone] = React.useState<{ email: string; temporaryPassword: string } | null>(null);
  const [pending, start] = React.useTransition();
  if (done) {
    return (
      <div className="max-w-xl space-y-4">
        <CredentialsCard email={done.email} temporaryPassword={done.temporaryPassword} loginUrl={typeof window !== "undefined" ? `${window.location.origin}/login` : undefined} />
        <div className="flex gap-2"><Link href="/master/suppliers" className={buttonVariants()}>Ver fornecedores</Link><Button variant="secondary" onClick={() => setDone(null)}>Criar outro</Button></div>
      </div>
    );
  }
  return (
    <form className="grid max-w-3xl gap-4 lg:grid-cols-2" onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await createSupplierAction(f); if (r.ok) { toast.success("Fornecedor criado"); setDone(r.data.credentials); } else toast.error(r.error); }); }}>
      <Card>
        <CardHeader><CardTitle>Fornecedor</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <FormField label="Nome / marca" htmlFor="name"><Input id="name" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Central Sports" /></FormField>
          <div className="grid grid-cols-3 gap-2">
            <FormField label="Cidade" htmlFor="city" className="col-span-2"><Input id="city" value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} /></FormField>
            <FormField label="UF" htmlFor="state"><Input id="state" maxLength={2} value={f.state} onChange={(e) => setF({ ...f, state: e.target.value.toUpperCase() })} /></FormField>
          </div>
          <FormField label="Modelo comercial" htmlFor="model" hint={f.businessModel === "SUPERDROP" ? "R$ 0 setup + 6% do faturamento" : "R$ 6.000 setup + 3% do faturamento"}>
            <Select id="model" value={f.businessModel} onChange={(e) => setF({ ...f, businessModel: e.target.value as typeof f.businessModel })}><option value="SUPERDROP">SuperDrop</option><option value="WHITE_LABEL">White Label</option></Select>
          </FormField>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Administrador</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <FormField label="Nome" htmlFor="an"><Input id="an" required value={f.adminName} onChange={(e) => setF({ ...f, adminName: e.target.value })} /></FormField>
          <FormField label="E-mail de acesso" htmlFor="ae" hint="Receberá uma senha temporária"><Input id="ae" type="email" required value={f.adminEmail} onChange={(e) => setF({ ...f, adminEmail: e.target.value })} /></FormField>
          <Button type="submit" className="w-full" loading={pending}>Criar fornecedor</Button>
        </CardContent>
      </Card>
    </form>
  );
}
