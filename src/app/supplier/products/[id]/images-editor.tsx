"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ImagePlus, Trash2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductArt } from "@/components/app/product-art";
import { compressImage } from "@/lib/client-image";
import { updateProductImagesAction } from "@/app/actions/supplier";

const MAX = 6;
const isReal = (s: string) => /^https?:\/\//.test(s) || s.startsWith("data:image");

export function ImagesEditor({ productId, images: initial }: { productId: string; images: string[] }) {
  const router = useRouter();
  const [images, setImages] = React.useState(initial.filter(isReal));
  const [busy, setBusy] = React.useState(false);
  const [pending, start] = React.useTransition();
  const ref = React.useRef<HTMLInputElement>(null);
  const dirty = JSON.stringify(images) !== JSON.stringify(initial.filter(isReal));
  const add = async (files: FileList | null) => {
    if (!files) return;
    setBusy(true);
    try { const next: string[] = []; for (const f of Array.from(files).slice(0, MAX - images.length)) next.push(await compressImage(f)); setImages([...images, ...next]); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Falha ao processar a imagem."); }
    finally { setBusy(false); if (ref.current) ref.current.value = ""; }
  };
  return (
    <div className="space-y-3">
      {images.length === 0 ? <ProductArt images={initial} size="md" /> : (
        <div className="grid grid-cols-3 gap-2">
          {images.map((src, i) => (
            <div key={i} className="relative aspect-square overflow-hidden rounded-md border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
              {i === 0 ? <span className="absolute left-1 top-1 rounded bg-primary px-1 text-[10px] text-primary-foreground">Capa</span> : null}
              <button type="button" onClick={() => setImages(images.filter((_, j) => j !== i))} className="absolute right-1 top-1 rounded bg-surface/90 p-0.5 text-danger" aria-label="Remover foto"><Trash2 className="size-3.5" /></button>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        {images.length < MAX ? <Button type="button" size="sm" variant="secondary" loading={busy} onClick={() => ref.current?.click()}><ImagePlus /> Adicionar fotos</Button> : null}
        <Button type="button" size="sm" disabled={!dirty} loading={pending} onClick={() => start(async () => { const r = await updateProductImagesAction({ productId, images }); if (r.ok) { toast.success("Fotos salvas"); router.refresh(); } else toast.error(r.error); })}><Save /> Salvar fotos</Button>
      </div>
      <input ref={ref} type="file" accept="image/*" multiple className="hidden" onChange={(e) => add(e.target.files)} />
    </div>
  );
}
