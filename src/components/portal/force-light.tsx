"use client";
import * as React from "react";

/** O portal é sempre claro: fixa o tema claro enquanto está na tela e devolve o tema do usuário ao sair. */
export function ForceLight() {
  React.useEffect(() => {
    const root = document.documentElement; const prev = root.getAttribute("data-theme");
    root.setAttribute("data-theme", "light");
    return () => { if (prev) root.setAttribute("data-theme", prev); else root.removeAttribute("data-theme"); };
  }, []);
  return null;
}
export const FORCE_LIGHT_SCRIPT = `document.documentElement.setAttribute("data-theme","light")`;
