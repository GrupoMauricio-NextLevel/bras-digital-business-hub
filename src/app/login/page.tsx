import { isRecordingMode } from "@/lib/gravacao-server";
import Link from "next/link";
import { FioCaptacao } from "@/components/ecossistema/fio-captacao";
import { redirect } from "next/navigation";
import { ArrowRight, Factory, Store, ShieldCheck, Handshake } from "lucide-react";
import { getSession, homeFor, isDemoMode } from "@/lib/auth";
import { listDemoUsers, loginAs } from "@/app/actions/auth";
import { Badge } from "@/components/ui/badge";
import { BrandLogo } from "@/components/brand/brand-logo";
import { AuthCardShell } from "@/components/auth/auth-card-shell";
import { getBrand } from "@/lib/brand-server";
import { HOLDING_CODE, loginInviteFor } from "@/lib/brand";
import { LoginForm } from "./login-form";
import { DEMO_PASSWORD } from "@/db/seed-constants";

const ROLE_META = {
  NEXTLEVEL_MASTER: { label: "NextLevel Master", desc: "Controle global da plataforma", icon: ShieldCheck, tone: "neutral" as const },
  SUPPLIER_ADMIN: { label: "Fornecedor / Central", desc: "Catálogo, estoque e expedição", icon: Factory, tone: "info" as const },
  SUPPLIER_DISPATCH: { label: "Expedição", desc: "Fila de separação e etiquetas, sem valores", icon: Factory, tone: "info" as const },
  STORE_OWNER: { label: "Lojista", desc: "Loja white label e pedidos", icon: Store, tone: "brand" as const },
  AFFILIATE: { label: "Parceiro", desc: "Links, cupons e comissões", icon: Handshake, tone: "brand" as const },
  BRAS_MEMBER: { label: "Membro Brás", desc: "Atacado em caixa fechada", icon: Store, tone: "brand" as const },
  BRAS_IMPORTER: { label: "Importadora Brás", desc: "Pedidos, produtos e estoque em caixas", icon: Factory, tone: "info" as const },
  CARRIER: { label: "Transportadora", desc: "Cargas, coletas e extrato (NextLevel Cargas)", icon: Factory, tone: "info" as const },
};

const AREA: Record<string, string> = { fornecedor: "painel do fornecedor", loja: "painel da loja", afiliado: "painel do afiliado" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ area?: string; nome?: string; conta?: string; voltar?: string; error?: string }> }) {
  const sp = await searchParams;
  const session = await getSession();
  // Retorno só para a vitrine de temas do lojista (endereço fixo, nada de redirecionamento aberto).
  const voltar = sp.voltar && (/^\/merchant\/templates(\?ver=[a-z0-9-]{1,30})?$/.test(sp.voltar) || /^\/merchant\/services\/solucao\/[a-z0-9-]{3,60}$/.test(sp.voltar)) ? sp.voltar : undefined;
  if (session) redirect(voltar && session.user.role === "STORE_OWNER" ? voltar : homeFor(session.user.role));
  if (sp.area === "afiliado") redirect("/parceiros/entrar");
  const brand = await getBrand();
  const demo = isDemoMode() && !(await isRecordingMode());
  const users = demo ? await listDemoUsers() : [];
  const invite = loginInviteFor(brand);

  return (
    <AuthCardShell
      brand={brand.code}
      below={<><FioCaptacao brandCode={brand.code} />{demo ? (
        <details className="rounded-[24px] bg-surface/95 p-4 shadow-xl open:pb-5" open>
          <summary className="cursor-pointer text-sm font-semibold text-foreground">Perfis de demonstração</summary>
          <p role="note" className="mt-2 inline-block rounded bg-warning-soft px-2 py-1 text-xs font-semibold text-warning">Ambiente de demonstração · Mercado Pago e Pix SIMULADOS, dados fictícios</p>
          <p className="mt-1 text-sm text-muted-foreground">Entre com um clique. Senha de todos os perfis demo: <code className="rounded bg-surface-muted px-1.5 py-0.5 text-xs">{DEMO_PASSWORD}</code></p>
          <div className="mt-3 grid gap-2">
            {users.map((u) => {
              const meta = ROLE_META[u.role];
              return (
                <form key={u.id} action={loginAs.bind(null, u.email)}>
                  <button className="group flex w-full items-center gap-3 rounded-xl border border-border bg-surface p-3 text-left transition-colors hover:border-border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-signal-text)]">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-muted-foreground"><meta.icon className="size-4" aria-hidden /></span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2"><span className="truncate text-sm font-semibold text-foreground">{u.name}</span><Badge tone={meta.tone}>{meta.label}</Badge></span>
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">{u.email} · {meta.desc}</span>
                    </span>
                    <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </button>
                </form>
              );
            })}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">Gravar treinamentos: <Link className="underline" href="/gravacao">Estúdio de gravação</Link> · Vitrines públicas: <Link className="underline" href="/store/mantos-shop">/store/mantos-shop</Link> · <Link className="underline" href="/store/arena-10">/store/arena-10</Link></p>
        </details>
      ) : null}</>}
    >
      <h1 className="sr-only">{brand.name}</h1>
      <BrandLogo brand={brand} className="h-9" priority />
      <h2 className="mt-8 font-[family-name:var(--nl-font-display)] text-3xl font-extrabold leading-tight tracking-tight text-foreground">Entre na sua conta</h2>
      {sp.conta === "criada" ? <p role="status" className="mt-3 rounded-lg bg-success-soft px-3 py-2 text-sm text-success">Conta criada! Entre com o e-mail e a senha que você cadastrou.</p> : null}
      {sp.error === "passagem" ? <p role="alert" className="mt-3 rounded-lg bg-warning-soft px-3 py-2 text-sm text-warning">O link para trocar de marca expirou ou já foi usado. Entre com o seu e-mail e senha.</p> : null}
      {sp.area && AREA[sp.area] ? <p className="mt-3 rounded-lg bg-surface-muted px-3 py-2 text-sm text-foreground">Entrar no {AREA[sp.area]}{sp.nome && /^[a-z0-9-]+$/.test(sp.nome) ? ` · ${sp.nome}` : ""}.</p> : null}
      <p className="mt-2 text-sm text-muted-foreground">Use o e-mail e a senha do seu cadastro ou do convite.</p>
      <div className="mt-6"><LoginForm voltar={voltar} /></div>
      <div className="mt-6 space-y-2 border-t border-border pt-5 text-sm text-body">
        {invite ? <p>{invite.lead ? `${invite.lead} ` : ""}<Link href={invite.href} className="font-semibold text-foreground underline underline-offset-2">{invite.label}</Link></p> : <p className="text-muted-foreground">Acesso restrito à equipe NextLevel.</p>}
        {brand.code !== HOLDING_CODE && brand.partnersOpen ? <p>É parceiro? <Link href="/parceiros/entrar" className="font-semibold text-foreground underline underline-offset-2">Entrar como parceiro</Link></p> : null}
      </div>
    </AuthCardShell>
  );
}
