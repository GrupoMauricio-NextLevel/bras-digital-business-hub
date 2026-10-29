import Link from "next/link";

/** Abas da central da IA no Master (D197). */
export function AbasIa({ atual }: { atual: "conversas" | "ajustes" }) {
  const abas = [["conversas", "/master/ia", "Conversas ao vivo"], ["ajustes", "/master/ia/ajustes", "Ajustes, chave e planos"]] as const;
  return (
    <nav aria-label="Central da IA" className="ds-seg mb-5">
      {abas.map(([k, href, rotulo]) => <Link key={k} href={href} aria-current={atual === k ? "page" : undefined} className={atual === k ? "is-active" : undefined}>{rotulo}</Link>)}
    </nav>
  );
}
