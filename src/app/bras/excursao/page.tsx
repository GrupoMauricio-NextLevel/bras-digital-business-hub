import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { PageHeader } from "@/components/app/page-header";
import { getExcursionRules } from "@/lib/domain/cargas/regras-excursao";
import { ExcursionRulesEditor } from "@/components/cargas/master-forms";

export const dynamic = "force-dynamic";

/** Cargas Excursão no Master (D112): regras (tamanhos, taxa, capacidade, nota). Rotas, viagens e fardos entram na fase E2. */
export default async function Excursao() {
  await requireRole("NEXTLEVEL_MASTER");
  const { version, ...rules } = await getExcursionRules(await getDb());
  return (
    <>
      <PageHeader eyebrow="Estúdio Brás Digital · NextLevel Cargas" title="Ônibus de excursão" description={`Regras dos fardos que viajam nos ônibus de excursão. Versão ${version}. Valores em rascunho até você decidir.`} />
      <section className="ds-card p-4"><ExcursionRulesEditor rules={rules} /></section>
    </>
  );
}
