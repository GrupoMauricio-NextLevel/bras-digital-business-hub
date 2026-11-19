type ReviewItem = { id: string; author: string; rating: number; body: string | null };

export function ReviewsPremium({ avg, count, items }: { avg: number; count: number; items: ReviewItem[] }) {
  return (
    <section className="stadium-card p-4" aria-label="Avaliações dos clientes">
      <h3 className="stadium-title text-xl">Avaliações reais</h3>
      <p className="mt-1 text-sm text-[var(--stadium-muted)]">Nota média {avg.toFixed(1)} de 5 · {count} avaliações aprovadas</p>
      <ul className="mt-3 space-y-2 text-sm">
        {items.slice(0, 6).map((r) => (
          <li key={r.id} className="rounded-lg border border-white/10 bg-black/20 p-3">
            <p className="font-semibold">{r.author} · {"★".repeat(r.rating)}</p>
            {r.body ? <p className="mt-1 text-[var(--stadium-muted)]">{r.body}</p> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
