import { CommerceHeader } from "./header";
import { CommerceFooter } from "./sections";

export const COMMERCE_NAV = [
  { href: "/#exemplos", label: "Lojas de exemplo" },
  { href: "/#personalizar", label: "Personalização" },
  { href: "/#operacao", label: "Operação" },
  { href: "/#comecar", label: "Como começar" },
  { href: "/#duvidas", label: "Dúvidas" },
];

/** Casca do portal da NextLevel Commerce (cabeçalho e rodapé próprios). Estilos isolados: não afeta as outras marcas. */
export function CommerceShell({ children, cta, legal }: { children: React.ReactNode; cta: { href: string; label: string }; legal: string }) {
  return (
    <div className="min-h-screen bg-[#f5f1e8] text-[#14213d]">
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2">Ir para o conteúdo</a>
      <CommerceHeader nav={COMMERCE_NAV} cta={cta} />
      <main id="conteudo">{children}</main>
      <CommerceFooter legal={legal} nav={COMMERCE_NAV} />
    </div>
  );
}
