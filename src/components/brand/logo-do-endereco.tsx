import { BrandLogo } from "@/components/brand/brand-logo";
import { getBrand } from "@/lib/brand-server";
import { cn } from "@/lib/utils";

/**
 * Logo da marca do endereço (SuperDrop, NextLevel Commerce, Brás…), centralizada. Para telas que todas as marcas usam
 * (senha, 404, bloqueio): nunca fixar a logo de uma marca só (análise Commerce v3, problemas M1 a M6).
 */
export async function LogoDoEndereco({ className, alturaClasse = "h-9" }: { className?: string; alturaClasse?: string }) {
  const brand = await getBrand();
  return <span className={cn("flex justify-center", className)}><BrandLogo brand={brand} tone="auto" className={alturaClasse} priority /></span>;
}
