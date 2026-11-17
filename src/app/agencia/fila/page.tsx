import { Inbox } from "lucide-react";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { EtapaChip, PecaCartao } from "@/components/agencia/producao";
import { escopoDaAgencia, FUNCAO_ROTULO } from "@/lib/agencias/acesso";
import { minhaFila } from "@/lib/agencias/producao";

export const dynamic = "force-dynamic";
export const metadata = { title: "Minha fila" };

/** Minha fila (D314): o que está com a pessoa agora, atrasadas primeiro. Cada um trabalha sem perguntar a ninguém. */
export default async function MinhaFila() {
  const session = await requireRole("AGENCY");
  const db = await getDb();
  const { membro } = await escopoDaAgencia(db, session.actor);
  const fila = await minhaFila(db, session.actor);
  const atrasadas = fila.filter((p) => p.atrasada);
  const etapas = [...new Set(fila.map((p) => p.etapa))];
  return (
    <div className="mx-auto max-w-[1240px] space-y-5">
      <PageHeader eyebrow={FUNCAO_ROTULO[membro.funcao]} title="Minha fila" description={fila.length ? `${fila.length} peça${fila.length > 1 ? "s" : ""} com você${atrasadas.length ? `, ${atrasadas.length} atrasada${atrasadas.length > 1 ? "s" : ""}` : ""}. Abra, faça a sua parte e conclua: a peça segue sozinha para a próxima pessoa.` : undefined}
        badge={etapas.length ? <span className="flex flex-wrap gap-1">{etapas.map((e) => <EtapaChip key={e} etapa={e} />)}</span> : null} />
      {fila.length ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{fila.map((p) => <PecaCartao key={p.id} p={p} />)}</div>
      ) : <EmptyState icon={Inbox} title="Nada com você agora" description="Quando uma peça chegar na sua etapa, ela aparece aqui com o prazo." />}
    </div>
  );
}
