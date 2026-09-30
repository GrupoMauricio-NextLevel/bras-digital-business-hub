"use client";
import * as React from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { compressImage } from "@/lib/client-image";
import { uploadStoreImageAction } from "@/app/actions/assets";

/** Botão de enviar imagem: reduz no navegador, guarda na loja e devolve o endereço para o campo. */
export function ImageUploadButton({ onUploaded, maxSide = 1600, format = "jpeg", label = "Enviar imagem" }: { onUploaded: (url: string) => void; maxSide?: number; format?: "jpeg" | "png"; label?: string }) {
  const ref = React.useRef<HTMLInputElement>(null);
  const [busy, setBusy] = React.useState(false);
  const pick = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      const dataUrl = await compressImage(file, maxSide, 0.85, format);
      const r = await uploadStoreImageAction(dataUrl);
      if (r.ok) { onUploaded(r.data.url); toast.success("Imagem enviada"); } else toast.error(r.error);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Não foi possível enviar a imagem."); }
    finally { setBusy(false); if (ref.current) ref.current.value = ""; }
  };
  return (
    <>
      <Button type="button" size="sm" variant="secondary" loading={busy} onClick={() => ref.current?.click()}><ImagePlus /> {label}</Button>
      <input ref={ref} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => void pick(e.target.files?.[0])} />
    </>
  );
}

export { Trash2 as RemoveIcon };
