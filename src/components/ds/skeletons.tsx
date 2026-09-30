import { Skeleton } from "@/components/ui/skeleton";

export function SkeletonHeader() {
  return <div className="mb-6 space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-8 w-64" /><Skeleton className="h-4 w-96 max-w-full" /></div>;
}

/** Esqueleto de lista: cabeçalho, barra de filtros e linhas. */
export function SkeletonList({ rows = 8 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Carregando lista">
      <SkeletonHeader />
      <div className="mb-4 flex gap-2"><Skeleton className="h-9 w-64" /><Skeleton className="h-9 w-24" /><Skeleton className="h-9 w-24" /></div>
      <div className="divide-y divide-border rounded-lg border border-border bg-surface">{Array.from({ length: rows }).map((_, i) => <div key={i} className="flex items-center gap-4 p-4"><Skeleton className="size-4" /><Skeleton className="h-4 w-1/3" /><Skeleton className="ml-auto h-4 w-20" /><Skeleton className="h-4 w-16" /></div>)}</div>
    </div>
  );
}

/** Esqueleto de página em duas colunas (editores). */
export function SkeletonTwoColumn() {
  return (
    <div role="status" aria-label="Carregando página">
      <SkeletonHeader />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6"><Skeleton className="h-56" /><Skeleton className="h-72" /><Skeleton className="h-40" /></div>
        <div className="space-y-6"><Skeleton className="h-32" /><Skeleton className="h-48" /></div>
      </div>
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div role="status" aria-label="Carregando painel">
      <SkeletonHeader />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3"><Skeleton className="h-72 lg:col-span-2" /><Skeleton className="h-72" /></div>
    </div>
  );
}
