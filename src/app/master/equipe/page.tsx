import { FaixaEquipePainel } from "@/components/portal/equipe/blocos";
import { USOS_EQUIPE } from "@/lib/marcas/equipe-usos";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { listMasterTeam } from "@/lib/domain/equipe-master";
import { MASTER_FUNCTIONS, MASTER_FUNCTION_HINT, MASTER_FUNCTION_LABEL } from "@/lib/master-equipe";
import { NovaPessoa, PessoaAcoes } from "@/components/master/equipe-forms";

export const dynamic = "force-dynamic";

/** Equipe do Master (D138): só o dono cadastra, muda a função ou encerra o acesso. */
export default async function EquipePage() {
  const s = await requireRole("NEXTLEVEL_MASTER");
  if (s.user.masterFunction) redirect("/master");
  const team = await listMasterTeam(await getDb(), s.actor);
  return (
    <>
      <PageHeader eyebrow="Grupo NextLevel" title="Equipe do Master" description="Cada pessoa entra com uma função e vê só as telas dela. Preço, ofertas, regras e acerto entre empresas ficam com você e com o Financeiro." />
      <FaixaEquipePainel nome="eq-premio-equipe" titulo={USOS_EQUIPE["master-equipe"].titulo} texto={USOS_EQUIPE["master-equipe"].texto} />
      <section aria-labelledby="h-nova" className="ds-card mb-6 p-4">
        <h2 id="h-nova" className="mb-3 text-lg font-bold">Cadastrar pessoa</h2>
        <NovaPessoa />
        <ul className="mt-4 grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">{MASTER_FUNCTIONS.map((k) => <li key={k}><b className="text-foreground">{MASTER_FUNCTION_LABEL[k]}:</b> {MASTER_FUNCTION_HINT[k]}</li>)}</ul>
      </section>
      <section aria-labelledby="h-time" className="ds-card p-4">
        <h2 id="h-time" className="mb-3 text-lg font-bold">Quem tem acesso ({team.length})</h2>
        <ul className="divide-y divide-border">
          {team.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2"><b>{p.name}</b><Badge tone={p.masterFunction ? "info" : "success"}>{p.masterFunction ? MASTER_FUNCTION_LABEL[p.masterFunction] : "Dono"}</Badge>{p.disabledAt ? <Badge tone="neutral">Acesso encerrado</Badge> : null}</div>
                <p className="text-sm text-muted-foreground">{p.email} · {p.lastLoginAt ? `último acesso ${formatDate(p.lastLoginAt)}` : "ainda não entrou"}</p>
              </div>
              {p.masterFunction && p.id !== s.user.id ? <PessoaAcoes id={p.id} fn={p.masterFunction} disabled={!!p.disabledAt} name={p.name} /> : null}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
