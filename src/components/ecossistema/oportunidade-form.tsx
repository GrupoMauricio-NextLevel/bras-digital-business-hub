"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { updateOpportunityAction } from "@/app/actions/torre";

const STATUS = [["NOVA", "Nova"], ["EM_CONTATO", "Em contato"], ["ATIVOU", "Ativou"], ["DESCARTADA", "Descartada"]] as const;

/** Muda a situação de uma oportunidade (quem mexe primeiro vira o dono). */
export function OportunidadeForm({ id, status, label }: { id: string; status: string; label: string }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [v, setV] = React.useState(status);
  return (
    <form className="flex items-center gap-2" aria-label={`Situação: ${label}`} onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await updateOpportunityAction(id, { status: v as "NOVA" }); if (r.ok) { toast.success("Oportunidade atualizada"); router.refresh(); } else toast.error(r.error); }); }}>
      <Select aria-label="Situação" value={v} onChange={(e) => setV(e.target.value)} className="h-9 w-36">{STATUS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</Select>
      <Button type="submit" size="sm" variant="secondary" loading={pending} disabled={v === status}>Gravar</Button>
    </form>
  );
}
