"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/app/form-field";
import { resetPasswordAction } from "@/app/actions/auth";

export function ResetForm({ token }: { token: string }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  return (
    <form className="mt-6 space-y-4" onSubmit={(e) => {
      e.preventDefault(); const f = new FormData(e.currentTarget); setError(null);
      if (f.get("p1") !== f.get("p2")) { setError("As senhas não conferem."); return; }
      start(async () => { const r = await resetPasswordAction(token, String(f.get("p1"))); if (r.ok) { toast.success("Senha alterada. Entre com a nova senha."); router.push("/login"); } else setError(r.error); });
    }}>
      <FormField label="Nova senha (mínimo 8 caracteres)" htmlFor="rs-p1"><Input id="rs-p1" name="p1" type="password" required minLength={8} autoComplete="new-password" /></FormField>
      <FormField label="Repita a nova senha" htmlFor="rs-p2" error={error ?? undefined}><Input id="rs-p2" name="p2" type="password" required minLength={8} autoComplete="new-password" /></FormField>
      <Button type="submit" className="w-full" loading={pending}>Salvar nova senha</Button>
    </form>
  );
}
