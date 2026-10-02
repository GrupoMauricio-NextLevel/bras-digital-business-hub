import "./commerce.css";
import { CommerceHeader } from "./header";
import { CommerceFooter } from "./sections";
import { supportContacts } from "@/lib/support";

export const COMMERCE_NAV = [
  { href: "/#exemplos", label: "Lojas de exemplo" },
  { href: "/#personalizar", label: "Personalização" },
  { href: "/#operacao", label: "Operação" },
  { href: "/#comecar", label: "Como começar" },
  { href: "/#duvidas", label: "Dúvidas" },
];

/** Casca do portal da NextLevel Commerce (cabeçalho e rodapé próprios). Estilos isolados: não afeta as outras marcas. */
export function CommerceShell({ children, cta, legal }: { children: React.ReactNode; cta: { href: string; label: string }; legal: string }) {
  const c = supportContacts();
  const whatsapp = c.whatsappUrl ? c.whatsappUrl.replace(/text=.*$/, `text=${encodeURIComponent("Olá! Quero saber mais sobre a NextLevel Commerce.")}`) : null;
  return (
    <div className="cm-root min-h-screen bg-[#f5f1e8] text-[#14213d]">
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2">Ir para o conteúdo</a>
      <CommerceHeader nav={COMMERCE_NAV} cta={cta} />
      <main id="conteudo">{children}</main>
      <CommerceFooter legal={legal} nav={COMMERCE_NAV} />
      {whatsapp ? <a href={whatsapp} target="_blank" rel="noreferrer" aria-label="Falar no WhatsApp" className="fixed bottom-4 right-4 z-40 inline-flex h-12 items-center gap-2 rounded-full bg-[#14213d] px-4 text-sm font-semibold text-[#f5f1e8] shadow-lg hover:bg-[#1c2d52] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f2b600]">Falar no WhatsApp</a> : null}
    </div>
  );
}
