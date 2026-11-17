import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { PageHeader } from "@/components/app/page-header";
import { escopoDaAgencia, FUNCAO_ROTULO, pode } from "@/lib/agencias/acesso";
import { listarEquipe } from "@/lib/agencias/agencias";
import { AGENCIA_FUNCOES } from "@/db/schema";
import { AcoesDoMembro, ConvidarMembro } from "./equipe-cliente";

export const dynamic = "force-dynamic";
export const metadata = { title: "Equipe da agência" };

const O_QUE_VE: Record<string, string> = {
  ADMIN: "Tudo: carteira, valores, equipe e importação.",
  FINANCEIRO: "Carteira inteira com valores e vencimentos; muda o contrato.",
  ATENDIMENTO: "Carteira inteira, sem valores; cadastra e organiza os clientes.",
};

/** Equipe da agência (D313): cada pessoa com login próprio e uma função. Só o administrador convida e muda. */
export default async function EquipeDaAgencia() {
  const session = await requireRole("AGENCY");
  const db = await getDb();
  const { membro } = await escopoDaAgencia(db, session.actor);
  const equipe = await listarEquipe(db, session.actor);
  const admin = pode.gerirEquipe(membro);
  const funcoes = AGENCIA_FUNCOES.map((f) => ({ v: f, l: FUNCAO_ROTULO[f] }));
  return (
    <>
      <PageHeader title="Equipe" description="Cada pessoa entra com o próprio login. A função define o que ela vê: roteiro, gravação, edição, social media e tráfego veem só os clientes em que trabalham." actions={admin ? <ConvidarMembro funcoes={funcoes} /> : undefined} />
      <ul className="ds-card ds-card--flush divide-y divide-border overflow-hidden" aria-label="Equipe">
        {equipe.map((p) => (
          <li key={p.userId} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <span className="min-w-0 flex-1 basis-60">
              <b className="block">{p.nome}{p.userId === session.user.id ? <span className="font-normal text-muted-foreground"> (você)</span> : null}</b>
              <span className="text-xs text-muted-foreground">{p.email} · {p.desligadoEm ? "acesso encerrado" : p.ultimoAcesso ? "já entrou no painel" : "ainda não entrou"}</span>
              <span className="block text-xs text-muted-foreground">{O_QUE_VE[p.funcao] ?? (p.todosClientes ? "Vê todos os clientes, sem valores." : "Vê só os clientes em que trabalha, sem valores.")}</span>
            </span>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${p.desligadoEm ? "bg-surface-muted text-muted-foreground" : "bg-[var(--ds-link)]/10 text-[var(--ds-link)]"}`}>{FUNCAO_ROTULO[p.funcao]}</span>
            {admin && !p.desligadoEm && p.userId !== session.user.id ? <AcoesDoMembro userId={p.userId} nome={p.nome} funcao={p.funcao} todosClientes={p.todosClientes} funcoes={funcoes} /> : null}
          </li>
        ))}
      </ul>
    </>
  );
}
