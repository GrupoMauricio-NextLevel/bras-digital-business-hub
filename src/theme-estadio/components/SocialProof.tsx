export function SocialProof({ vendidosHoje, emEstoque }: { vendidosHoje: number; emEstoque: number }) {
  return (
    <section className="stadium-card p-4" aria-label="Prova social">
      <h3 className="stadium-title text-xl">Quem compra, volta</h3>
      <ul className="mt-3 grid gap-2 text-sm text-[var(--stadium-muted)] sm:grid-cols-3">
        <li className="rounded-lg border border-white/10 bg-black/20 p-3"><b className="block text-2xl text-[var(--stadium-text)]">{vendidosHoje}</b> vendas hoje</li>
        <li className="rounded-lg border border-white/10 bg-black/20 p-3"><b className="block text-2xl text-[var(--stadium-text)]">{emEstoque}</b> itens em estoque</li>
        <li className="rounded-lg border border-white/10 bg-black/20 p-3"><b className="block text-2xl text-[var(--stadium-text)]">24h</b> prazo médio de expedição</li>
      </ul>
    </section>
  );
}
