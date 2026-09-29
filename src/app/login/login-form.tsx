"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/app/form-field";
import { loginAction } from "@/app/actions/auth";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, start] = React.useTransition();
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        start(async () => {
          const r = await loginAction({ email, password });
          if (r.ok) { toast.success("Bem-vindo!"); router.push(r.data.redirectTo); router.refresh(); } else setError(r.error);
        });
      }}
    >
      <FormField label="E-mail" htmlFor="email"><Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></FormField>
      <FormField label="Senha" htmlFor="password" error={error ?? undefined}><Input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} /></FormField>
      <Button type="submit" className="w-full" loading={pending}><LogIn /> Entrar</Button>
    </form>
  );
}
