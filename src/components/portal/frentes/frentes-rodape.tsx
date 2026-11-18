import Link from "next/link";
import { CHAVES_FRENTE, FRENTES } from "@/lib/marcas/frentes";
import { hrefDaFrente } from "./tambem-da-nextlevel";

/** Rodapé das quatro frentes (D336): uma coluna com as frentes e outra com as páginas que saíram do topo. */
export function FrentesRodape({ solucoesHref }: { solucoesHref: string }) {
  const mais = [["/recursos", "Recursos"], ["/integracoes", "Integrações"], ["/clientes", "Clientes"], ["/parceiros", "Parceiros"], ["/ferramentas", "Calculadoras"], ["/faq", "Dúvidas"]] as const;
  return (
    <nav aria-label="NextLevel: frentes e páginas" className="mb-6 grid gap-6 sm:grid-cols-2">
      <div>
        <h2 className="text-sm font-semibold">NextLevel</h2>
        <ul className="mt-2 space-y-1.5 text-sm">
          {CHAVES_FRENTE.map((k) => { const f = FRENTES[k]; return <li key={k}><Link href={hrefDaFrente(f, solucoesHref)} className="underline-offset-2 hover:underline"><b className="font-semibold">{f.nome}</b><span className="text-muted-foreground"> · {f.curto === "Loja virtual" ? "loja virtual" : f.curto === "Sites" ? "site e captação" : f.curto === "Business" ? "gestão do negócio" : "agência"}</span></Link></li>; })}
        </ul>
      </div>
      <div>
        <h2 className="text-sm font-semibold">Mais</h2>
        <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">{mais.map(([h, l]) => <li key={h}><Link href={h} className="underline-offset-2 hover:underline">{l}</Link></li>)}</ul>
      </div>
    </nav>
  );
}
