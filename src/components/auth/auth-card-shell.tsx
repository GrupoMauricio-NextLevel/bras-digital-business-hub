import Image from "next/image";
import type { ReactNode } from "react";
import { loginPhotoFor } from "./auth-photo";
import type { BrandCode } from "@/lib/brand";

/**
 * Tela de entrada no padrão "foto + cartão": a foto ocupa a tela e o cartão branco arredondado fica por cima
 * (no celular, ancorado embaixo; no computador, à direita). A foto é decorativa (alt vazio). Marca sem foto própria:
 * fundo na cor da marca e cartão centralizado.
 */
export function AuthCardShell({ brand, children, below }: { brand: BrandCode; children: ReactNode; below?: ReactNode }) {
  const photo = loginPhotoFor(brand);
  return (
    <>
    <main className="relative isolate flex min-h-dvh flex-col bg-band">
      {/* Celular: a foto ocupa o alto da tela e some no fundo da marca (rosto inteiro acima do cartão); computador: foto em tela cheia. */}
      {photo ? (
        // Computador: foto na parte esquerda, presa à altura da tela (o cartão fica à direita, sobre a cor da marca).
        <div aria-hidden className="absolute inset-x-0 top-0 -z-10 h-[72vh] overflow-hidden lg:fixed lg:inset-y-0 lg:left-0 lg:right-auto lg:h-auto lg:w-[58%]">
          <Image src={photo.src} alt={photo.alt} fill priority sizes="(min-width: 1024px) 58vw, 100vw" className="object-cover" style={{ objectPosition: photo.position }} />
          <div className="absolute inset-0 bg-gradient-to-t from-band via-transparent to-black/10 lg:bg-gradient-to-l lg:from-band lg:via-transparent lg:to-transparent" />
        </div>
      ) : (
        // Sem foto aprovada da marca: fundo na cor da marca (sem imagem emprestada de outra marca).
        <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -right-40 -top-40 size-[42rem] rounded-full opacity-40 blur-3xl" style={{ background: "radial-gradient(circle, var(--ds-primary), transparent 65%)" }} />
          <div className="absolute -bottom-48 -left-40 size-[34rem] rounded-full opacity-20 blur-3xl" style={{ background: "radial-gradient(circle, var(--ds-primary), transparent 65%)" }} />
          <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)", backgroundSize: "48px 48px", color: "#fff" }} />
        </div>
      )}
      <div className={`mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pb-4 sm:px-6 lg:justify-center lg:pb-10 lg:pt-10 ${photo ? "justify-end pt-[40vh]" : "justify-center pt-10"}`}>
        <div className={`w-full max-w-[460px] rounded-[28px] bg-surface p-6 shadow-2xl sm:p-8 ${photo ? "lg:ml-auto" : "mx-auto"}`}>{children}</div>
        {below ? <div className={`mt-4 w-full max-w-[460px] ${photo ? "lg:ml-auto" : "mx-auto"}`}>{below}</div> : null}
      </div>
    </main>
    </>
  );
}
