"use client";
import * as React from "react";

import { Button, Degraus } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Avisa o navegador antes de fechar ou recarregar a aba quando há alterações pendentes. */
export function useUnsavedGuard(dirty: boolean) {
  React.useEffect(() => {
    if (!dirty) return;
    const onBefore = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", onBefore);
    return () => window.removeEventListener("beforeunload", onBefore);
  }, [dirty]);
}

/**
 * Barra fixa "Alterações não salvas". Aparece só quando `dirty`; Ctrl/Cmd + S salva.
 * Erros aparecem na própria barra e o botão mostra o carregamento.
 */
export function ContextualSaveBar({ dirty, saving, error, onSave, onDiscard, message = "Alterações não salvas", saveLabel = "Salvar", discardLabel = "Descartar" }: {
  dirty: boolean; saving?: boolean; error?: string | null; onSave: () => void; onDiscard: () => void; message?: string; saveLabel?: string; discardLabel?: string;
}) {
  useUnsavedGuard(dirty);
  React.useEffect(() => {
    if (!dirty) return;
    const onKey = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); if (!saving) onSave(); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dirty, saving, onSave]);
  if (!dirty) return null;
  return (
    <div role="region" aria-label="Alterações pendentes" className="nl-no-print fixed inset-x-0 top-0 z-40 animate-fade-in border-b border-border bg-primary text-primary-foreground shadow-md">
      <div className="mx-auto flex h-14 max-w-[110rem] items-center justify-between gap-3 px-4 sm:px-6">
        <p className="flex items-center gap-2 text-sm font-medium" aria-live="polite">{saving ? <Degraus className="size-4" /> : <span className="size-2 rounded-full bg-warning" aria-hidden />}{error ? <span className="text-danger-soft">{error}</span> : message}</p>
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onDiscard} disabled={saving} className={cn("text-primary-foreground hover:bg-white/10")}>{discardLabel}</Button>
          <Button type="button" variant="brand" size="sm" onClick={onSave} loading={saving}>{saveLabel} <kbd className="ml-1 hidden rounded bg-black/20 px-1 text-[10px] sm:inline">Ctrl S</kbd></Button>
        </div>
      </div>
    </div>
  );
}
