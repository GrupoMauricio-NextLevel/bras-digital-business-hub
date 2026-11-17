import Link from "next/link";
import { UsersRound } from "lucide-react";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { escopoDaAgencia, pode } from "@/lib/agencias/acesso";
import { inclusoTexto, listarClientes, SITUACAO_CLIENTE_ROTULO } from "@/lib/agencias/clientes";
import { listarEquipe } from "@/lib/agencias/agencias";
import { formatBRL } from "@/lib/money";
import { AGENCIA_CLIENTE_SITUACOES, type AgenciaClienteSituacao } from "@/db/schema";
import { ImportarClientes, NovoCliente } from "./clientes-cliente";

export const dynamic = "force-dynamic";
export const metadata = { title: "Clientes da agência" };

const FILTROS: { v: AgenciaClienteSituacao | "TODOS"; l: string }[] = [...AGENCIA_CLIENTE_SITUACOES.map((s) => ({ v: s, l: SITUACAO_CLIENTE_ROTULO[s] })), { v: "TODOS", l: "Todos" }];

/** Carteira de clientes da agência (D313, AG2): contrato de cada cliente, responsável e o que entra no mês. */
export default async function ClientesDaAgencia({ searchParams }: { searchParams: Promise<{ situacao?: string; novo?: string }> }) {
  const session = await requireRole("AGENCY");
  const db = await getDb();
  const { membro } = await escopoDaAgencia(db, session.actor);
  const { situacao, novo } = await searchParams;
  const filtro = FILTROS.find((f) => f.v === situacao)?.v ?? "ATIVO";
  const [lista, equipe] = await Promise.all([listarClientes(db, session.actor, { situacao: filtro === "TODOS" ? undefined : filtro }), listarEquipe(db, session.actor)]);
  const nomes = new Map(equipe.map((p) => [p.userId, p.nome.split(" ")[0]!]));
  const valores = pode.verValores(membro);
  const ativosEquipe = equipe.filter((p) => !p.desligadoEm).map((p) => ({ id: p.userId, nome: p.nome }));
  return (
    <>
      <PageHeader title="Clientes" description={pode.verTodosClientes(membro) ? "A carteira da agência: contrato, o que entra no mês e quem cuida de cada cliente." : "Os clientes em que você trabalha."}
        actions={<div className="flex flex-wrap items-start gap-2">{pode.importar(membro) ? <ImportarClientes /> : null}{pode.editarClientes(membro) ? <NovoCliente equipe={ativosEquipe} contrato={pode.editarContrato(membro)} abertoInicial={novo === "1"} /> : null}</div>} />
      <nav aria-label="Filtrar por situação" className="mb-4 flex flex-wrap gap-2">
        {FILTROS.map((f) => <Link key={f.v} href={`/agencia/clientes?situacao=${f.v}`} aria-current={f.v === filtro ? "page" : undefined} className={`rounded-full border px-3 py-1.5 text-sm ${f.v === filtro ? "border-[var(--ds-link)] bg-[var(--ds-link)]/10 font-semibold" : "border-border"}`}>{f.l}</Link>)}
      </nav>
      {lista.length ? (
        <ul className="ds-card ds-card--flush divide-y divide-border overflow-hidden" aria-label="Clientes">
          {lista.map((c) => (
            <li key={c.id}>
              <Link href={`/agencia/clientes/${c.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 hover:bg-surface-muted">
                <span className="min-w-0 flex-1 basis-56">
                  <b className="block">{c.nome}{c.segmento ? <span className="font-normal text-muted-foreground"> · {c.segmento}</span> : null}</b>
                  <span className="text-xs text-muted-foreground">{[c.pacote, inclusoTexto(c.incluso)].filter(Boolean).join(" · ") || "sem pacote definido"}{c.responsavelId ? ` · com ${nomes.get(c.responsavelId) ?? "—"}` : " · sem responsável"}</span>
                </span>
                {valores ? <span className="text-sm tabular-nums">{c.valorMensalCents ? `${formatBRL(c.valorMensalCents)}/mês` : <span className="text-warning">sem valor</span>}{c.diaVencimento ? <span className="text-muted-foreground"> · dia {c.diaVencimento}</span> : null}</span> : null}
                {c.situacao !== "ATIVO" ? <span className="rounded-full bg-surface-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">{SITUACAO_CLIENTE_ROTULO[c.situacao]}</span> : null}
              </Link>
            </li>
          ))}
        </ul>
      ) : <EmptyState icon={UsersRound} title={filtro === "ATIVO" ? "Nenhum cliente ativo ainda" : "Nada por aqui"} description={pode.importar(membro) ? "Cadastre um cliente ou cole a planilha da carteira em \"Importar planilha\"." : "Quando você for colocado num cliente, ele aparece aqui."} />}
    </>
  );
}
