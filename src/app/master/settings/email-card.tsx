"use client";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/app/form-field";
import { sendTestEmailAction } from "@/app/actions/email";

export function EmailTest({ configured, defaultTo }: { configured: boolean; defaultTo: string }) {
  const [busy, setBusy] = React.useState(false);
  return (
    <form className="flex flex-wrap items-end gap-2" onSubmit={async (e) => {
      e.preventDefault(); const to = String(new FormData(e.currentTarget).get("to") ?? "");
      setBusy(true); const r = await sendTestEmailAction(to); setBusy(false);
      if (!r.ok) toast.error(r.error); else if (r.data.status === "SENT") toast.success("E-mail de teste enviado."); else if (r.data.status === "LOGGED") toast.message("Sem provedor configurado: o e-mail só foi registrado."); else toast.error("O provedor recusou o envio. Confira a chave e o remetente.");
    }}>
      <FormField label="Enviar e-mail de teste para" htmlFor="em-test"><Input id="em-test" name="to" type="email" required defaultValue={defaultTo} className="w-72" /></FormField>
      <Button type="submit" loading={busy} variant={configured ? "primary" : "secondary"}>Enviar teste</Button>
    </form>
  );
}
