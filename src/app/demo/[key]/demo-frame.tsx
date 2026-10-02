"use client";
import * as React from "react";
import Link from "next/link";
import { Monitor, Smartphone } from "lucide-react";
import { formatBRL } from "@/lib/money";
import { cn } from "@/lib/utils";

/** Moldura da demonstração: barra com o nome do tema, troca de tamanho e o caminho para comprar. */
export function DemoFrame({ name, themeKey, src, pending, priceCents }: { name: string; themeKey: string; src: string; pending: boolean; priceCents: number }) {
  const [device, setDevice] = React.useState<"desktop" | "mobile">("desktop");
  const btn = (k: "desktop" | "mobile", label: string, Icon: typeof Monitor) => (
    <button type="button" role="radio" aria-checked={device === k} onClick={() => setDevice(k)} className={cn("hidden items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium sm:flex", device === k ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-300 hover:text-white")}><Icon className="size-4" aria-hidden />{label}</button>
  );
  return (
    <div className="flex h-dvh flex-col bg-neutral-200">
      <header className="flex flex-wrap items-center justify-between gap-2 bg-neutral-900 px-4 py-2 text-white">
        <div className="flex items-baseline gap-2"><Link href="/temas" className="text-sm text-neutral-300 underline">Temas</Link><h1 className="text-base font-semibold">{name}</h1>{pending ? <span className="rounded bg-amber-200 px-2 py-0.5 text-xs font-semibold text-amber-900">Em aprovação</span> : null}</div>
        <div role="radiogroup" aria-label="Tamanho da tela" className="flex gap-1 rounded-lg bg-neutral-800 p-1">{btn("desktop", "Computador", Monitor)}{btn("mobile", "Celular", Smartphone)}</div>
        <Link href={`/temas/${themeKey}`} className="inline-flex h-9 items-center rounded-lg bg-white px-4 text-sm font-semibold text-neutral-900">{pending ? "Detalhes" : priceCents ? `Quero este tema · ${formatBRL(priceCents)}` : "Detalhes"}</Link>
      </header>
      <div className="min-h-0 flex-1 overflow-hidden p-0 sm:p-3">
        <div className="mx-auto h-full overflow-hidden bg-white shadow-xl transition-[width] duration-200 sm:rounded-lg" style={{ width: device === "mobile" ? 392 : "100%", maxWidth: "100%" }}>
          <iframe title={`Loja de exemplo com o tema ${name}`} src={src} className="h-full w-full bg-white" />
        </div>
      </div>
    </div>
  );
}
