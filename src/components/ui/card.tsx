import * as React from "react";
import { cn } from "@/lib/utils";

/** Cartão do sistema de design (raio 22, borda leve, sombra pequena). Sem padding próprio: use CardHeader/CardContent. */
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("ds-card ds-card--flush", className)} {...props} />;
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-start justify-between gap-4 px-[var(--ds-pad-card)] pt-[var(--ds-pad-card)] pb-3", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-[0.95rem] font-bold tracking-[-0.01em] text-foreground", className)} {...props} />;
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-[var(--ds-pad-card)] pb-[var(--ds-pad-card)]", className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-center gap-3 border-t border-border px-[var(--ds-pad-card)] py-3", className)} {...props} />;
}
