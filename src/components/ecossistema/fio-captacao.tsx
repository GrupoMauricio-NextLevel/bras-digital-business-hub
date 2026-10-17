import { Sparkles } from "lucide-react";
import { getDb } from "@/db/client";
import { getEcoSettings, groupSegments } from "@/lib/domain/ecossistema/lancador";

/**
 * Fio do grupo e selo do Club nas páginas de captação (D132, fase P5U). Componente de servidor; só aparece com a chave
 * "captação" ligada no Master. A faixa é decorativa; o selo diz em texto o que a pessoa ganha (sem promessa de ganho).
 */
export async function FioCaptacao({ brandCode }: { brandCode?: string | null }) {
  const eco = await getEcoSettings(await getDb());
  if (!eco.capture) return null;
  const segs = groupSegments(brandCode);
  return (
    <div className="mb-6 space-y-3" data-fio-captacao>
      <div className="flex h-1.5 overflow-hidden rounded-full" aria-hidden>{segs.map((s) => <span key={s.brand} className={s.current ? "h-full" : "h-full bg-border"} style={{ background: s.current ? s.color : undefined, flex: s.current ? 4 : 1 }} />)}</div>
      <p className="flex items-start gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm">
        <Sparkles className="mt-0.5 size-4 shrink-0 text-[var(--brand-primary)]" aria-hidden />
        <span>Ao entrar, você já faz parte do <b>Club do Grupo NextLevel</b>: seus pontos valem em todas as marcas do grupo ({segs.map((s) => s.name).join(", ")}).</span>
      </p>
    </div>
  );
}
