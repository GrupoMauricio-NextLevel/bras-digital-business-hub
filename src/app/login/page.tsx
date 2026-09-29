import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Factory, Store, ShieldCheck } from "lucide-react";
import { getSession, homeFor, isDemoMode } from "@/lib/auth";
import { listDemoUsers, loginAs } from "@/app/actions/auth";
import { Badge } from "@/components/ui/badge";
import { LoginForm } from "./login-form";
import { DEMO_PASSWORD } from "@/db/seed-constants";

const ROLE_META = {
  NEXTLEVEL_MASTER: { label: "NextLevel Master", desc: "Controle global da plataforma", icon: ShieldCheck, tone: "neutral" as const },
  SUPPLIER_ADMIN: { label: "Fornecedor / Central", desc: "Catálogo, estoque e expedição", icon: Factory, tone: "info" as const },
  SUPPLIER_DISPATCH: { label: "Expedição", desc: "Fila de separação e etiquetas, sem valores", icon: Factory, tone: "info" as const },
  STORE_OWNER: { label: "Lojista", desc: "Loja white label e pedidos", icon: Store, tone: "brand" as const },
};

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect(homeFor(session.user.role));
  const demo = isDemoMode();
  const users = demo ? await listDemoUsers() : [];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-12">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">NL</div>
          <div>
            <h1 className="text-lg font-semibold leading-tight">NextLevel Commerce Engine</h1>
            <p className="text-sm text-muted-foreground">SuperDrop</p>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-5">
          <div className="md:col-span-2">
            <h2 className="text-xl font-semibold tracking-tight">Entrar</h2>
            <p className="mt-1 text-sm text-muted-foreground">Use o e-mail e a senha recebidos no convite.</p>
            <div className="mt-5"><LoginForm /></div>
          </div>

          {demo ? (
            <div className="md:col-span-3">
              <h2 className="text-xl font-semibold tracking-tight">Perfis de demonstração</h2>
              <p className="mt-1 text-sm text-muted-foreground">Entre com um clique. Senha de todos os perfis demo: <code className="rounded bg-surface-muted px-1.5 py-0.5 text-xs">{DEMO_PASSWORD}</code></p>
              <div className="mt-5 grid gap-2">
                {users.map((u) => {
                  const meta = ROLE_META[u.role];
                  return (
                    <form key={u.id} action={loginAs.bind(null, u.email)}>
                      <button className="group flex w-full items-center gap-4 rounded-lg border border-border bg-surface p-3 text-left shadow-sm transition-all hover:border-border-strong hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-surface-muted text-muted-foreground"><meta.icon className="size-4" /></span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2"><span className="truncate text-sm font-semibold">{u.name}</span><Badge tone={meta.tone}>{meta.label}</Badge></span>
                          <span className="mt-0.5 block truncate text-xs text-muted-foreground">{u.email} · {meta.desc}</span>
                        </span>
                        <ArrowRight className="size-4 text-subtle-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                      </button>
                    </form>
                  );
                })}
              </div>
              <p className="mt-6 text-xs text-subtle-foreground">Storefronts públicas: <Link className="underline" href="/store/mantos-shop">/store/mantos-shop</Link> · <Link className="underline" href="/store/arena-10">/store/arena-10</Link></p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
