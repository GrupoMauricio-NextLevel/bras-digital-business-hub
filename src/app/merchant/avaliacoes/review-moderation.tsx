"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { moderateReviewAction } from "@/app/actions/reviews";

type Row = { id: string; product: string; author: string; rating: number; body: string | null; status: "PENDING" | "APPROVED" | "REJECTED" };
const LABEL = { PENDING: "Aguardando", APPROVED: "Publicada", REJECTED: "Recusada" } as const;

export function ReviewModeration({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const act = (id: string, status: "APPROVED" | "REJECTED") => start(async () => { const r = await moderateReviewAction(id, status); if (r.ok) router.refresh(); else toast.error(r.error); });
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">Nenhuma avaliação ainda. Clientes avaliam em “Acompanhar pedido”.</p>;
  return (
    <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
      {rows.map((r) => (
        <li key={r.id} className="space-y-1 p-4 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2"><span className="font-medium">{r.product} · {r.author} · {"★".repeat(r.rating)}</span><span className="text-xs text-muted-foreground">{LABEL[r.status]}</span></div>
          {r.body ? <p className="text-muted-foreground">{r.body}</p> : null}
          <div className="flex gap-2 pt-1">
            {r.status !== "APPROVED" ? <Button variant="secondary" loading={pending} onClick={() => act(r.id, "APPROVED")}>Publicar</Button> : null}
            {r.status !== "REJECTED" ? <Button variant="ghost" loading={pending} onClick={() => act(r.id, "REJECTED")}>Recusar</Button> : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
