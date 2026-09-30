"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { publishStoreAction } from "@/app/actions/merchant";

export function PublishToggle({ published }: { published: boolean }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  if (published) {
    return (
      <ConfirmDialog trigger={<Button variant="secondary" className="w-full">Despublicar loja</Button>} title="Despublicar loja" description="Clientes verão uma página de loja indisponível até você publicar novamente." confirmLabel="Despublicar" destructive onConfirm={async () => { const r = await publishStoreAction(false); if (r.ok) { toast.success("Loja despublicada"); router.refresh(); } else toast.error(r.error); }} />
    );
  }
  return <Button className="w-full" variant="brand" loading={pending} onClick={() => start(async () => { const r = await publishStoreAction(true); if (r.ok) { toast.success("Loja publicada!"); router.refresh(); } else toast.error(r.error); })}>Publicar loja</Button>;
}
