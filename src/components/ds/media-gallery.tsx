"use client";
import * as React from "react";
import { ChevronLeft, ChevronRight, ImagePlus, Star, Trash2, Type } from "lucide-react";
import { Button, Degraus } from "@/components/ui/button";
import { moveItem } from "@/lib/ds/index-list";
import { cn } from "@/lib/utils";

export type MediaItem = { id: string; src: string; alt: string };

/**
 * Galeria de mídia: enviar (botão ou arrastar arquivos), ordenar por arrastar ou pelo teclado
 * (Alt + setas), definir capa (primeira posição), texto alternativo e remover.
 */
export function MediaGallery({ items, onChange, max = 8, processFile, onError, accept = "image/*" }: {
  items: MediaItem[]; onChange: (items: MediaItem[]) => void; max?: number; accept?: string;
  /** Converte o arquivo em um endereço (ex.: compressão no navegador). Padrão: leitura direta. */
  processFile?: (file: File) => Promise<string>; onError?: (message: string) => void;
}) {
  const [dragFrom, setDragFrom] = React.useState<number | null>(null);
  const [over, setOver] = React.useState<number | null>(null);
  const [dropping, setDropping] = React.useState(false);
  const [altOpen, setAltOpen] = React.useState<string | null>(null);
  const [announce, setAnnounce] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const move = (from: number, to: number) => {
    const next = moveItem(items, from, to); if (next === items) return;
    onChange(next); setAnnounce(`Foto movida para a posição ${to + 1} de ${items.length}${to === 0 ? ", agora é a capa" : ""}.`);
  };
  const add = async (files: FileList | File[] | null) => {
    if (!files) return; const room = max - items.length; if (room <= 0) { onError?.(`Limite de ${max} imagens.`); return; }
    setBusy(true);
    try {
      const out: MediaItem[] = [];
      for (const f of Array.from(files).filter((x) => x.type.startsWith("image/")).slice(0, room)) {
        const src = processFile ? await processFile(f) : await new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = () => rej(new Error("Falha ao ler o arquivo.")); r.readAsDataURL(f); });
        out.push({ id: `m-${Date.now().toString(36)}-${out.length}`, src, alt: "" });
      }
      onChange([...items, ...out]);
    } catch (e) { onError?.(e instanceof Error ? e.message : "Falha ao processar a imagem."); } finally { setBusy(false); if (fileRef.current) fileRef.current.value = ""; }
  };

  return (
    <div onDragOver={(e) => { if (e.dataTransfer.types.includes("Files")) { e.preventDefault(); setDropping(true); } }} onDragLeave={() => setDropping(false)} onDrop={(e) => { if (e.dataTransfer.files.length) { e.preventDefault(); setDropping(false); void add(e.dataTransfer.files); } }} className={cn("rounded-lg border border-dashed p-3 transition-colors", dropping ? "border-accent bg-accent-soft/40" : "border-border-strong")}>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" aria-label="Fotos, a primeira é a capa">
        {items.map((it, i) => (
          <li key={it.id} draggable onDragStart={() => setDragFrom(i)} onDragOver={(e) => { if (dragFrom !== null) { e.preventDefault(); setOver(i); } }} onDragEnd={() => { setDragFrom(null); setOver(null); }} onDrop={(e) => { if (dragFrom !== null) { e.preventDefault(); e.stopPropagation(); move(dragFrom, i); } setDragFrom(null); setOver(null); }}
            className={cn("group relative overflow-hidden rounded-lg border border-border bg-surface", i === 0 && "col-span-2 row-span-2 sm:col-span-2", dragFrom === i && "opacity-40", over === i && dragFrom !== i && "ring-2 ring-accent")}
            onKeyDown={(e) => { if (e.altKey && e.key === "ArrowLeft") { e.preventDefault(); move(i, i - 1); } if (e.altKey && e.key === "ArrowRight") { e.preventDefault(); move(i, i + 1); } }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={it.src} alt={it.alt || `Foto ${i + 1}`} className={cn("nl-chega w-full cursor-grab object-cover active:cursor-grabbing", i === 0 ? "aspect-square" : "aspect-square")} draggable={false} />
            {i === 0 ? <span className="absolute left-2 top-2 flex items-center gap-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground"><Star className="size-3" aria-hidden /> Capa</span> : null}
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-black/70 to-transparent p-1.5">
              <div className="flex gap-0.5">
                <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label={`Mover foto ${i + 1} para trás`} className="rounded-md bg-white/95 p-1.5 text-neutral-900 shadow-sm hover:bg-white disabled:opacity-40"><ChevronLeft className="size-4" aria-hidden /></button>
                <button type="button" onClick={() => move(i, i + 1)} disabled={i === items.length - 1} aria-label={`Mover foto ${i + 1} para frente`} className="rounded-md bg-white/95 p-1.5 text-neutral-900 shadow-sm hover:bg-white disabled:opacity-40"><ChevronRight className="size-4" aria-hidden /></button>
                {i > 0 ? <button type="button" onClick={() => move(i, 0)} aria-label={`Tornar a foto ${i + 1} a capa`} className="rounded-md bg-white/95 p-1.5 text-neutral-900 shadow-sm hover:bg-white"><Star className="size-4" aria-hidden /></button> : null}
              </div>
              <div className="flex gap-0.5">
                <button type="button" onClick={() => setAltOpen(altOpen === it.id ? null : it.id)} aria-expanded={altOpen === it.id} aria-label={`Texto alternativo da foto ${i + 1}`} className="rounded-md bg-white/95 p-1.5 text-neutral-900 shadow-sm hover:bg-white"><Type className="size-4" aria-hidden /></button>
                <button type="button" onClick={() => { onChange(items.filter((x) => x.id !== it.id)); setAnnounce(`Foto ${i + 1} removida.`); }} aria-label={`Remover foto ${i + 1}`} title="Remover foto" className="rounded-md bg-white/95 p-1.5 text-danger shadow-sm hover:bg-white"><Trash2 className="size-4" aria-hidden /></button>
              </div>
            </div>
            {altOpen === it.id ? <div className="border-t border-border bg-surface p-2"><label className="sr-only" htmlFor={`alt-${it.id}`}>Texto alternativo</label><input id={`alt-${it.id}`} value={it.alt} maxLength={140} placeholder="Descreva a foto (acessibilidade e busca)" onChange={(e) => onChange(items.map((x) => (x.id === it.id ? { ...x, alt: e.target.value } : x)))} className="h-8 w-full rounded border border-border px-2 text-xs" /></div> : null}
          </li>
        ))}
        {items.length < max ? (
          <li><button type="button" onClick={() => fileRef.current?.click()} disabled={busy} className="flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-lg border border-border bg-surface text-sm text-muted-foreground transition-colors hover:border-accent hover:text-foreground disabled:opacity-60">{busy ? <Degraus className="!size-6" /> : <ImagePlus className="size-6" aria-hidden />}{busy ? "Enviando…" : "Adicionar foto"}<span className="text-[11px]">ou solte arquivos aqui</span></button></li>
        ) : null}
      </ul>
      <input ref={fileRef} type="file" accept={accept} multiple hidden onChange={(e) => void add(e.target.files)} />
      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground"><span>{items.length} de {max}. Arraste para ordenar ou use Alt + setas.</span>{items.length ? <Button type="button" variant="ghost" size="sm" onClick={() => onChange([])}>Remover todas</Button> : null}</div>
      <p className="sr-only" role="status" aria-live="polite">{announce}</p>
    </div>
  );
}
