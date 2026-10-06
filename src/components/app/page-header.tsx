import * as React from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

/** Cabeçalho de página do sistema de design: título literal do fluxo, descrição curta e ações reais perto do contexto. */
export function PageHeader({ title, description, actions, backHref, badge, eyebrow, className }: { title: string; description?: React.ReactNode; actions?: React.ReactNode; backHref?: string; badge?: React.ReactNode; eyebrow?: string; className?: string }) {
  return (
    <div className={cn("ds-head", className)}>
      <div className="min-w-0">
        {backHref ? (
          <Link href={backHref} className="mb-2 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground">
            <ChevronLeft className="size-4" aria-hidden /> Voltar
          </Link>
        ) : null}
        {eyebrow ? <p className="ds-eyebrow">{eyebrow}</p> : null}
        <div className="flex flex-wrap items-center gap-2">
          <h1>{title}</h1>
          {badge}
        </div>
        {description ? <p className="ds-lede">{description}</p> : null}
      </div>
      {actions ? <div className="ds-head-actions">{actions}</div> : null}
    </div>
  );
}

export function SectionTitle({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-[1.15rem] leading-tight">{title}</h2>
        {description ? <p className="mt-0.5 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
