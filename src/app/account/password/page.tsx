import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { PasswordForm } from "./password-form";

export default async function PasswordPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-surface p-6 shadow-sm">
        <h1 className="text-lg font-semibold">{session.user.mustChangePassword ? "Defina sua senha" : "Alterar senha"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{session.user.mustChangePassword ? "Você entrou com uma senha temporária. Escolha uma senha definitiva para continuar." : "Use pelo menos 8 caracteres."}</p>
        <div className="mt-5"><PasswordForm requireCurrent={!session.user.mustChangePassword} /></div>
      </div>
    </div>
  );
}
