import { getDb } from "@/db/client";
import { brandByCode } from "@/lib/brand";
import { getEcoSettings, groupSegments, isEcoBrandCode } from "@/lib/domain/ecossistema/lancador";

/**
 * Rodapé da família nas páginas públicas (D133, fase P5P): faixa "Parte do Grupo NextLevel" com o Club no centro e as
 * outras marcas abertas, cada uma levando à página de ativação (D130) com a origem. Componente de servidor, só com a
 * chave "páginas públicas" ligada; nunca na vitrine do lojista (ela não usa o portal).
 */
export async function FamiliaGrupo({ brandCode }: { brandCode: string }) {
  const eco = await getEcoSettings(await getDb());
  if (!eco.publicPages) return null;
  const segs = groupSegments(brandCode);
  const from = isEcoBrandCode(brandCode) ? `?de=${brandCode}` : "";
  return (
    <section aria-labelledby="fg-h" className="mb-6 rounded-lg border border-border p-4" data-familia-grupo>
      <div className="mb-3 flex h-1.5 overflow-hidden rounded-full" aria-hidden>{segs.map((s) => <span key={s.brand} className={s.current ? "h-full" : "h-full bg-border"} style={{ background: s.current ? s.color : undefined, flex: s.current ? 4 : 1 }} />)}</div>
      <h2 id="fg-h" className="text-sm font-semibold">Parte do Grupo NextLevel</h2>
      <p className="mb-3 text-sm text-muted-foreground">Uma conta de pontos do Club para todas as marcas do grupo.</p>
      <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
        {segs.filter((s) => !s.current).map((s) => (
          <li key={s.brand} className="flex items-center gap-2"><a href={`${brandByCode(s.brand).baseUrl}/ativar${from}`} className="underline">{s.name}</a></li>
        ))}
      </ul>
    </section>
  );
}
