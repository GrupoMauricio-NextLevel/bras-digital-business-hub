"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { deleteBrasContentAction, saveBrasContentAction } from "@/app/actions/bras";

type Item = { id: string; title: string; format: string; status: string; importerId: string | null; videoId: string | null; recordDate: string | null; owner: string | null; hook: string | null; notes: string | null; importerName: string | null; videoTitle: string | null };
type Opt = { key: string; label: string };
const VAZIO = { title: "", format: "SHORTS", status: "GRAVAR", importerId: "", videoId: "", recordDate: "", owner: "", hook: "", notes: "" };

/** Quadro da pauta por situação, com criação rápida e edição na própria linha. */
export function ContentBoard({ statuses, formats, hooks, importers, videos, items }: { statuses: Opt[]; formats: (Opt & { hint: string })[]; hooks: string[]; importers: { id: string; name: string }[]; videos: { id: string; title: string }[]; items: Item[] }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [f, setF] = React.useState(VAZIO);
  const [editing, setEditing] = React.useState<string | null>(null);
  const fmt = (k: string) => formats.find((x) => x.key === k)?.label ?? k;
  const save = (id: string | null, v: typeof VAZIO) => start(async () => {
    const r = await saveBrasContentAction(id, { ...v, format: v.format as never, status: v.status as never });
    if (r.ok) { toast.success(id ? "Pauta atualizada" : "Entrou na pauta"); if (!id) setF({ ...VAZIO, recordDate: v.recordDate, importerId: v.importerId, owner: v.owner }); setEditing(null); router.refresh(); } else toast.error(r.error);
  });
  const remove = (id: string) => start(async () => { if (!window.confirm("Tirar este item da pauta?")) return; const r = await deleteBrasContentAction(id); if (r.ok) router.refresh(); else toast.error(r.error); });
  const fields = (v: typeof VAZIO, set: (p: Partial<typeof VAZIO>) => void, p: string) => (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
      <label className="text-xs font-medium text-muted-foreground xl:col-span-2">Título<Input required value={v.title} onChange={(e) => set({ title: e.target.value })} placeholder="Ex.: Garrafa térmica 48 un." /></label>
      <label className="text-xs font-medium text-muted-foreground">Formato<Select value={v.format} onChange={(e) => set({ format: e.target.value })}>{formats.map((x) => <option key={x.key} value={x.key}>{x.label} ({x.hint})</option>)}</Select></label>
      <label className="text-xs font-medium text-muted-foreground">Situação<Select value={v.status} onChange={(e) => set({ status: e.target.value })}>{statuses.map((x) => <option key={x.key} value={x.key}>{x.label}</option>)}</Select></label>
      <label className="text-xs font-medium text-muted-foreground">Importadora<Select value={v.importerId} onChange={(e) => set({ importerId: e.target.value })}><option value="">—</option>{importers.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</Select></label>
      <label className="text-xs font-medium text-muted-foreground">Dia da gravação<Input type="date" value={v.recordDate} onChange={(e) => set({ recordDate: e.target.value })} /></label>
      <label className="text-xs font-medium text-muted-foreground">Quem grava<Input value={v.owner} onChange={(e) => set({ owner: e.target.value })} placeholder="Mauricio, Danielle" /></label>
      <label className="text-xs font-medium text-muted-foreground">Descoberta ligada<Select value={v.videoId} onChange={(e) => set({ videoId: e.target.value })}><option value="">—</option>{videos.map((x) => <option key={x.id} value={x.id}>{x.title}</option>)}</Select></label>
      <label className="text-xs font-medium text-muted-foreground xl:col-span-2">Gancho<Input list={`ganchos-${p}`} value={v.hook} onChange={(e) => set({ hook: e.target.value })} placeholder="Primeiros 3 segundos" /><datalist id={`ganchos-${p}`}>{hooks.map((h) => <option key={h} value={h} />)}</datalist></label>
      <label className="text-xs font-medium text-muted-foreground xl:col-span-2">Notas<Input value={v.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="Unidades da caixa, preço, ângulo, sinal de tendência" /></label>
    </div>
  );
  return (
    <div className="space-y-6">
      <form className="ds-card space-y-3 p-4" aria-labelledby="pt-novo" onSubmit={(e) => { e.preventDefault(); save(null, f); }}>
        <h2 id="pt-novo" className="text-base font-semibold">Adicionar à pauta</h2>
        {fields(f, (p) => setF({ ...f, ...p }), "novo")}
        <Button type="submit" loading={pending}><Plus className="size-4" aria-hidden />Adicionar</Button>
      </form>
      {editing && items.some((i) => i.id === editing) ? (
        <section className="ds-card p-4" aria-label="Editar item da pauta">
          <EditRow key={editing} item={items.find((i) => i.id === editing)!} render={(v, set) => fields(v, set, editing)} onSave={(v) => save(editing, v)} onCancel={() => setEditing(null)} pending={pending} />
        </section>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-5">
        {statuses.map((s) => {
          const col = items.filter((i) => i.status === s.key);
          return (
            <section key={s.key} aria-labelledby={`col-${s.key}`} className="space-y-2">
              <h2 id={`col-${s.key}`} className="flex items-center justify-between text-sm font-semibold">{s.label}<Badge>{col.length}</Badge></h2>
              <ul className="space-y-2">
                {col.map((i) => (
                  <li key={i.id} className="ds-card p-3 text-sm">
                    {editing === i.id ? <p className="font-semibold">{i.title} <span className="font-normal text-muted-foreground">· editando acima</span></p> : (
                      <>
                        <p className="font-semibold">{i.title}</p>
                        <p className="text-xs text-muted-foreground">{fmt(i.format)}{i.importerName ? ` · ${i.importerName}` : ""}</p>
                        {i.recordDate ? <p className="text-xs">{new Date(`${i.recordDate}T12:00:00-03:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}{i.owner ? ` · ${i.owner}` : ""}</p> : null}
                        {i.hook ? <p className="mt-1 text-xs italic">“{i.hook}”</p> : null}
                        {i.videoTitle ? <p className="mt-1 text-xs text-muted-foreground">Descoberta: {i.videoTitle}</p> : null}
                        <div className="mt-2 flex gap-1">
                          <Button size="sm" variant="secondary" onClick={() => setEditing(i.id)}>Editar</Button>
                          <Button size="icon-sm" variant="ghost" aria-label={`Tirar ${i.title} da pauta`} disabled={pending} onClick={() => remove(i.id)}><Trash2 className="size-4" aria-hidden /></Button>
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function EditRow({ item, render, onSave, onCancel, pending }: { item: Item; render: (v: typeof VAZIO, set: (p: Partial<typeof VAZIO>) => void) => React.ReactNode; onSave: (v: typeof VAZIO) => void; onCancel: () => void; pending: boolean }) {
  const [v, setV] = React.useState({ title: item.title, format: item.format, status: item.status, importerId: item.importerId ?? "", videoId: item.videoId ?? "", recordDate: item.recordDate ?? "", owner: item.owner ?? "", hook: item.hook ?? "", notes: item.notes ?? "" });
  return (
    <form className="space-y-2" onSubmit={(e) => { e.preventDefault(); onSave(v); }}>
      {render(v, (p) => setV({ ...v, ...p }))}
      <div className="flex gap-2"><Button size="sm" type="submit" loading={pending}>Gravar</Button><Button size="sm" type="button" variant="ghost" onClick={onCancel}>Cancelar</Button></div>
    </form>
  );
}
