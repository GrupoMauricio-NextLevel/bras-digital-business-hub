import Image from "next/image";
import { ForceLight } from "@/components/portal/force-light";
import type { ReactNode } from "react";
import { AUTH_PHOTO } from "./auth-photo";

/**
 * Tela de parceiros: faixa de foto no topo e folha branca arredondada que sobe sobre ela, com o nome do programa em cor de marca,
 * um título grande e o formulário. A foto é decorativa (alt vazio).
 */
export function PartnerShell({ program, title, intro, children }: { program: string; title: string; intro?: ReactNode; children: ReactNode }) {
  const photo = AUTH_PHOTO.partner;
  return (
    <>
    <ForceLight />
    <main className="min-h-dvh bg-white">
      <div className="relative h-44 w-full overflow-hidden sm:h-56 lg:h-64">
        <Image src={photo.src} alt={photo.alt} fill priority sizes="100vw" className="object-cover" style={{ objectPosition: photo.position }} />
      </div>
      <div className="relative -mt-8 rounded-t-[32px] bg-white px-5 pb-16 pt-8 sm:px-8">
        <div className="mx-auto w-full max-w-xl">
          <p className="text-lg font-semibold text-[var(--brand-signal-text)]">{program}</p>
          <h1 className="mt-5 font-[family-name:var(--nl-font-display)] text-4xl font-extrabold leading-[1.05] tracking-tight text-neutral-950 sm:text-5xl">{title}</h1>
          {intro ? <div className="mt-3 text-base text-neutral-600">{intro}</div> : null}
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </main>
    </>
  );
}
