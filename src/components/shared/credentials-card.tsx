"use client";
import * as React from "react";
import { Copy, Check, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function CredentialsCard({ email, temporaryPassword, loginUrl }: { email: string; temporaryPassword: string; loginUrl?: string }) {
  const [copied, setCopied] = React.useState(false);
  const text = `Acesso à plataforma\nE-mail: ${email}\nSenha temporária: ${temporaryPassword}\n${loginUrl ? `Entrar: ${loginUrl}\n` : ""}Você deverá definir uma nova senha no primeiro acesso.`;
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setCopied(true); toast.success("Copiado"); setTimeout(() => setCopied(false), 1500); } catch { toast.error("Não foi possível copiar. Selecione o texto manualmente."); }
  };
  return (
    <div className="rounded-lg border border-success/30 bg-success-soft/40 p-4">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold"><KeyRound className="size-4 text-success" /> Acesso criado. Envie estes dados ao responsável.</div>
      <p className="mb-3 text-xs text-muted-foreground">A senha temporária aparece apenas uma vez. Se perder, use “Redefinir senha”.</p>
      <dl className="grid gap-1 rounded-md bg-surface p-3 font-mono text-sm">
        <div className="flex justify-between gap-4"><dt className="text-muted-foreground">E-mail</dt><dd className="select-all">{email}</dd></div>
        <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Senha temporária</dt><dd className="select-all font-semibold">{temporaryPassword}</dd></div>
      </dl>
      <Button size="sm" variant="secondary" className="mt-3" onClick={copy}>{copied ? <Check /> : <Copy />} Copiar dados de acesso</Button>
    </div>
  );
}
