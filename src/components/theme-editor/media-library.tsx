"use client";
import * as React from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { compressImage } from "@/lib/client-image";
import { listMediaAction, removeMediaAction, uploadStoreImageAction } from "@/app/actions/assets";
import type { MediaItem } from "@/lib/domain/assets";
import { cn } from "@/lib/utils";

type Picker = (opts?: { minWidth?: number }) => Promise<string | null>;
const Ctx = React.createContext<Picker | null>(null);
/** Abre a biblioteca e devolve o endereço escolhido (ou null). Disponível em qualquer campo de imagem do editor. */
export const useMediaLibrary = () => React.useContext(Ctx);

/**
 * Biblioteca de mídia da loja (todos os níveis): enviar, reaproveitar, ver onde cada imagem é usada e remover com segurança.
 * O original é preservado; o recorte é só ponto de foco (não destrói a imagem). Remover imagem em uso é recusado no servidor.
 */
export function MediaLibraryProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [minWidth, setMinWidth] = React.useState<number | undefined>();
  const resolver = React.useRef<((v: string | null) => void) | null>(null);
  const pick: Picker = React.useCallback((opts) => new Promise((resolve) => { resolver.current = resolve; setMinWidth(opts?.minWidth); setOpen(true); }), []);
  const done = (v: string | null) => { resolver.current?.(v); resolver.current = null; setOpen(false); };
  return <Ctx.Provider value={pick}>{children}<MediaLibraryDialog open={open} minWidth={minWidth} onClose={() => done(null)} onPick={(url) => done(url)} /></Ctx.Provider>;
}

const kb = (n: number) => (n > 1_000_000 ? `${(n / 1_000_000).toFixed(1).replace(".", ",")} MB` : `${Math.round(n / 1000)} KB`);
const usesLabel = (u: MediaItem["uses"]) => { const live = [...new Set(u.filter((x) => x.where !== "histórico").map((x) => x.where))]; return live.length ? `Em uso: ${live.join(", ")}` : u.length ? "Só no histórico" : "Sem uso"; };

export function MediaLibraryDialog({ open, minWidth, onClose, onPick }: { open: boolean; minWidth?: number; onClose: () => void; onPick: (url: string) => void }) {
  const [items, setItems] = React.useState<MediaItem[] | null>(null);
  const [busy, setBusy] = React.useState(false);
  const input = React.useRef<HTMLInputElement>(null);
  const load = React.useCallback(async () => { const r = await listMediaAction(); if (r.ok) setItems(r.data); else { toast.error(r.error); setItems([]); } }, []);
  React.useEffect(() => {
    if (!open) return; let live = true;
    listMediaAction().then((r) => { if (!live) return; if (r.ok) setItems(r.data); else { toast.error(r.error); setItems([]); } });
    return () => { live = false; };
  }, [open]);
  const upload = async (file: File | undefined) => {
    if (!file) return; setBusy(true);
    try {
      const dataUrl = await compressImage(file, 2400, 0.86);
      const r = await uploadStoreImageAction(dataUrl, { name: file.name.replace(/\.[a-z0-9]+$/i, "") });
      if (r.ok) { toast.success("Imagem enviada para a biblioteca"); await load(); } else toast.error(r.error);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Não foi possível enviar a imagem."); }
    finally { setBusy(false); if (input.current) input.current.value = ""; }
  };
  const remove = async (m: MediaItem) => {
    if (!window.confirm("Remover esta imagem da biblioteca?")) return;
    const r = await removeMediaAction(m.id);
    if (r.ok) { toast.success(r.data.result === "archived" ? "Arquivada: some da biblioteca, mas versões antigas continuam funcionando." : "Imagem removida."); await load(); } else toast.error(r.error);
  };
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { setItems(null); onClose(); } }}>
      <DialogContent title="Biblioteca de imagens" description={minWidth ? `Para esta posição, use imagens com pelo menos ${minWidth} px de largura.` : "Escolha uma imagem já enviada ou envie uma nova."} className="max-w-3xl">
        <div className="mb-3 flex items-center gap-2">
          <Button type="button" size="sm" loading={busy} onClick={() => input.current?.click()}><ImagePlus aria-hidden /> Enviar imagem</Button>
          <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => void upload(e.target.files?.[0])} />
          <p className="text-xs text-muted-foreground">PNG, JPG ou WebP. A imagem é reduzida para até 2400 px antes do envio; o arquivo original no seu computador não muda.</p>
        </div>
        {items === null ? <p className="flex items-center justify-center py-10 text-sm text-muted-foreground"><Loader2 className="mr-2 size-4 animate-spin" aria-hidden /> Carregando…</p>
          : items.length === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">Nenhuma imagem ainda. Envie a primeira.</p>
          : (
          <ul className="nl-scroll grid max-h-[55vh] grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3" aria-label="Imagens da loja">
            {items.map((m) => { const low = !!(minWidth && m.width && m.width < minWidth); return (
              <li key={m.id} className="overflow-hidden rounded-lg border border-border">
                <button type="button" onClick={() => onPick(m.url)} className="block w-full text-left focus-visible:outline-2 focus-visible:outline-offset-2" aria-label={`Usar ${m.name ?? "imagem"}${m.width ? ` (${m.width}×${m.height})` : ""}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- miniatura da biblioteca */}
                  <img src={`${m.url}?w=320`} alt="" loading="lazy" className="aspect-[4/3] w-full bg-surface-muted object-cover" />
                </button>
                <div className="flex items-start justify-between gap-1 p-2 text-[11px]">
                  <span className="min-w-0"><span className="block truncate font-medium text-foreground">{m.name ?? "Imagem"}</span><span className={cn("block", low ? "text-warning" : "text-muted-foreground")}>{m.width ? `${m.width}×${m.height}` : "—"} · {kb(m.sizeBytes)}{low ? " · resolução baixa" : ""}</span><span className="block text-muted-foreground">{usesLabel(m.uses)}</span></span>
                  <button type="button" onClick={() => void remove(m)} className="rounded p-1 text-muted-foreground hover:text-danger" aria-label={`Remover ${m.name ?? "imagem"}`}><Trash2 className="size-3.5" aria-hidden /></button>
                </div>
              </li>
            ); })}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
