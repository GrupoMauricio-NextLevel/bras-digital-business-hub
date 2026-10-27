"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ajustarEnderecoAction } from "@/app/actions/orders";

/** Ajustar o endereço antes do envio (D184): fica no histórico do pedido com o antes e o depois. */
export function AjustarEndereco({ orderId, atual }: { orderId: string; atual: { address: string; city: string; state: string; zip: string } }) {
  const router = useRouter();
  const [f, setF] = React.useState(atual);
  const [aberto, setAberto] = React.useState(false);
  const [pending, start] = React.useTransition();
  if (!aberto) return <Button variant="ghost" size="sm" className="mt-2 px-0" onClick={() => setAberto(true)}>Ajustar endereço</Button>;
  return (
    <form className="mt-3 grid gap-2" onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await ajustarEnderecoAction(orderId, f); if (r.ok) { toast.success("Endereço ajustado"); setAberto(false); router.refresh(); } else toast.error(r.error); }); }}>
      <label className="text-xs font-medium">Endereço com número<Input className="mt-1" value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} /></label>
      <div className="grid grid-cols-[1fr_4rem] gap-2">
        <label className="text-xs font-medium">Cidade<Input className="mt-1" value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} /></label>
        <label className="text-xs font-medium">UF<Input className="mt-1" maxLength={2} value={f.state} onChange={(e) => setF({ ...f, state: e.target.value })} /></label>
      </div>
      <label className="text-xs font-medium">CEP<Input className="mt-1" inputMode="numeric" value={f.zip} onChange={(e) => setF({ ...f, zip: e.target.value })} /></label>
      <div className="flex gap-2"><Button type="submit" size="sm" loading={pending}>Salvar endereço</Button><Button type="button" size="sm" variant="ghost" onClick={() => { setF(atual); setAberto(false); }}>Cancelar</Button></div>
    </form>
  );
}
