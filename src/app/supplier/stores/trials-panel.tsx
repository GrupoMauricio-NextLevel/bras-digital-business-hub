"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Copy, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createCouponAction, extendTrialAction } from "@/app/actions/trials";

export type CouponRow = { id: string; code: string; trialDays: number; redemptions: number; maxRedemptions: number | null };

/** Cupons de teste do fornecedor: criar, copiar o link de cadastro e ver os usos. */
export function CouponsCard({ coupons, origin }: { coupons: CouponRow[]; origin: string }) {
  const router = useRouter();
  const [code, setCode] = React.useState("");
  const [pending, start] = React.useTransition();
  const link = (c: string) => `${origin}/cadastro?cupom=${c}`;
  return (
    <Card className="mb-6">
      <CardHeader><div><CardTitle className="flex items-center gap-2"><Ticket className="size-4" aria-hidden /> Cupons de teste de 7 dias</CardTitle><CardDescription>Quem se cadastra com o seu cupom testa tudo por 7 dias e entra na sua rede. Um teste por CPF/CNPJ.</CardDescription></div></CardHeader>
      <CardContent className="space-y-3">
        {coupons.length === 0 ? <p className="text-sm text-muted-foreground">Você ainda não tem cupom.</p> : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {coupons.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
                <div><span className="font-mono font-semibold">{c.code}</span> <span className="text-muted-foreground">· {c.trialDays} dias · {c.redemptions}{c.maxRedemptions !== null ? ` de ${c.maxRedemptions}` : ""} {c.redemptions === 1 ? "uso" : "usos"}</span></div>
                <Button size="sm" variant="secondary" onClick={() => { void navigator.clipboard?.writeText(link(c.code)); toast.success("Link de cadastro copiado"); }}><Copy /> Copiar link</Button>
              </li>
            ))}
          </ul>
        )}
        <form className="flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await createCouponAction({ code }); if (r.ok) { toast.success(`Cupom ${r.data.code} criado`); setCode(""); router.refresh(); } else toast.error(r.error); }); }}>
          <Input aria-label="Novo cupom" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="NOVOCUPOM" className="max-w-56" required minLength={3} maxLength={24} />
          <Button type="submit" loading={pending}>Criar cupom</Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function ExtendTrialButton({ storeId }: { storeId: string }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  return <Button size="sm" variant="ghost" loading={pending} onClick={() => start(async () => { const r = await extendTrialAction(storeId, 3); if (r.ok) { toast.success("Teste prorrogado em 3 dias"); router.refresh(); } else toast.error(r.error); })}>+3 dias</Button>;
}
