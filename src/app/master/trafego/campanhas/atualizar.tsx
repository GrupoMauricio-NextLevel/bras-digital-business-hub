"use client";
import * as React from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { atualizarLeituraMetaAction } from "@/app/actions/trafego";

/** Lê a Meta agora (TR6, D302). */
export function AtualizarMeta() {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  return (
    <button type="button" disabled={pending} className="ds-btn ds-btn--sm ds-btn--secondary gap-1" onClick={() => start(async () => {
      const r = await atualizarLeituraMetaAction();
      if (!r.ok) toast.error(r.error); else if (r.data.ok) toast.success(`Atualizado: ${r.data.linhas} linha(s) de ${r.data.contas} conta(s)`); else toast.error(r.data.motivo ?? "A Meta não respondeu.");
      router.refresh();
    })}><RefreshCw className={`size-4 ${pending ? "animate-spin motion-reduce:animate-none" : ""}`} aria-hidden />{pending ? "Lendo a Meta…" : "Atualizar agora"}</button>
  );
}
