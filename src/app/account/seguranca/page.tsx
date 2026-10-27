import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession, homeFor } from "@/lib/auth";
import { podeUsarDuasEtapas, temDuasEtapas } from "@/lib/domain/seguranca-conta";
import { formatDateTime } from "@/lib/utils";
import { DuasEtapas, SairDosOutros } from "./seguranca-forms";

export const dynamic = "force-dynamic";

/** Segurança da conta (W0, D183): último acesso, sair dos outros aparelhos e, para o Master, a verificação em duas etapas. */
export default async function SegurancaPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const u = session.user;
  return (
    <main className="flex min-h-screen items-start justify-center bg-background p-4 sm:items-center">
      <div className="w-full max-w-lg space-y-5 rounded-lg border border-border bg-surface p-6 shadow-sm">
        <div>
          <h1 className="text-lg font-semibold">Segurança da conta</h1>
          <p className="mt-1 text-sm text-muted-foreground">Cada pessoa da equipe deve ter o próprio acesso. Nunca compartilhe a sua senha, nem com alguém da NextLevel.</p>
        </div>
        <section aria-labelledby="ultimo-acesso" className="rounded-lg border border-border p-4 text-sm">
          <h2 id="ultimo-acesso" className="font-semibold">Última entrada</h2>
          <p className="mt-1 text-body">{u.lastLoginAt ? formatDateTime(u.lastLoginAt) : "Sem registro"}{u.lastLoginIp ? ` · endereço de internet (IP) ${u.lastLoginIp}` : ""}</p>
          <p className="mt-1 text-xs text-muted-foreground">Não reconhece? Troque a senha e saia dos outros aparelhos.</p>
        </section>
        {session.support ? <p className="rounded-lg bg-warning-soft px-3 py-2 text-sm">Você está em modo suporte: as opções abaixo só a própria pessoa pode usar.</p> : (
          <>
            <SairDosOutros />
            {podeUsarDuasEtapas(u) ? <DuasEtapas ligada={temDuasEtapas(u)} desde={u.totpEnabledAt ? formatDateTime(u.totpEnabledAt) : null} restantes={u.totpRecovery?.length ?? 0} /> : null}
          </>
        )}
        <div className="flex flex-wrap gap-4 text-sm font-medium">
          <Link href="/account/password" className="underline underline-offset-2">Alterar senha</Link>
          <Link href={homeFor(u.role)} className="underline underline-offset-2">Voltar ao painel</Link>
        </div>
      </div>
    </main>
  );
}
