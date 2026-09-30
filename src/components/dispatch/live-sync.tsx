"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Radio } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Mantém a esteira sincronizada: SSE em /api/live/orders e, se cair, polling a cada 8 s.
 * Quando a versão muda, atualiza os dados da página (router.refresh) sem recarregar.
 */
export function LiveSync() {
  const router = useRouter();
  const [state, setState] = React.useState<"live" | "polling" | "offline">("offline");
  const [lastAt, setLastAt] = React.useState<number | null>(null);
  const [now, setNow] = React.useState(() => Date.now());
  const version = React.useRef<string | null>(null);

  React.useEffect(() => {
    let es: EventSource | null = null;
    let poll: ReturnType<typeof setInterval> | null = null;
    let closed = false;
    const apply = (v: string) => { setLastAt(Date.now()); if (version.current !== null && version.current !== v) router.refresh(); version.current = v; };
    const startPolling = () => {
      if (poll || closed) return;
      setState("polling");
      const run = async () => { try { const r = await fetch("/api/live/orders?poll=1", { cache: "no-store" }); if (r.ok) apply(((await r.json()) as { version: string }).version); else setState("offline"); } catch { setState("offline"); } };
      void run(); poll = setInterval(run, 8000);
    };
    const connect = () => {
      if (typeof EventSource === "undefined") return startPolling();
      es = new EventSource("/api/live/orders");
      es.addEventListener("version", (e) => { setState("live"); apply((JSON.parse((e as MessageEvent).data) as { version: string }).version); });
      es.addEventListener("bye", () => { es?.close(); if (!closed) setTimeout(connect, 500); });
      es.onerror = () => { es?.close(); startPolling(); };
    };
    connect();
    const clock = setInterval(() => setNow(Date.now()), 5000);
    return () => { closed = true; es?.close(); if (poll) clearInterval(poll); clearInterval(clock); };
  }, [router]);

  const ago = lastAt ? Math.max(0, Math.round((now - lastAt) / 1000)) : null;
  return (
    <span role="status" className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium", state === "live" ? "border-success/40 bg-success-soft text-success" : state === "polling" ? "border-warning/40 bg-warning-soft text-warning" : "border-border text-muted-foreground")}>
      <Radio className={cn("size-3.5", state === "live" && "animate-pulse")} aria-hidden />
      {state === "live" ? "Ao vivo" : state === "polling" ? "Sincronizando" : "Sem conexão"}
      {ago !== null ? <span className="font-normal opacity-80">· {ago < 5 ? "agora" : `há ${ago}s`}</span> : null}
    </span>
  );
}
