"use client";
import * as React from "react";
import { toast } from "sonner";
import { KeyRound } from "lucide-react";
import { ActionMenu } from "@/components/app/action-menu";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { CredentialsCard } from "@/components/shared/credentials-card";
import { resetPasswordAction } from "@/app/actions/provisioning";

export function StoreOwnerActions({ owner }: { owner: { id: string; name: string; email: string } | null }) {
  const [creds, setCreds] = React.useState<{ email: string; temporaryPassword: string } | null>(null);
  if (!owner) return null;
  return (
    <>
      <ActionMenu actions={[{ label: `Redefinir senha de ${owner.name.split(" ")[0]}`, icon: <KeyRound />, onSelect: async () => { const r = await resetPasswordAction(owner.id); if (r.ok) setCreds(r.data); else toast.error(r.error); } }]} />
      <Dialog open={!!creds} onOpenChange={(o) => !o && setCreds(null)}>
        {creds ? <DialogContent title="Nova senha temporária" description={owner.email}><CredentialsCard email={creds.email} temporaryPassword={creds.temporaryPassword} /></DialogContent> : null}
      </Dialog>
    </>
  );
}
