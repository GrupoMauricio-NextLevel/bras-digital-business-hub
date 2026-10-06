import * as React from "react";
import { cn } from "@/lib/utils";

/** Moldura de janela para mostrar telas do produto. `panel` aplica o clima real do painel (cores do sistema). */
export function MockWindow({ title, panel, children, className }: { title: string; panel?: "master" | "supplier" | "dispatch" | "lite" | "pro"; children: React.ReactNode; className?: string }) {
  return (
    <div data-panel={panel} className={cn("overflow-hidden rounded-xl border border-neutral-200 bg-white text-neutral-900 shadow-[0_24px_60px_rgba(15,28,22,0.18)]", className)}>
      <div className="flex items-center gap-2 border-b border-neutral-200 bg-neutral-50 px-3 py-2">
        <span className="flex gap-1.5" aria-hidden><span className="size-2.5 rounded-full bg-neutral-300" /><span className="size-2.5 rounded-full bg-neutral-300" /><span className="size-2.5 rounded-full bg-neutral-300" /></span>
        <span className="mx-auto truncate rounded-md bg-white px-3 py-0.5 text-[11px] text-neutral-700 ring-1 ring-neutral-200">{title}</span>
      </div>
      {children}
    </div>
  );
}
