"use client";
import { toast } from "sonner";
import { FileText, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { recordListPrintAction } from "@/app/actions/dispatch";

export function PrintButtons({ waveId, orderIds }: { waveId: string; orderIds: string[] }) {
  return (
    <div className="flex flex-wrap gap-3">
      <a href={`/api/labels/batch?wave=${waveId}`} target="_blank" rel="noreferrer" className="inline-flex h-14 items-center gap-2 rounded-lg bg-accent px-6 text-lg font-semibold text-accent-foreground hover:opacity-90"><Printer className="size-5" aria-hidden /> Imprimir etiquetas (PDF)</a>
      <Button size="lg" variant="secondary" className="h-14 text-lg" onClick={async () => { const r = await recordListPrintAction(orderIds); if (!r.ok) toast.error(r.error); window.print(); }}><FileText /> Imprimir lista de separação</Button>
    </div>
  );
}
