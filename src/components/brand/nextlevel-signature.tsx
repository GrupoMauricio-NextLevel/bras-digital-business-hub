import { cn } from "@/lib/utils";

/** Assinatura da desenvolvedora no rodapé: a logo NextLevel (arte para fundo escuro) em uma plaquinha preta. */
export function NextLevelSignature({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-x-3 gap-y-2", className)}>
      <span className="inline-flex items-center rounded-lg bg-black px-3 py-1.5">
        {/* eslint-disable-next-line @next/next/no-img-element -- arquivo estático pequeno */}
        <img src="/brand/nextlevel-logo.webp" width={640} height={174} alt="NextLevel" className={cn("w-auto", compact ? "h-6" : "h-8")} loading="lazy" decoding="async" />
      </span>
      <span className="text-xs leading-snug">SuperDrop é um sistema de tecnologia desenvolvido pela<br className="hidden sm:block" /> <b className="font-semibold">NextLevel Marketing Ltda.</b></span>
    </div>
  );
}
