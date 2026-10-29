import { PageHeader } from "@/components/app/page-header";
import { requireRole } from "@/lib/require-session";
import { getDb } from "@/db/client";
import { listarConversas } from "@/lib/domain/ia-conversas";
import { CrmAoVivo } from "@/components/ia/crm-ao-vivo";
import { AbasIa } from "./abas";

export const dynamic = "force-dynamic";

/** Central da IA no Master (D197): conversas do Maurício ao vivo, com a equipe assumindo quando precisa. */
export default async function CentralIaPage() {
  const s = await requireRole("NEXTLEVEL_MASTER");
  const inicial = await listarConversas(await getDb(), s.actor, { status: "ABERTAS" });
  return (
    <>
      <PageHeader title="Central da IA" description="Quem está conversando com o Maurício agora, o que perguntou e os dados que deixou. Assuma a conversa quando precisar de uma pessoa." />
      <AbasIa atual="conversas" />
      <CrmAoVivo inicial={JSON.parse(JSON.stringify(inicial))} />
    </>
  );
}
