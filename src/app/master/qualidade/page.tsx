import { redirect } from "next/navigation";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { PageHeader } from "@/components/app/page-header";
import { qualityCenter } from "@/lib/domain/qualidade";
import { CentralQualidade } from "@/components/master/qualidade/central";

export const dynamic = "force-dynamic";

/** Central de qualidade (D142): todas as telas, uma por uma, com aprovação e testes; domínios e checagens. Só o dono. */
export default async function QualidadePage() {
  const s = await requireRole("NEXTLEVEL_MASTER");
  if (s.user.masterFunction) redirect("/master");
  const c = await qualityCenter(await getDb(), s.actor);
  return (
    <>
      <PageHeader eyebrow="Grupo NextLevel" title="Central de qualidade" description="Todas as telas do sistema em um lugar: abra uma por uma, marque testada e aprovada, anote o que precisa mudar e confira se os domínios e as páginas estão respondendo." />
      <CentralQualidade
        screens={c.screens.map((x) => ({ route: x.route, label: x.label, areaKey: x.area.key, host: x.host, params: x.params, mark: x.mark, check: x.check }))}
        hosts={c.hosts}
        pagesRun={c.pagesRun}
        domainsRun={c.domainsRun}
        openErrors={c.openErrors}
        version={c.version}
      />
    </>
  );
}
