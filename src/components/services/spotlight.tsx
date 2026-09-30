import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import type { getServicesHub } from "@/lib/queries/services-hub";
import { formatBRL } from "@/lib/money";

type Hub = Awaited<ReturnType<typeof getServicesHub>>;

/** Destaque da Loja NextLevel nas telas iniciais: até três recomendações, cada uma com o motivo. */
export function ServiceSpotlight({ hub, base }: { hub: Hub; base: string }) {
  if (hub.recommended.length === 0 && hub.openCount === 0) return null;
  return (
    <section aria-label="Loja NextLevel" className="rounded-xl border border-accent/30 bg-accent-soft/40 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-base font-semibold"><Sparkles className="size-4 text-accent-foreground" aria-hidden /> Recomendado para você</h2>
        <Link href={`${base}/services`} className="inline-flex items-center gap-1 text-sm font-medium text-accent-foreground hover:underline">{hub.openCount ? `${hub.openCount} em andamento · ` : ""}Ver Loja NextLevel <ArrowRight className="size-4" aria-hidden /></Link>
      </div>
      <ul className="grid gap-3 md:grid-cols-3">
        {hub.recommended.map(({ service: s, reason }) => (
          <li key={s.id}>
            <Link href={`${base}/services?pedir=${s.key}`} className="flex h-full flex-col gap-1 rounded-lg border border-border bg-surface p-3 transition hover:border-accent/60 hover:shadow-md">
              <span className="text-sm font-semibold">{s.name}</span>
              <span className="text-xs text-muted-foreground">{reason}</span>
              <span className="mt-auto pt-2 text-sm font-semibold tabular-nums">a partir de {formatBRL(s.priceFromCents ?? 0)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
