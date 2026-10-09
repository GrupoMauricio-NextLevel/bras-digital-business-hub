import type { ReactNode } from "react";

/**
 * Tela de parceiros: faixa na cor da marca no topo e folha branca arredondada que sobe sobre ela, com o nome do programa em cor de marca,
 * um título grande e o formulário. A foto é decorativa (alt vazio).
 */
export function PartnerShell({ program, title, intro, children }: { program: string; title: string; intro?: ReactNode; children: ReactNode }) {
  return (
    <>
    <main className="min-h-dvh bg-surface">
      {/* Sem foto até existir uma do programa de parceiros (a de loja de demonstração não serve): faixa na cor da marca. */}
      <div aria-hidden className="relative h-36 w-full overflow-hidden bg-band sm:h-44 lg:h-52">
        <div className="absolute -right-32 -top-32 size-[30rem] rounded-full opacity-40 blur-3xl" style={{ background: "radial-gradient(circle, var(--ds-primary), transparent 65%)" }} />
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
      </div>
      <div className="relative -mt-8 rounded-t-[32px] bg-surface px-5 pb-16 pt-8 sm:px-8">
        <div className="mx-auto w-full max-w-xl">
          <p className="text-lg font-semibold text-link">{program}</p>
          <h1 className="mt-5 text-[length:var(--ds-fs-h2)] font-extrabold leading-[1.05] tracking-[-0.03em] text-foreground">{title}</h1>
          {intro ? <div className="mt-3 text-base text-muted-foreground">{intro}</div> : null}
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </main>
    </>
  );
}
