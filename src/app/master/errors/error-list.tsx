"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { resolveErrorAction } from "@/app/actions/errors";
import { formatDateTime } from "@/lib/utils";

type Row = { id: string; origin: "SERVER" | "BROWSER"; route: string; message: string; stack: string | null; count: number; firstAt: string; lastAt: string; resolved: boolean };

export function ErrorList({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">Nenhum erro registrado. Bom sinal.</p>;
  return (
    <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
      {rows.map((e) => (
        <li key={e.id} className={`space-y-1 p-4 text-sm ${e.resolved ? "opacity-60" : ""}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-medium">{e.message}</span>
            <span className="text-xs text-muted-foreground">{e.count}× · {e.origin === "SERVER" ? "servidor" : "navegador"} · {e.resolved ? "resolvido" : "aberto"}</span>
          </div>
          <div className="text-xs text-muted-foreground">Rota {e.route} · primeira {formatDateTime(e.firstAt)} · última {formatDateTime(e.lastAt)}</div>
          {e.stack ? <details className="text-xs text-muted-foreground"><summary className="cursor-pointer">Detalhe técnico</summary><p className="mt-1 break-words font-mono">{e.stack}</p></details> : null}
          {!e.resolved ? <Button variant="secondary" loading={pending} onClick={() => start(async () => { const r = await resolveErrorAction(e.id); if (r.ok) router.refresh(); else toast.error(r.error); })}>Marcar como resolvido</Button> : null}
        </li>
      ))}
    </ul>
  );
}
