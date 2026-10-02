"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { removeDispatchUserAction } from "@/app/actions/dispatch";

export function RemoveMemberButton({ userId, name }: { userId: string; name: string }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();

  return (
    <ConfirmDialog
      trigger={<Button variant="ghost" size="icon-sm" aria-label={`Remover ${name}`}><Trash2 /></Button>}
      title="Remover acesso de expedição"
      description={`O acesso de ${name} será removido e qualquer separação assumida por este usuário será liberada.`}
      confirmLabel="Remover acesso"
      destructive
      onConfirm={async () => {
        start(async () => {
          const r = await removeDispatchUserAction(userId);
          if (r.ok) {
            toast.success("Acesso removido");
            router.refresh();
          } else {
            toast.error(r.error);
          }
        });
      }}
    />
  );
}
