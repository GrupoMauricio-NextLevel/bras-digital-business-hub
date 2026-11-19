"use client";

import { toast } from "sonner";
import { StadiumThemeProvider } from "@/theme-estadio/StadiumThemeProvider";
import { ThemeCustomizer } from "@/theme-estadio/ThemeCustomizer";
import type { StadiumThemeTokens } from "@/theme-estadio/tokens";

export function AparenciaClient({ initialTokens }: { initialTokens: unknown }) {
  return (
    <StadiumThemeProvider initialTokens={initialTokens}>
      <ThemeCustomizer onSave={async (tokens: StadiumThemeTokens) => {
        const res = await fetch("/api/painel/aparencia", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ tokens }) });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          toast.error(typeof body?.error === "string" ? body.error : "Não foi possível salvar agora.");
          return;
        }
        toast.success("Aparência salva com sucesso.");
      }} />
    </StadiumThemeProvider>
  );
}
