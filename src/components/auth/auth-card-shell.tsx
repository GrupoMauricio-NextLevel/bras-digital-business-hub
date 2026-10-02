import Image from "next/image";
import { ForceLight } from "@/components/portal/force-light";
import type { ReactNode } from "react";
import { loginPhotoFor } from "./auth-photo";
import type { BrandCode } from "@/lib/brand";

/**
 * Tela de entrada no padrão "foto + cartão": a foto ocupa a tela e o cartão branco arredondado fica por cima
 * (no celular, ancorado embaixo; no computador, à direita). A foto é decorativa (alt vazio).
 */
export function AuthCardShell({ brand, children, below }: { brand: BrandCode; children: ReactNode; below?: ReactNode }) {
  const photo = loginPhotoFor(brand);
  return (
    <>
    <ForceLight />
    <main className="relative isolate flex min-h-dvh flex-col bg-[var(--brand-ink)]">
      {/* Celular: a foto ocupa o alto da tela e some no fundo da marca (rosto inteiro acima do cartão); computador: foto em tela cheia. */}
      <div aria-hidden className="absolute inset-x-0 top-0 -z-10 h-[72vh] overflow-hidden lg:inset-0 lg:h-auto">
        <Image src={photo.src} alt={photo.alt} fill priority sizes="100vw" className="object-cover" style={{ objectPosition: photo.position }} />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--brand-ink)] via-transparent to-black/10 lg:from-black/45 lg:via-black/5" />
      </div>
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-end px-4 pb-4 pt-[40vh] sm:px-6 lg:justify-center lg:pb-10 lg:pt-10">
        <div className="w-full max-w-[460px] rounded-[28px] bg-white p-6 shadow-2xl sm:p-8 lg:ml-auto">{children}</div>
        {below ? <div className="mt-4 w-full max-w-[460px] lg:ml-auto">{below}</div> : null}
      </div>
    </main>
    </>
  );
}
