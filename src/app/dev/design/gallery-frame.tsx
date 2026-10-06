"use client";
import * as React from "react";

const WIDTHS = [1440, 840, 390, 320] as const;

export function GalleryFrame({ themes }: { themes: { key: string; label: string }[] }) {
  const [tema, setTema] = React.useState("todos");
  const [modo, setModo] = React.useState("ambos");
  const [w, setW] = React.useState<number>(1440);
  const sel = "min-h-11 rounded-xl border border-border bg-surface px-3 text-sm font-semibold";
  return (
    <div className="min-h-dvh bg-canvas p-4 text-body">
      <div className="mx-auto mb-4 flex max-w-[1440px] flex-wrap items-end gap-3">
        <div className="mr-auto"><p className="text-xs font-bold uppercase tracking-[.18em] text-muted-foreground">Sistema de design</p><h1 className="text-2xl font-extrabold text-foreground">Galeria de componentes e estados</h1><p className="text-sm text-muted-foreground">Dados fictícios. Escolha tema, modo e largura: o quadro abaixo tem a largura real, então os pontos de quebra respondem.</p></div>
        <label className="grid gap-1 text-xs font-bold">Tema<select className={sel} value={tema} onChange={(e) => setTema(e.target.value)}><option value="todos">Todos</option>{themes.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}</select></label>
        <label className="grid gap-1 text-xs font-bold">Modo<select className={sel} value={modo} onChange={(e) => setModo(e.target.value)}><option value="ambos">Claro e escuro</option><option value="light">Claro</option><option value="dark">Escuro</option></select></label>
        <label className="grid gap-1 text-xs font-bold">Largura<select className={sel} value={w} onChange={(e) => setW(Number(e.target.value))}>{WIDTHS.map((x) => <option key={x} value={x}>{x} px</option>)}</select></label>
      </div>
      <div className="mx-auto overflow-auto rounded-2xl border border-border bg-surface" style={{ maxWidth: "100%", width: w }}>
        <iframe key={`${tema}-${modo}-${w}`} title="Amostra de componentes" src={`/dev/design/amostra?tema=${tema}&modo=${modo}`} style={{ width: w, height: "80dvh", border: 0, display: "block" }} />
      </div>
    </div>
  );
}
