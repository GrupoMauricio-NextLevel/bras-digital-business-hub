"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { salvarDadosJuridicosAction } from "@/app/actions/agencias";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Dados jurídicos da agência (D321): saem nos contratos com os clientes. */
export function DadosDaAgencia({ inicial }: { inicial: { razaoSocial: string; documento: string; cidadeForo: string } }) {
  const router = useRouter();
  const [d, setD] = React.useState(inicial);
  const [pending, start] = React.useTransition();
  const campo = (k: keyof typeof d, rotulo: string, dica?: string) => <label className="text-sm font-medium">{rotulo}<Input value={d[k]} onChange={(e) => setD({ ...d, [k]: e.target.value })} placeholder={dica} className="mt-1" /></label>;
  return (
    <form className="grid gap-3 sm:grid-cols-3" aria-label="Dados da agência" onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await salvarDadosJuridicosAction(d); if (r.ok) { toast.success("Dados da agência salvos."); router.refresh(); } else toast.error(r.error); }); }}>
      {campo("razaoSocial", "Razão social")}
      {campo("documento", "CNPJ ou CPF")}
      {campo("cidadeForo", "Cidade do foro", "São Paulo/SP")}
      <div className="sm:col-span-3"><Button type="submit" loading={pending}>Salvar dados</Button></div>
    </form>
  );
}
