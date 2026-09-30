"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Stepper } from "@/components/app/stepper";
import { advanceServiceOrderAction, postServiceMessageAction } from "@/app/actions/services";
import { cn, formatDateTime } from "@/lib/utils";

const STEPS = [{ key: "REQUESTED", label: "Enviado" }, { key: "IN_ANALYSIS", label: "Em análise" }, { key: "QUOTED", label: "Orçamento" }, { key: "IN_PROGRESS", label: "Execução" }, { key: "DELIVERED", label: "Entregue" }];
export type ThreadMessage = { id: string; authorRole: string; body: string; createdAt: string; mine: boolean };

/** Andamento e conversa de um pedido de serviço. O solicitante cancela até o início da execução. */
export function ServiceThread({ id, status, messages }: { id: string; status: string; messages: ThreadMessage[] }) {
  const router = useRouter();
  const [msg, setMsg] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const closed = status === "DELIVERED" || status === "CANCELED";
  const current = status === "CANCELED" ? -1 : STEPS.findIndex((s) => s.key === status);
  const run = async (fn: () => Promise<{ ok: boolean; error?: string }>, ok: string) => { setBusy(true); const r = await fn(); setBusy(false); if (r.ok) { toast.success(ok); router.refresh(); return true; } toast.error(r.error ?? "Falha"); return false; };
  return (
    <div className="space-y-5">
      {status === "CANCELED" ? <p className="rounded-md bg-surface-muted p-3 text-sm font-medium">Pedido cancelado.</p> : <Stepper steps={STEPS} current={current} />}
      <ul className="space-y-3" aria-label="Conversa">
        {messages.map((m) => (
          <li key={m.id} className={cn("max-w-[85%] rounded-lg px-3 py-2 text-sm", m.mine ? "ml-auto bg-accent-soft" : "bg-surface-muted")}>
            <div className="mb-0.5 text-[11px] text-muted-foreground">{m.mine ? "Você" : m.authorRole === "NEXTLEVEL_MASTER" ? "NextLevel" : "Cliente"} · {formatDateTime(m.createdAt)}</div>
            {m.body}
          </li>
        ))}
      </ul>
      {!closed ? (
        <form className="flex gap-2" onSubmit={async (e) => { e.preventDefault(); if (await run(() => postServiceMessageAction(id, msg), "Mensagem enviada")) setMsg(""); }}>
          <Input value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Escreva uma mensagem…" aria-label="Mensagem" />
          <Button type="submit" loading={busy} disabled={!msg.trim()}>Enviar</Button>
        </form>
      ) : null}
      {["REQUESTED", "IN_ANALYSIS", "QUOTED"].includes(status) ? <Button variant="ghost" className="text-danger" loading={busy} onClick={() => run(() => advanceServiceOrderAction(id, "CANCELED"), "Pedido cancelado")}>Cancelar pedido</Button> : null}
    </div>
  );
}
