"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateLeadAction } from "@/app/actions/leads";

const NEXT = [["NEW", "Novo"], ["CONTACTED", "Em contato"], ["WON", "Virou cliente"], ["LOST", "Perdido"]] as const;

export function LeadActions({ id, status, notes }: { id: string; status: string; notes: string | null }) {
  const router = useRouter();
  const [text, setText] = React.useState(notes ?? "");
  const [busy, setBusy] = React.useState(false);
  const run = async (patch: Parameters<typeof updateLeadAction>[1], ok: string) => { setBusy(true); const r = await updateLeadAction(id, patch); setBusy(false); if (r.ok) { toast.success(ok); router.refresh(); } else toast.error(r.error); };
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Situação do interessado">{NEXT.map(([k, l]) => <Button key={k} size="sm" variant={status === k ? "primary" : "secondary"} aria-pressed={status === k} loading={busy && status !== k} onClick={() => status !== k && run({ status: k }, l)}>{l}</Button>)}</div>
      <div className="flex gap-2"><Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Anotação" aria-label="Anotação do interessado" /><Button size="sm" variant="secondary" loading={busy} disabled={text === (notes ?? "")} onClick={() => run({ notes: text }, "Anotação salva")}>Salvar</Button></div>
    </div>
  );
}
