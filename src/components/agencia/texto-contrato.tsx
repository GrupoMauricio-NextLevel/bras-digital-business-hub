import type { Secao } from "@/lib/contratos/loja-pronta-express";

/** Texto do contrato (D321): o mesmo na prévia da agência e no portal do cliente. */
export function TextoDoContrato({ secoes }: { secoes: Secao[] }) {
  return (
    <div className="space-y-4 text-sm leading-relaxed">
      {secoes.map((s) => (
        <section key={s.titulo}>
          <h3 className="font-semibold text-[var(--ds-link)]">{s.titulo}</h3>
          {s.resumo ? <p className="mt-1 border-l-2 border-[var(--ds-link)] bg-surface-muted/60 px-3 py-2 text-[13px]">{s.resumo}</p> : null}
          {(s.paragrafos ?? []).map((p, i) => <p key={i} className="mt-1.5">{p}</p>)}
          {s.itens?.length ? <ul className="mt-1.5 list-disc space-y-1 pl-5">{s.itens.map((it, i) => <li key={i}>{it}</li>)}</ul> : null}
        </section>
      ))}
    </div>
  );
}

/** Cores da situação do contrato (D331), na lista e no detalhe. */
export const TOM_SITUACAO = { success: "bg-success-soft text-success", warning: "bg-warning-soft text-warning", info: "bg-accent-soft text-[var(--ds-link)]", neutral: "bg-surface-muted text-muted-foreground" } as const;
