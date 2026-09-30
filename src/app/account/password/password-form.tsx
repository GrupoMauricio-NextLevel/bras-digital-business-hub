"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/app/form-field";
import { changePasswordAction } from "@/app/actions/auth";

export function PasswordForm({ requireCurrent }: { requireCurrent: boolean }) {
  const router = useRouter();
  const [current, setCurrent] = React.useState("");
  const [next, setNext] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [pending, start] = React.useTransition();
  return (
    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (next !== confirm) return toast.error("As senhas não coincidem."); start(async () => { const r = await changePasswordAction({ current, next }); if (r.ok) { toast.success("Senha atualizada"); router.push(r.data.redirectTo); router.refresh(); } else toast.error(r.error); }); }}>
      {requireCurrent ? <FormField label="Senha atual" htmlFor="cur"><Input id="cur" type="password" autoComplete="current-password" required value={current} onChange={(e) => setCurrent(e.target.value)} /></FormField> : null}
      <FormField label="Nova senha" htmlFor="new"><Input id="new" type="password" autoComplete="new-password" required minLength={8} value={next} onChange={(e) => setNext(e.target.value)} /></FormField>
      <FormField label="Confirmar nova senha" htmlFor="conf"><Input id="conf" type="password" autoComplete="new-password" required minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} /></FormField>
      <Button type="submit" className="w-full" loading={pending}>Salvar senha</Button>
    </form>
  );
}
