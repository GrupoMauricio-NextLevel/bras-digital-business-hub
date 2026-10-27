import { FaixaEquipePainel } from "@/components/portal/equipe/blocos";
import Link from "next/link";
import { notFound } from "next/navigation";
import { inArray } from "drizzle-orm";
import { Clapperboard, LogIn, Play, RotateCcw, Video } from "lucide-react";
import { getDb } from "@/db/client";
import { users } from "@/db/schema";
import { DEMO_PASSWORD } from "@/db/seed-constants";
import { isDemoMode } from "@/lib/auth";
import { AULAS, DEMO_LOGINS } from "@/lib/gravacao";
import { isRecordingMode } from "@/lib/gravacao-server";
import { loginAs } from "@/app/actions/auth";
import { enterAs, resetDemoAction, setRecordingMode } from "@/app/actions/gravacao";

export const dynamic = "force-dynamic";
export const metadata = { title: "Estúdio de gravação", robots: { index: false, follow: false } };

const MSG: Record<string, { tone: "ok" | "erro"; text: string }> = {
  recomecou: { tone: "ok", text: "Demonstração recomeçada: tudo voltou ao estado inicial. Entre de novo com quem vai aparecer na aula." },
  master: { tone: "erro", text: "Para recomeçar a demonstração, entre primeiro como “Dono (Master)” aqui embaixo e volte a esta página." },
  conta: { tone: "erro", text: "Essa conta não existe nesta demonstração. Recomece a demonstração para recriar todas as contas." },
};

/**
 * Estúdio de gravação (D144): só no ambiente de demonstração. Entrar como cada participante com um clique, roteiro de
 * aulas para o YouTube, modo gravação (esconde os atalhos de demonstração das telas) e recomeçar do zero.
 */
export default async function GravacaoPage({ searchParams }: { searchParams: Promise<{ ok?: string; erro?: string }> }) {
  if (!isDemoMode()) notFound();
  const sp = await searchParams;
  const recording = await isRecordingMode();
  const emails = DEMO_LOGINS.flatMap((g) => g.items.map((i) => i.email));
  const existing = new Set((await (await getDb()).select({ email: users.email }).from(users).where(inArray(users.email, emails))).map((u) => u.email));
  const msg = MSG[sp.ok ?? sp.erro ?? ""];
  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6">
      <div className="mx-auto grid max-w-5xl gap-8">
        <header className="grid gap-3">
          <p className="ds-eyebrow flex items-center gap-2"><Clapperboard className="size-4" aria-hidden /> Ambiente de demonstração</p>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Estúdio de gravação</h1>
          <p className="max-w-2xl text-muted-foreground">O sistema inteiro com dados fictícios para gravar os treinamentos. Pix e Mercado Pago são simulados: nada é cobrado e nenhum cliente real aparece. Senha de todas as contas: <code className="rounded bg-surface-muted px-1.5 py-0.5 text-sm">{DEMO_PASSWORD}</code>.</p>
          {msg ? <p role={msg.tone === "erro" ? "alert" : "status"} className={`rounded-lg px-3 py-2 text-sm ${msg.tone === "ok" ? "bg-success-soft text-success" : "bg-warning-soft text-warning"}`}>{msg.text}</p> : null}
        </header>
        <FaixaEquipePainel nome="eq-gravacao" titulo="Gravado aqui, no estúdio da NextLevel" texto="As aulas e os vídeos do sistema são gravados pela equipe na nossa sede em São Paulo." className="!mb-0" />

        <section aria-label="Antes de gravar" className="grid gap-3 md:grid-cols-2">
          <form action={setRecordingMode.bind(null, !recording)} className="grid content-start gap-2 rounded-xl border border-border bg-surface p-4">
            <h2 className="flex items-center gap-2 font-bold"><Video className="size-4" aria-hidden /> Modo gravação: {recording ? "ligado" : "desligado"}</h2>
            <p className="text-sm text-muted-foreground">Ligado, as telas ficam como o cliente vê: some o botão de trocar de perfil e a lista de perfis de demonstração na tela de entrada. Vale só neste navegador.</p>
            <button className={`ds-btn ${recording ? "ds-btn--secondary" : ""} justify-self-start`}>{recording ? "Desligar o modo gravação" : "Ligar o modo gravação"}</button>
          </form>
          <form action={resetDemoAction} className="grid content-start gap-2 rounded-xl border border-border bg-surface p-4">
            <h2 className="flex items-center gap-2 font-bold"><RotateCcw className="size-4" aria-hidden /> Recomeçar a demonstração</h2>
            <p className="text-sm text-muted-foreground">Volta tudo ao estado inicial (pedidos, estoques, pontos, contas) para cada aula começar igual. Leva alguns segundos e desconecta todo mundo. Precisa estar como “Dono (Master)”.</p>
            <button className="ds-btn ds-btn--secondary justify-self-start">Recomeçar do zero</button>
          </form>
        </section>

        <section aria-labelledby="h-quem" className="grid gap-4">
          <h2 id="h-quem" className="text-xl font-bold">Entrar como</h2>
          {DEMO_LOGINS.map((g) => (
            <div key={g.group} className="grid gap-2">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{g.group}</h3>
              <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {g.items.map((i) => (
                  <li key={i.email}>
                    <form action={loginAs.bind(null, i.email)} className="h-full">
                      <button disabled={!existing.has(i.email)} className="grid h-full w-full gap-1 rounded-xl border border-border bg-surface p-3 text-left hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-signal-text)] disabled:opacity-50">
                        <span className="flex items-center justify-between gap-2 font-semibold">{i.who}<LogIn className="size-4 shrink-0 text-muted-foreground" aria-hidden /></span>
                        <span className="text-sm text-muted-foreground">{i.shows}</span>
                        <span className="break-all font-mono text-xs text-muted-foreground">{i.email}</span>
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section aria-labelledby="h-aulas" className="grid gap-4">
          <h2 id="h-aulas" className="text-xl font-bold">Roteiro de aulas</h2>
          <p className="max-w-2xl text-sm text-muted-foreground">Uma aula por tarefa real, na ordem em que um cliente novo aprende. “Começar” já entra com a conta certa e abre a primeira tela.</p>
          {AULAS.map((s) => (
            <div key={s.serie} className="grid gap-2">
              <h3 className="text-base font-bold">{s.serie}</h3>
              <ol className="grid gap-2 md:grid-cols-2">
                {s.aulas.map((a) => (
                  <li key={a.n} className="grid content-start gap-2 rounded-xl border border-border bg-surface p-4">
                    <div className="flex items-start justify-between gap-3">
                      <span className="grid gap-0.5"><span className="font-mono text-xs text-muted-foreground">Aula {String(a.n).padStart(2, "0")}</span><b>{a.title}</b></span>
                      <form action={enterAs.bind(null, a.email, a.start)}><button disabled={!existing.has(a.email)} className="ds-btn ds-btn--sm shrink-0" aria-label={`Começar a aula ${a.n}: ${a.title}`}><Play /> Começar</button></form>
                    </div>
                    <ul className="list-disc space-y-0.5 pl-5 text-sm text-muted-foreground">{a.steps.map((st) => <li key={st}>{st}</li>)}</ul>
                    <span className="break-all font-mono text-xs text-muted-foreground">{a.email} · {a.start}</span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </section>
        <p className="text-sm text-muted-foreground"><Link className="font-medium text-link underline" href="/login">Tela de entrada</Link> · tudo aqui é fictício e só existe neste ambiente.</p>
      </div>
    </main>
  );
}
