"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Ilustracao } from "@/components/app/ilustracao";
import { createCampaignAction, deleteCampaignAction } from "@/app/actions/campaigns";
import { formatDateTime } from "@/lib/utils";

type Row = { id: string; text: string; linkUrl: string | null; startsAt: string; endsAt: string; state: string };

export function CampaignManager({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [f, setF] = React.useState({ text: "", linkUrl: "", startsAt: "", endsAt: "" });
  return (
    <div className="max-w-2xl space-y-6">
      <form className="grid gap-3 rounded-lg border border-border bg-surface p-4" onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await createCampaignAction(f); if (r.ok) { toast.success("Campanha salva"); setF({ text: "", linkUrl: "", startsAt: "", endsAt: "" }); router.refresh(); } else toast.error(r.error); }); }}>
        <label className="text-sm font-medium">Aviso<Input className="mt-1" maxLength={140} value={f.text} onChange={(e) => setF({ ...f, text: e.target.value })} placeholder="Frete grátis acima de R$ 299 até domingo" /></label>
        <label className="text-sm font-medium">Link (opcional)<Input className="mt-1" value={f.linkUrl} onChange={(e) => setF({ ...f, linkUrl: e.target.value })} placeholder="/store/minha-loja/catalog ou https://…" /></label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium">Começa<Input className="mt-1" type="datetime-local" value={f.startsAt} onChange={(e) => setF({ ...f, startsAt: e.target.value })} /></label>
          <label className="text-sm font-medium">Termina<Input className="mt-1" type="datetime-local" value={f.endsAt} onChange={(e) => setF({ ...f, endsAt: e.target.value })} /></label>
        </div>
        <Button type="submit" loading={pending} disabled={!f.text || !f.startsAt || !f.endsAt}>Agendar campanha</Button>
      </form>
      <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
        {rows.length === 0 ? <li className="flex items-center gap-3 p-4 text-sm text-muted-foreground"><Ilustracao nome="ui-vazio-campanhas" className="size-16" />Nenhuma campanha ainda.</li> : null}
        {rows.map((c) => (
          <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
            <div><div className="font-medium">{c.text}</div><div className="text-xs text-muted-foreground">{formatDateTime(c.startsAt)} → {formatDateTime(c.endsAt)}</div></div>
            <span className="text-xs">{c.state}</span>
            <Button variant="ghost" loading={pending} onClick={() => start(async () => { const r = await deleteCampaignAction(c.id); if (r.ok) { toast.success("Campanha excluída"); router.refresh(); } else toast.error(r.error); })}>Excluir</Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
