import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/brand/brand-logo";

/** Assinatura da desenvolvedora no rodapé: a logo oficial NextLevel (raio amarelo do grupo), clara ou escura conforme o tema. */
export function NextLevelSignature({ className, compact = false, product }: { className?: string; compact?: boolean; /** Nome do produto/marca na frase legal (obrigatório: vem da marca do endereço ou da loja). */ product: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-x-3 gap-y-2", className)}>
      <BrandLogo brand={{ code: "NEXTLEVEL", name: "NextLevel" }} className={compact ? "h-6" : "h-8"} />
      <span className="text-xs leading-snug">{product} é um sistema de tecnologia desenvolvido pela<br className="hidden sm:block" /> <b className="font-semibold">NextLevel Marketing Ltda.</b></span>
    </div>
  );
}
