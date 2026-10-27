"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FormField } from "@/components/app/form-field";
import { Input } from "@/components/ui/input";
import { FORMAS_DE_ENVIO, type FormaDeEnvio } from "@/lib/domain/formas-envio";
import { marcarEnviadoAction } from "@/app/actions/orders";

/**
 * Loja independente (D180): "Marcar como enviado" pede como o pedido vai e o código de rastreio. O cliente recebe por
 * e-mail o código e acompanha na página do pedido.
 */
export function EnvioDialog({ orderId, transportadoraDoPedido }: { orderId: string; transportadoraDoPedido?: string | null }) {
  const router = useRouter();
  const sugerida = FORMAS_DE_ENVIO.find((f) => transportadoraDoPedido && transportadoraDoPedido.toLowerCase().includes(f.label.toLowerCase().split(" ")[0]!))?.key;
  const [open, setOpen] = React.useState(false);
  const [forma, setForma] = React.useState<FormaDeEnvio>(sugerida ?? "CORREIOS");
  const [codigo, setCodigo] = React.useState("");
  const [transportadora, setTransportadora] = React.useState("");
  const [erro, setErro] = React.useState<string | null>(null);
  const [pending, start] = React.useTransition();
  const precisaCodigo = FORMAS_DE_ENVIO.find((f) => f.key === forma)!.rastreio;
  return (
    <>
      <Button onClick={() => setOpen(true)}><Truck /> Marcar como enviado</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title="Marcar como enviado" description="O cliente recebe um e-mail com o código de rastreio e acompanha o pedido pela página da loja.">
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault(); setErro(null);
              start(async () => {
                const r = await marcarEnviadoAction(orderId, { forma, codigo, transportadora });
                if (r.ok) { toast.success("Pedido enviado. O cliente foi avisado por e-mail."); setOpen(false); router.refresh(); } else setErro(r.error);
              });
            }}
          >
            <FormField label="Como o pedido vai" htmlFor="forma-envio">
              <select id="forma-envio" value={forma} onChange={(e) => setForma(e.target.value as FormaDeEnvio)} className="h-10 w-full rounded-[var(--ds-r-control)] border border-border bg-surface px-3 text-sm">
                {FORMAS_DE_ENVIO.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
              </select>
            </FormField>
            {forma === "TRANSPORTADORA" ? (
              <FormField label="Nome da transportadora" htmlFor="nome-transp">
                <Input id="nome-transp" value={transportadora} onChange={(e) => setTransportadora(e.target.value)} autoComplete="off" required />
              </FormField>
            ) : null}
            {precisaCodigo ? (
              <FormField label="Código de rastreio" htmlFor="codigo-rastreio" hint="Está no comprovante da postagem ou na etiqueta. Ex.: QB123456789BR">
                <Input id="codigo-rastreio" value={codigo} onChange={(e) => setCodigo(e.target.value)} autoComplete="off" autoCapitalize="characters" required minLength={6} />
              </FormField>
            ) : <p className="text-sm text-muted-foreground">Entrega própria não tem código de rastreio: o cliente vê na página do pedido que ele saiu para entrega.</p>}
            {erro ? <p role="alert" className="text-sm text-danger">{erro}</p> : null}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Voltar</Button>
              <Button type="submit" loading={pending}>Confirmar envio</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
