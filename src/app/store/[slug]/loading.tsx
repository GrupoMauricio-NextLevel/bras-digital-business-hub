export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse px-4 py-8 sm:px-6">
      <div className="h-64 rounded-2xl bg-neutral-100" />
      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="aspect-[4/5] rounded-xl bg-neutral-100" />)}</div>
    </div>
  );
}
