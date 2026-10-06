"use client";
import * as React from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { THEME_STORAGE_KEY } from "@/design-system/themes";

type Mode = "light" | "dark" | "system";
const OPTIONS: { mode: Mode; label: string; icon: typeof Sun }[] = [
  { mode: "light", label: "Claro", icon: Sun },
  { mode: "dark", label: "Escuro", icon: Moon },
  { mode: "system", label: "Sistema", icon: Monitor },
];

/** Sem escolha salva a aplicação abre no claro (o script de pré-pintura do layout raiz decide, sem piscar). */
function read(): Mode {
  try { const v = localStorage.getItem(THEME_STORAGE_KEY); return v === "dark" || v === "system" ? v : "light"; } catch { return "light"; }
}
function apply(mode: Mode) {
  document.documentElement.setAttribute("data-theme", mode);
  try { localStorage.setItem(THEME_STORAGE_KEY, mode); } catch { /* sem armazenamento */ }
}

/** Escolha Claro, Escuro ou Sistema. ÚNICO controle de tema do sistema (painéis e páginas públicas). Teclado: setas movem a seleção. */
export function ThemeSwitch({ className }: { className?: string }) {
  const [mode, setMode] = React.useState<Mode>("light");
  React.useEffect(() => { const id = requestAnimationFrame(() => setMode(read())); return () => cancelAnimationFrame(id); }, []);
  const choose = (m: Mode) => { setMode(m); apply(m); };
  const onKey = (e: React.KeyboardEvent) => {
    const i = OPTIONS.findIndex((o) => o.mode === mode);
    const d = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const n = OPTIONS[(i + d + OPTIONS.length) % OPTIONS.length]!;
    choose(n.mode);
    (e.currentTarget.querySelector(`[data-mode="${n.mode}"]`) as HTMLElement | null)?.focus();
  };
  return (
    <div role="radiogroup" aria-label="Tema da tela" onKeyDown={onKey} className={cn("ds-switch", className)}>
      {OPTIONS.map(({ mode: m, label, icon: Icon }) => (
        <button key={m} type="button" role="radio" aria-checked={mode === m} data-mode={m} tabIndex={mode === m ? 0 : -1} onClick={() => choose(m)} title={label}>
          <Icon className="size-4" aria-hidden /><span className="sr-only">{label}</span>
        </button>
      ))}
    </div>
  );
}
