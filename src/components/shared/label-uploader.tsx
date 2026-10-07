"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sparkles, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FormField } from "@/components/app/form-field";
import { Input } from "@/components/ui/input";
import { attachDemoLabelAction } from "@/app/actions/demo";

const DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

/** Anexa a etiqueta (PDF do SuperFrete, Melhor Envio ou Onlog) a um pedido. Em demonstração, também gera uma etiqueta de exemplo. */
export function LabelUploader({ orderId, hasLabel = false, primary = false, size }: { orderId: string; hasLabel?: boolean; primary?: boolean; size?: "sm" | "md" | "lg" }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [file, setFile] = React.useState<File | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [demoBusy, setDemoBusy] = React.useState(false);
  return (
    <>
      <Button size={size} variant={hasLabel ? "secondary" : primary ? "primary" : "secondary"} onClick={() => setOpen(true)}>
        <Tag /> {hasLabel ? "Anexar outra etiqueta" : "Anexar etiqueta (PDF)"}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title="Anexar etiqueta de envio" description="Envie o PDF gerado na sua plataforma de envio: SuperFrete, Melhor Envio ou Onlog (máx. 3 MB, até 5 arquivos por pedido). A Central imprime a etiqueta na expedição.">
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!file) return;
              setUploading(true);
              const fd = new FormData(); fd.append("file", file);
              const res = await fetch(`/api/labels/${orderId}`, { method: "POST", body: fd });
              const body = (await res.json().catch(() => ({ ok: false, error: "Falha ao enviar." }))) as { ok: boolean; error?: string };
              setUploading(false);
              if (body.ok) { toast.success("Etiqueta anexada"); setOpen(false); setFile(null); router.refresh(); } else toast.error(body.error ?? "Falha ao enviar.");
            }}
          >
            <FormField label="Arquivo da etiqueta (PDF)" htmlFor="labelfile" hint="Exemplo: etiqueta-superfrete.pdf">
              <Input id="labelfile" type="file" accept="application/pdf,.pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} required />
            </FormField>
            {DEMO ? (
              <div className="rounded-lg border border-dashed border-warning/50 bg-warning-soft/40 p-3 text-sm">
                <p className="mb-2 font-medium text-warning">Modo demonstração</p>
                <Button type="button" variant="secondary" loading={demoBusy} onClick={async () => { setDemoBusy(true); const r = await attachDemoLabelAction(orderId); setDemoBusy(false); if (r.ok) { toast.success("Etiqueta de demonstração anexada"); setOpen(false); router.refresh(); } else toast.error(r.error); }}><Sparkles /> Gerar etiqueta de demonstração</Button>
              </div>
            ) : null}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" loading={uploading} disabled={!file}>Enviar etiqueta</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
