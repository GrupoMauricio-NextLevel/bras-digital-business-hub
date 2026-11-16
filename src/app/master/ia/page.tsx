import { sincronizarSuporte } from "@/lib/domain/suporte-email";
import { PageHeader } from "@/components/app/page-header";
import { requireRole } from "@/lib/require-session";
import { getDb } from "@/db/client";
import { listarConversas } from "@/lib/domain/ia-conversas";
import { CrmAoVivo } from "@/components/ia/crm-ao-vivo";
import { AbasIa } from "./abas";

export const dynamic = "force-dynamic";

/** Central da IA no Master (D197): conversas do Maurício ao vivo, com a equipe assumindo quando precisa. */
export default async function CentralIaPage({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const s = await requireRole("NEXTLEVEL_MASTER");
  // D300: traz os e-mails novos de suporte@ ao abrir (reserva para quando o aviso da Hostinger não chegar); nunca trava a tela.
  await Promise.race([sincronizarSuporte(await getDb()).catch(() => null), new Promise((r) => setTimeout(r, 3000))]);
  const inicial = await listarConversas(await getDb(), s.actor, { status: "ABERTAS" });
  return (
    <>
      <PageHeader title="Atendimento" description="Visitantes do site falando com o Maurício e lojistas pedindo ajuda no painel, tudo numa caixa só. Assuma a conversa e responda por aqui." />
      <AbasIa atual="conversas" />
      <CrmAoVivo inicial={JSON.parse(JSON.stringify(inicial))} abrir={(await searchParams).c?.slice(0, 40)} />
    </>
  );
}
