"use client";
import type * as React from "react";
import { Toaster as Sonner } from "sonner";

/**
 * Avisos rápidos. As cores "ricas" padrão do sonner (texto verde, vermelho e amarelo claros sobre fundo claro) ficam
 * abaixo do contraste AA; aqui o texto é escurecido mantendo o fundo (achado do axe na W1, D184).
 */
const CORES = {
  "--success-text": "#0b5c2a", "--error-text": "#9b1c1c", "--warning-text": "#7a4a00", "--info-text": "#0b4a8a",
} as React.CSSProperties;

export function Toaster() {
  return <Sonner position="bottom-right" richColors closeButton style={CORES} toastOptions={{ className: "font-sans text-sm" }} />;
}
