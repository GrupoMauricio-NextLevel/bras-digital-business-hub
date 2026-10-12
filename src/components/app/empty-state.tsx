import * as React from "react";
import { Inbox, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Ilustracao, type IlustracaoNome } from "./ilustracao";

/**
 * Estado vazio do sistema de design: borda tracejada, ícone suave, título, explicação curta e a ação existente.
 * `illustration` troca o ícone por uma ilustração do painel (`public/ilustracoes/v1/`); sem o arquivo, volta o ícone.
 */
export function EmptyState({ title, description, icon: Icon = Inbox, illustration, action, className, compact }: { title: string; description?: string; icon?: LucideIcon; illustration?: IlustracaoNome; action?: React.ReactNode; className?: string; compact?: boolean }) {
  const icon = <span className="ds-empty-icon" aria-hidden><Icon className="size-6" /></span>;
  return (
    <div className={cn("ds-empty", compact && "!py-6", className)}>
      {illustration ? <Ilustracao nome={illustration} fallback={icon} className={cn("mx-auto", compact ? "size-20" : "size-28 sm:size-32")} /> : icon}
      <h3>{title}</h3>
      {description ? <p>{description}</p> : null}
      {action ? <div className="ds-empty-action">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ title = "Algo deu errado", description, action }: { title?: string; description?: string; action?: React.ReactNode }) {
  return (
    <div role="alert" className="ds-alert ds-alert--bad !block text-center">
      <h3 className="text-sm font-bold text-danger">{title}</h3>
      {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
