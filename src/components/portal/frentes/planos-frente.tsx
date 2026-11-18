import Link from "next/link";
import { Check } from "lucide-react";

export type CartaoPlano = { nome: string; para: string; preco: string; sufixo?: string; nota?: string; itens: string[]; cta: { rotulo: string; href: string }; destaque?: boolean };

/** Cartões de plano das páginas de frente (D336), no mesmo estilo dos cartões da Commerce. Os preços chegam prontos da página (tabela do Master). */
export function PlanosFrente({ id, titulo, texto, planos, rodape }: { id: string; titulo: string; texto?: string; planos: CartaoPlano[]; rodape?: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-t`} className="scroll-mt-16 bg-surface px-4 py-14 md:py-20">
      <div className="mx-auto max-w-6xl">
        <h2 id={`${id}-t`} className="text-3xl font-semibold tracking-tight md:text-4xl">{titulo}</h2>
        {texto ? <p className="mt-3 max-w-2xl text-body">{texto}</p> : null}
        <ul className="mt-8 grid gap-4 md:grid-cols-3">
          {planos.map((p) => (
            <li key={p.nome} className={`ec-cartao flex flex-col !p-6 ${p.destaque ? "ring-2 ring-[var(--ds-link)]" : ""}`}>
              <p className="text-sm text-muted-foreground">{p.para}</p>
              <h3 className="mt-1 text-xl font-semibold">{p.nome}</h3>
              <p className="mt-3"><span className="text-3xl font-semibold tracking-tight">{p.preco}</span>{p.sufixo ? <span className="text-sm text-muted-foreground">{p.sufixo}</span> : null}</p>
              {p.nota ? <p className="mt-1 text-xs text-muted-foreground">{p.nota}</p> : null}
              <ul className="mt-4 flex-1 space-y-2 text-sm">{p.itens.map((i) => <li key={i} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-[var(--ds-link)]" aria-hidden />{i}</li>)}</ul>
              <Link href={p.cta.href} className={`mt-6 ${p.destaque ? "ds-pub-btn" : "ds-pub-btn ds-pub-btn--ghost"} justify-center`}>{p.cta.rotulo}</Link>
            </li>
          ))}
        </ul>
        {rodape ? <div className="mt-4 text-xs text-muted-foreground">{rodape}</div> : null}
      </div>
    </section>
  );
}
