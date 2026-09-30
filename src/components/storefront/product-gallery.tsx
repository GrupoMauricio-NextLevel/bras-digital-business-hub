"use client";
import * as React from "react";
import { ProductArt } from "@/components/app/product-art";
import { cn } from "@/lib/utils";

/** Miniaturas clicáveis com a imagem escolhida em destaque. Sem imagens reais, mostra a arte padrão do produto. */
export function ThumbsGallery({ images, name }: { images: string[]; name: string }) {
  const [i, setI] = React.useState(0);
  const list = images.filter((x) => /^https?:\/\//.test(x) || x.startsWith("data:image"));
  return (
    <div className="space-y-3">
      <ProductArt images={list.length ? [list[i]!] : images} size="lg" alt={name} className="rounded-2xl bg-neutral-100" />
      {list.length > 1 ? (
        <ul className="grid grid-cols-5 gap-2" aria-label="Imagens do produto">
          {list.slice(0, 5).map((img, n) => <li key={n}><button type="button" onClick={() => setI(n)} aria-label={`Ver imagem ${n + 1}`} aria-current={i === n} className={cn("block w-full overflow-hidden rounded-lg border-2 transition", i === n ? "border-neutral-900" : "border-transparent opacity-70 hover:opacity-100")}><ProductArt images={[img]} size="md" alt="" className="bg-neutral-100" /></button></li>)}
        </ul>
      ) : null}
    </div>
  );
}
