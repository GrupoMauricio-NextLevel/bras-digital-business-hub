"use client";
import * as React from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

type Mode = "light" | "dark" | "system";
const ORDER: Mode[] = ["system", "light", "dark"];
const LABEL: Record<Mode, string> = { system: "Tema do sistema", light: "Tema claro", dark: "Tema escuro" };

function read(): Mode {
  try { const v = localStorage.getItem("nl-theme"); return v === "light" || v === "dark" ? v : "system"; } catch { return "system"; }
}
function apply(mode: Mode) {
  const root = document.documentElement;
  if (mode === "system") root.removeAttribute("data-theme"); else root.setAttribute("data-theme", mode);
  try { if (mode === "system") localStorage.removeItem("nl-theme"); else localStorage.setItem("nl-theme", mode); } catch { /* sem armazenamento */ }
}

/** Alterna entre sistema, claro e escuro. O tema salvo é aplicado antes da pintura por um script no layout raiz. */
export function ThemeToggle({ className }: { className?: string }) {
  const [mode, setMode] = React.useState<Mode>("system");
  React.useEffect(() => { const id = requestAnimationFrame(() => setMode(read())); return () => cancelAnimationFrame(id); }, []);
  const next = () => { const n = ORDER[(ORDER.indexOf(mode) + 1) % ORDER.length]!; setMode(n); apply(n); };
  const Icon = mode === "dark" ? Moon : mode === "light" ? Sun : Monitor;
  return (
    <Button variant="ghost" size="icon" className={className} onClick={next} aria-label={`${LABEL[mode]}. Clique para alternar`} title={LABEL[mode]}>
      <Icon />
    </Button>
  );
}
