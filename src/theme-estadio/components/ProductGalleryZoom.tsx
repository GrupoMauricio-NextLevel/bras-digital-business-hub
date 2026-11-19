"use client";

import * as React from "react";
import { ProductArt } from "@/components/app/product-art";

const isPhoto = (x: string) => /^https?:\/\//.test(x) || x.startsWith("data:image") || (x.startsWith("/") && !x.startsWith("//"));

export function ProductGalleryZoom({ images, name }: { images: string[]; name: string }) {
  const list = images.filter(isPhoto);
  const [idx, setIdx] = React.useState(0);
  const [zoom, setZoom] = React.useState<{ x: number; y: number } | null>(null);
  const current = list[idx] ?? images[0] ?? "";
  return (
    <div className="stadium-card p-4">
      <div
        className="relative overflow-hidden rounded-xl bg-black/20"
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const x = ((e.clientX - r.left) / r.width) * 100;
          const y = ((e.clientY - r.top) / r.height) * 100;
          setZoom({ x, y });
        }}
        onMouseLeave={() => setZoom(null)}
      >
        <div style={{ transform: zoom ? "scale(1.45)" : "scale(1)", transformOrigin: zoom ? `${zoom.x}% ${zoom.y}%` : "center", transition: "transform 160ms ease" }}>
          <ProductArt images={[current]} size="lg" alt={name} className="rounded-xl" priority />
        </div>
      </div>
      {list.length > 1 ? (
        <ul className="mt-3 grid grid-cols-5 gap-2" aria-label="Galeria de imagens do produto">
          {list.slice(0, 10).map((img, i) => (
            <li key={img + i}>
              <button type="button" onClick={() => setIdx(i)} aria-label={`Abrir foto ${i + 1}`} aria-current={idx === i} className="w-full overflow-hidden rounded-lg border border-white/20 data-[active=true]:border-[var(--stadium-accent)]" data-active={idx === i}>
                <ProductArt images={[img]} size="md" alt="" className="bg-black/20" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
