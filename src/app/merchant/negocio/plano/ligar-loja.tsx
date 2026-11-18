"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ligarLojaVirtualAction } from "@/app/actions/plano-negocio";

/** Ligar a loja virtual que já vem no plano (D311); no Sites Start, a assinatura passa ao Start da loja (D336). */
export function LigarLoja({ mudaPlano }: { mudaPlano?: string | null }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  return (
    <ConfirmDialog trigger={<Button loading={pending}>Ligar a loja virtual</Button>} title="Ligar a loja virtual?" description={mudaPlano ?? "A loja já está no seu plano: não há cobrança nova. Catálogo, carrinho e checkout passam a aparecer no painel e no seu endereço, junto com o site."} confirmLabel="Ligar a loja"
      onConfirm={async () => { setPending(true); const r = await ligarLojaVirtualAction(); setPending(false); if (r.ok) { toast.success("Loja virtual ligada. Cadastre os produtos em Loja virtual → Produtos."); router.refresh(); } else toast.error(r.error); }} />
  );
}
