import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Factory, Store, ShieldCheck, Handshake } from "lucide-react";
import { getSession, homeFor, isDemoMode } from "@/lib/auth";
import { listDemoUsers, loginAs } from "@/app/actions/auth";
import { Badge } from "@/components/ui/badge";
import { BrandLogo } from "@/components/brand/brand-logo";
import { AuthCardShell } from "@/components/auth/auth-card-shell";
import { getBrand } from "@/lib/brand-server";
import { LoginForm } from "./login-form";
import { DEMO_PASSWORD } from "@/db/seed-constants";

const ROLE_META = {
  NEXTLEVEL_MASTER: { label: "NextLevel Master", desc: "Controle global da plataforma", icon: ShieldCheck, tone: "neutral" as const },
  SUPPLIER_ADMIN: { label: "Fornecedor / Central", desc: "Catálogo, estoque e expedição", icon: Factory, tone: "info" as const },
  SUPPLIER_DISPATCH: { label: "Expedição", desc: "Fila de separação e etiquetas, sem valores", icon: Factory, tone: "info" as const },
  STORE_OWNER: { label: "Lojista", desc: "Loja white label e pedidos", icon: Store, tone: "brand" as const },
  AFFILIATE: { label: "Parceiro", desc: "Links, cupons e comissões", icon: Handshake, tone: "brand" as const },
};

const AREA: Record<string, string> = { fornecedor: "painel do fornecedor", loja: "painel da loja", afiliado: "painel do afiliado" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ area?: string; nome?: string; conta?: string }> }) {
  const sp = await searchParams;
  const session = await getSession();
  if (session) redirect(homeFor(session.user.role));
  if (sp.area === "afiliado") redirect("/parceiros/entrar");
  const brand = await getBrand();
  const demo = isDemoMode();
  const users = demo ? await listDemoUsers() : [];

  return (
    <AuthCardShell
      brand={brand.code}
      below={demo ? (
        <details className="rounded-[24px] bg-white/95 p-4 shadow-xl open:pb-5" open>
          <summary className="cursor-pointer text-sm font-semibold text-neutral-900">Perfis de demonstração</summary>
          <p role="note" className="mt-2 inline-block rounded bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-900">Ambiente de demonstração · Mercado Pago e Pix SIMULADOS, dados fictícios</p>
          <p className="mt-1 text-sm text-neutral-600">Entre com um clique. Senha de todos os perfis demo: <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs">{DEMO_PASSWORD}</code></p>
          <div className="mt-3 grid gap-2">
            {users.map((u) => {
              const meta = ROLE_META[u.role];
              return (
                <form key={u.id} action={loginAs.bind(null, u.email)}>
                  <button className="group flex w-full items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3 text-left transition-colors hover:border-neutral-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-signal-text)]">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600"><meta.icon className="size-4" aria-hidden /></span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2"><span className="truncate text-sm font-semibold text-neutral-900">{u.name}</span><Badge tone={meta.tone}>{meta.label}</Badge></span>
                      <span className="mt-0.5 block truncate text-xs text-neutral-600">{u.email} · {meta.desc}</span>
                    </span>
                    <ArrowRight className="size-4 text-neutral-400 transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </button>
                </form>
              );
            })}
          </div>
          <p className="mt-4 text-xs text-neutral-600">Vitrines públicas: <Link className="underline" href="/store/mantos-shop">/store/mantos-shop</Link> · <Link className="underline" href="/store/arena-10">/store/arena-10</Link></p>
        </details>
      ) : undefined}
    >
      <h1 className="sr-only">{brand.name}</h1>
      <BrandLogo brand={brand} className="h-9" priority />
      <h2 className="mt-8 font-[family-name:var(--nl-font-display)] text-3xl font-extrabold leading-tight tracking-tight text-neutral-950">Entre na sua conta</h2>
      {sp.conta === "criada" ? <p role="status" className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">Conta criada! Entre com o e-mail e a senha que você cadastrou.</p> : null}
      {sp.area && AREA[sp.area] ? <p className="mt-3 rounded-lg bg-neutral-100 px-3 py-2 text-sm text-neutral-800">Entrar no {AREA[sp.area]}{sp.nome && /^[a-z0-9-]+$/.test(sp.nome) ? ` · ${sp.nome}` : ""}.</p> : null}
      <p className="mt-2 text-sm text-neutral-600">Use o e-mail e a senha do seu cadastro ou do convite.</p>
      <div className="mt-6"><LoginForm /></div>
      <div className="mt-6 space-y-2 border-t border-neutral-200 pt-5 text-sm text-neutral-700">
        <p>{brand.signupOpen ? "Ainda não tem uma loja? " : "Quer uma loja? "}<Link href={brand.signupOpen ? "/cadastro" : "/quero-minha-loja"} className="font-semibold text-neutral-950 underline underline-offset-2">{brand.signupOpen ? "Criar agora" : "Falar com a gente"}</Link></p>
        {brand.modules.includes("partners") ? <p>É parceiro? <Link href="/parceiros/entrar" className="font-semibold text-neutral-950 underline underline-offset-2">Entrar como parceiro</Link></p> : null}
      </div>
    </AuthCardShell>
  );
}
