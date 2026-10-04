"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { anonymizeCustomerAction, revokeConsentAction, updateCustomerProfileAction } from "@/app/actions/crm";

export function CustomerProfileForm({ storeCustomerId, notes, tags, consents }: { storeCustomerId: string; notes: string; tags: string; consents: string[] }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [n, setN] = React.useState(notes);
  const [t, setT] = React.useState(tags);
  return (
    <Card>
      <CardHeader><CardTitle>Perfil na sua loja</CardTitle></CardHeader>
      <CardContent className="space-y-4 text-sm">
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await updateCustomerProfileAction(storeCustomerId, { notes: n, tags: t }); if (r.ok) { toast.success("Perfil salvo"); router.refresh(); } else toast.error(r.error); }); }}>
          <label className="block"><span className="mb-1 block font-medium">Etiquetas (separadas por vírgula)</span><Input value={t} onChange={(e) => setT(e.target.value)} placeholder="atacado, vip" /></label>
          <label className="block"><span className="mb-1 block font-medium">Anotação interna</span><textarea className="min-h-24 w-full rounded-md border border-border bg-surface p-2" maxLength={1000} value={n} onChange={(e) => setN(e.target.value)} /></label>
          <Button type="submit" loading={pending}>Salvar</Button>
        </form>
        <div className="border-t border-border pt-3">
          <p className="font-medium">Consentimento de marketing</p>
          {consents.length ? (
            <>
              <p className="text-muted-foreground">Autorizado: {consents.map((c) => c.split("_")[0]).join(", ")}.</p>
              <Button variant="secondary" className="mt-2" loading={pending} onClick={() => { if (window.confirm("Revogar o consentimento deste cliente? Ele sai das exportações.")) start(async () => { const r = await revokeConsentAction(storeCustomerId); if (r.ok) { toast.success("Consentimento revogado"); router.refresh(); } else toast.error(r.error); }); }}>Revogar consentimento</Button>
            </>
          ) : <p className="text-muted-foreground">Sem consentimento: não use este contato em campanhas.</p>}
        </div>
        <div className="border-t border-border pt-3">
          <p className="font-medium">Dados pessoais deste cliente</p>
          <p className="text-muted-foreground">O titular pode pedir uma cópia dos dados ou a exclusão. A exclusão remove nome, e-mail, telefone, endereço e anotações; os pedidos ficam com valores e datas, sem identificação.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <a href={`/api/store/customer/${storeCustomerId}/export`} className="inline-flex h-9 items-center rounded-md border border-border bg-surface px-4 text-sm font-medium hover:bg-surface-hover">Baixar os dados</a>
            <Button variant="danger" loading={pending} onClick={() => { if (window.confirm("Excluir os dados pessoais deste cliente? Não dá para desfazer.")) start(async () => { const r = await anonymizeCustomerAction(storeCustomerId); if (r.ok) { toast.success("Dados do cliente removidos."); router.push("/merchant/customers"); router.refresh(); } else toast.error(r.error); }); }}>Excluir dados do cliente</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
