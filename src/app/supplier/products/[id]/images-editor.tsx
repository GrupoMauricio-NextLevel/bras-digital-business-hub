"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MediaGallery, type MediaItem } from "@/components/ds/media-gallery";
import { compressImage } from "@/lib/client-image";
import { updateProductImagesAction } from "@/app/actions/supplier";

const MAX = 6;
const isReal = (s: string) => /^https?:\/\//.test(s) || s.startsWith("data:image");
const toItems = (imgs: string[]): MediaItem[] => imgs.filter(isReal).map((src, i) => ({ id: `i${i}`, src, alt: "" }));

/** Fotos do produto: arrastar para ordenar, primeira é a capa, soltar arquivos para enviar. */
export function ImagesEditor({ productId, images: initial }: { productId: string; images: string[] }) {
  const router = useRouter();
  const [items, setItems] = React.useState<MediaItem[]>(() => toItems(initial));
  const [pending, start] = React.useTransition();
  const dirty = JSON.stringify(items.map((i) => i.src)) !== JSON.stringify(initial.filter(isReal));
  return (
    <div className="space-y-3">
      <MediaGallery items={items} onChange={setItems} max={MAX} processFile={compressImage} onError={(m) => toast.error(m)} />
      <Button type="button" size="sm" disabled={!dirty} loading={pending} onClick={() => start(async () => { const r = await updateProductImagesAction({ productId, images: items.map((i) => i.src) }); if (r.ok) { toast.success("Fotos salvas"); router.refresh(); } else toast.error(r.error); })}><Save /> Salvar fotos</Button>
    </div>
  );
}
