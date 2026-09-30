import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { timeAgo } from "@/lib/utils";
import { EmptyState } from "@/components/app/empty-state";
import { Activity } from "lucide-react";

export function ActivityFeed({ items, title = "Atividades recentes" }: { items: { id: string; message: string; createdAt: string; type: string }[]; title?: string }) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <EmptyState icon={Activity} title="Sem atividades" description="As ações importantes aparecerão aqui." className="py-8" />
        ) : (
          <ol className="relative space-y-4 border-l border-border pl-4">
            {items.map((a) => (
              <li key={a.id} className="relative text-sm">
                <span className="absolute -left-[21px] top-1.5 size-2.5 rounded-full border-2 border-surface bg-border-strong" />
                <p className="leading-snug">{a.message}</p>
                <p className="text-xs text-muted-foreground">{timeAgo(a.createdAt)}</p>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
