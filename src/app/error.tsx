"use client";
import * as React from "react";
import { ErrorState } from "@/components/app/empty-state";
import { Button } from "@/components/ui/button";

type Health = { ok: boolean; driver?: string; error?: string; hint?: string };

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const [health, setHealth] = React.useState<Health | null>(null);
  React.useEffect(() => {
    let alive = true;
    fetch("/api/health").then((r) => r.json()).then((h: Health) => { if (alive) setHealth(h); }).catch(() => { if (alive) setHealth({ ok: false, error: "Diagnóstico indisponível." }); });
    return () => { alive = false; };
  }, []);
  const isGeneric = /Minified React error #441|Server Components render/.test(error.message);
  return (
    <div className="mx-auto max-w-lg p-8">
      <ErrorState
        description={health && !health.ok ? `${health.hint ?? ""} (${health.error ?? "erro desconhecido"})` : isGeneric ? "O servidor encontrou um erro ao renderizar a página. Verificando diagnóstico…" : error.message}
        action={<div className="flex flex-wrap justify-center gap-2"><Button onClick={reset}>Tentar novamente</Button><a href="/api/health" className="inline-flex h-9 items-center rounded-md border border-border bg-surface px-4 text-sm">Ver diagnóstico</a></div>}
      />
    </div>
  );
}
