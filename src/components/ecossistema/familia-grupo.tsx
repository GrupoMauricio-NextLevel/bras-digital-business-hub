import { getDb } from "@/db/client";
import { groupSiteUrl } from "@/lib/host-routing";
import { getEcoSettings, groupSegments } from "@/lib/domain/ecossistema/lancador";

/**
 * Rodapé da família nas páginas públicas (D133, fase P5P): faixa "Parte do Grupo NextLevel" com o fio (só a marca atual
 * colorida) e um link para o site do grupo. Desde D164 não lista as outras marcas: a apresentação cruzada volta numa
 * rodada própria, com decisão do dono. Componente de servidor, só com a
 * chave "páginas públicas" ligada; nunca na vitrine do lojista (ela não usa o portal).
 */
export async function FamiliaGrupo({ brandCode }: { brandCode: string }) {
  const eco = await getEcoSettings(await getDb());
  if (!eco.publicPages) return null;
  const segs = groupSegments(brandCode);
  return (
    <section aria-labelledby="fg-h" className="mb-6 rounded-lg border border-border p-4" data-familia-grupo>
      <div className="mb-3 flex h-1.5 overflow-hidden rounded-full" aria-hidden>{segs.map((s) => <span key={s.brand} className={s.current ? "h-full" : "h-full bg-border"} style={{ background: s.current ? s.color : undefined, flex: s.current ? 4 : 1 }} />)}</div>
      <h2 id="fg-h" className="text-sm font-semibold">Parte do Grupo NextLevel</h2>
      <p className="mb-3 text-sm text-muted-foreground">Tecnologia, marketing e soluções do mesmo grupo, com a mesma equipe.</p>
      <a href={`${groupSiteUrl()}/solucoes`} className="text-sm font-semibold underline">Conheça o Grupo NextLevel</a>
    </section>
  );
}
