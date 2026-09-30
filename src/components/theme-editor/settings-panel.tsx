"use client";
import * as React from "react";
import { Lock } from "lucide-react";
import { FormField } from "@/components/app/form-field";
import { Input, Select, Switch, Textarea } from "@/components/ui/input";
import { ColorField, FontPicker, LinkPicker, RangeField, ResourcePicker, RichTextLite } from "@/components/ds/fields";
import { isValidImageRef } from "@/lib/themes/settings";
import type { SettingDef, SettingValue } from "@/lib/themes/types";

export type PickerData = { products: { id: string; label: string; sublabel?: string }[]; categories: { id: string; label: string }[] };
const DESTINATIONS = [{ label: "Início", href: "/" }, { label: "Catálogo", href: "/catalog" }, { label: "Carrinho", href: "/cart" }];

/** Um campo do esquema, desenhado pelo tipo. O mesmo componente serve seções, blocos e o estilo do tema. */
export function SettingField({ def, value, onChange, data, idPrefix, locked }: { def: SettingDef; value: SettingValue | undefined; onChange: (v: SettingValue) => void; data: PickerData; idPrefix: string; locked?: boolean }) {
  const id = `${idPrefix}-${def.id}`; const v = value ?? "";
  const lockNote = locked ? <span className="ml-1 inline-flex items-center gap-1 text-[11px] font-normal text-muted-foreground"><Lock className="size-3" aria-hidden /> Loja própria</span> : null;
  const wrap = (children: React.ReactNode, label = def.label) => <FormField label={label} htmlFor={id} hint={def.info}>{children}</FormField>;
  switch (def.type) {
    case "text": return wrap(<Input id={id} value={String(v)} maxLength={def.maxLength} placeholder={def.placeholder} onChange={(e) => onChange(e.target.value)} />);
    case "textarea": return wrap(<Textarea id={id} value={String(v)} maxLength={def.maxLength} rows={3} onChange={(e) => onChange(e.target.value)} />);
    case "richtext": return <RichTextLite id={id} label={def.label} value={String(v)} onChange={onChange} />;
    case "color": return <ColorField id={id} label={def.label} value={String(v)} onChange={onChange} against="#ffffff" swatches={["#0f172a", "#16a34a", "#1d4ed8", "#7c2d12", "#b42318", "#4c1d95"]} />;
    case "range": return <RangeField id={id} label={def.label} value={Number(v)} onChange={onChange} min={def.min ?? 0} max={def.max ?? 100} step={def.step ?? 1} unit={def.unit} />;
    case "number": return wrap(<Input id={id} type="number" value={Number(v)} min={def.min} max={def.max} step={def.step} onChange={(e) => onChange(Number(e.target.value))} />);
    case "select": return wrap(<Select id={id} value={String(v)} onChange={(e) => onChange(e.target.value)}>{def.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</Select>);
    case "checkbox": return <div className="py-1"><Switch checked={v === true} onCheckedChange={onChange} label={def.label} /></div>;
    case "url": return <LinkPicker id={id} label={def.label} value={String(v)} onChange={onChange} destinations={DESTINATIONS} />;
    case "image": { const ok = isValidImageRef(String(v)); return <FormField label={def.label} htmlFor={id} error={ok ? undefined : "Use um endereço https:// ou um caminho da loja."} hint="Envio de imagem chega em breve. Por enquanto use o endereço da imagem.">
      <Input id={id} value={String(v)} placeholder="https://…" aria-invalid={!ok} onChange={(e) => onChange(e.target.value)} />
      {ok && String(v) ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={String(v)} alt="" className="mt-2 h-20 rounded-md border border-border object-cover" />
      ) : null}</FormField>; }
    case "product": return <ResourcePicker id={id} label={def.label} noun="produto" options={data.products} value={v ? [String(v)] : []} onChange={(ids) => onChange(ids[0] ?? "")} />;
    case "collection": return wrap(<Select id={id} value={String(v)} onChange={(e) => onChange(e.target.value)}><option value="">Nenhuma</option>{data.categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</Select>);
    case "font": return <div><FontPicker label={def.label} value={String(v)} onChange={onChange} />{lockNote}</div>;
  }
}
