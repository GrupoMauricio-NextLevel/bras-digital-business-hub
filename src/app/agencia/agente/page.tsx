import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { PageHeader } from "@/components/app/page-header";
import { escopoDaAgencia } from "@/lib/agencias/acesso";
import { PERGUNTAS_PRONTAS } from "@/lib/agencias/gestao";
import { Agente } from "@/components/agencia/gestao-cliente";

export const dynamic = "force-dynamic";
export const metadata = { title: "Maurício" };

/** O Maurício no Painel da Agência (D325), como o Agente do Master: responde com os números da própria agência. */
export default async function AgentePage() {
  const session = await requireRole("AGENCY");
  await escopoDaAgencia(await getDb(), session.actor);
  return (
    <div className="mx-auto max-w-[820px] space-y-5">
      <PageHeader eyebrow="Assistente" title="Pergunte ao Maurício" description="Ele responde com os números da agência: atrasos, cobranças, prioridades do dia e o mês. Cada pessoa vê só o que a função dela permite." />
      <section className="ds-card p-5 sm:p-6"><Agente prontas={PERGUNTAS_PRONTAS} /></section>
    </div>
  );
}
