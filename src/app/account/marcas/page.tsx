import Link from "next/link";
import { redirect } from "next/navigation";
import { getDb } from "@/db/client";
import { getSession, homeFor } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { canJoinGroup, groupProfiles } from "@/lib/domain/conta-grupo";
import { LigarPerfil, PerfilAcoes } from "@/components/conta/marcas-forms";

export const dynamic = "force-dynamic";

/** Suas marcas (D141): perfis da mesma pessoa no grupo NextLevel, ligados com aceite. */
export default async function SuasMarcasPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const can = canJoinGroup(session.user) && !session.support;
  const profiles = can ? await groupProfiles(await getDb(), session.user.id) : [];
  const grouped = profiles.length > 1;
  return (
    <main className="flex min-h-screen items-start justify-center bg-background p-4 sm:items-center">
      <div className="w-full max-w-xl rounded-lg border border-border bg-surface p-6 shadow-sm">
        <p className="text-sm"><Link href={homeFor(session.user.role)} className="font-medium text-link underline">Voltar ao painel</Link></p>
        <h1 className="mt-3 text-xl font-bold">Suas marcas</h1>
        <p className="mt-1 text-sm text-muted-foreground">Tem cadastro em mais de uma marca do Grupo NextLevel? Ligue os perfis para trocar de um para o outro sem sair e entrar de novo.</p>
        {!can ? <p className="mt-4 rounded-lg bg-surface-muted p-3 text-sm">{session.support ? "No modo suporte a conta do grupo do cliente não aparece." : "Contas da equipe ficam fora da conta do grupo."}</p> : (
          <>
            <h2 className="mt-6 text-base font-semibold">{grouped ? `Perfis ligados (${profiles.length})` : "Este perfil"}</h2>
            <ul className="mt-2 divide-y divide-border">
              {profiles.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2"><b>{p.brandName}</b>{p.current ? <Badge tone="success">Você está aqui</Badge> : null}</div>
                    <p className="text-sm text-muted-foreground">{p.roleLabel} · {p.name} · {p.email}</p>
                  </div>
                  {grouped ? <PerfilAcoes id={p.id} name={p.name} current={p.current} brandName={p.brandName} /> : null}
                </li>
              ))}
            </ul>
            <h2 className="mt-6 text-base font-semibold">Ligar outro perfil</h2>
            <p className="mb-3 text-sm text-muted-foreground">Informe o e-mail e a senha do outro cadastro (assim sabemos que ele é seu).</p>
            <LigarPerfil />
          </>
        )}
      </div>
    </main>
  );
}
