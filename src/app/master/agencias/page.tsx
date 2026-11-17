import { Network } from "lucide-react";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { agenciasLigado } from "@/lib/agencias/acesso";
import { listarAgencias } from "@/lib/agencias/agencias";
import { agenciasUrl } from "@/lib/host-routing";
import { brandByCode } from "@/lib/brand";
import { NovaAgencia, SituacaoDaAgencia } from "./agencias-cliente";

export const dynamic = "force-dynamic";
export const metadata = { title: "Agências" };

const ROTULO = { PILOTO: "Piloto", ATIVA: "Ativa", PAUSADA: "Pausada" } as const;
const quando = (iso: string) => new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "America/Sao_Paulo" }).format(new Date(iso));

/** Agências (D313): o Master cria a agência e o acesso do administrador dela; acompanha carteira e equipe. */
export default async function AgenciasMaster() {
  const session = await requireRole("NEXTLEVEL_MASTER");
  if (!agenciasLigado()) return <><PageHeader title="Agências" /><EmptyState icon={Network} title="Painel da Agência desligado" description="Ligue a chave AGENCIAS_V1 no servidor para criar agências e abrir o painel delas." /></>;
  const lista = await listarAgencias(await getDb(), session.actor);
  const entrada = `${(agenciasUrl() ?? brandByCode("NEXTLEVEL_COMMERCE").baseUrl).replace(/^https?:\/\//, "").replace(/\/$/, "")}/login`;
  return (
    <>
      <PageHeader title="Agências" description={<>Agências que tocam a operação delas dentro da NextLevel: carteira de clientes, contratos, equipe e produção. Endereço de entrada das agências: <b className="text-foreground">{entrada}</b> (senha provisória, trocada no primeiro acesso).</>} actions={<NovaAgencia />} />
      {lista.length ? (
        <ul className="ds-card ds-card--flush divide-y divide-border overflow-hidden" aria-label="Agências">
          {lista.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <span className="min-w-0 flex-1 basis-60">
                <b className="block">{a.nome}{a.fundadora ? <span className="ml-2 rounded-full bg-[var(--ds-link)]/10 px-2 py-0.5 text-xs font-semibold text-[var(--ds-link)]">Fundadora</span> : null}</b>
                <span className="text-xs text-muted-foreground">desde {quando(a.createdAt)} · {a.clientes} cliente(s) na carteira · {a.equipe} pessoa(s) na equipe</span>
              </span>
              <span className="rounded-full bg-surface-muted px-2.5 py-1 text-xs font-semibold">{ROTULO[a.situacao]}</span>
              <SituacaoDaAgencia id={a.id} situacao={a.situacao} />
            </li>
          ))}
        </ul>
      ) : <EmptyState icon={Network} title="Nenhuma agência ainda" description="Crie a primeira agência com o acesso do administrador dela." />}
    </>
  );
}
