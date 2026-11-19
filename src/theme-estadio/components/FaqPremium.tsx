export type FaqItem = { pergunta: string; resposta: string };

export function FaqPremium({ items }: { items: FaqItem[] }) {
  return (
    <section className="stadium-card p-4" aria-label="Perguntas frequentes">
      <h3 className="stadium-title text-xl">Perguntas frequentes</h3>
      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <details key={item.pergunta} className="rounded-lg border border-white/10 bg-black/20 p-3">
            <summary className="cursor-pointer list-none font-semibold">{item.pergunta}</summary>
            <p className="mt-2 text-sm text-[var(--stadium-muted)]">{item.resposta}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
