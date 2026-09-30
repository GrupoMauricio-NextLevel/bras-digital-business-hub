"use client";
import * as React from "react";
import { Bold, Check, Italic, Link2, List, Search } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FormField } from "@/components/app/form-field";
import { Input, Select, Textarea, inputClass } from "@/components/ui/input";
import { contrastLevel, contrastRatio, normalizeHex } from "@/lib/ds/color";
import { FONT_CHOICES } from "@/lib/ds/fonts";
import { isValidLink, renderMarkdownLite, SEO_LIMITS, slugify, truncate } from "@/lib/ds/text";
import { cn } from "@/lib/utils";

/* ---- Cor: seletor, hexadecimal, amostras e verificação de contraste -------- */
export function ColorField({ label, value, onChange, against, swatches = [], id, hint }: { label: string; value: string; onChange: (hex: string) => void; against?: string; swatches?: string[]; id: string; hint?: string }) {
  const [text, setText] = React.useState(value);
  React.useEffect(() => { const t = requestAnimationFrame(() => setText(value)); return () => cancelAnimationFrame(t); }, [value]);
  const commit = (v: string) => { setText(v); const n = normalizeHex(v); if (n) onChange(n); };
  const ratio = against && normalizeHex(value) ? contrastRatio(value, against) : null;
  const level = ratio ? contrastLevel(ratio) : null;
  return (
    <FormField label={label} htmlFor={id} hint={hint}>
      <div className="flex items-center gap-2">
        <input type="color" aria-label={`${label}: seletor`} value={normalizeHex(value) ?? "#000000"} onChange={(e) => commit(e.target.value)} className="size-9 shrink-0 cursor-pointer rounded-md border border-border bg-transparent p-0.5" />
        <Input id={id} value={text} onChange={(e) => commit(e.target.value)} onBlur={() => setText(value)} spellCheck={false} aria-invalid={!normalizeHex(text)} className="font-mono uppercase" maxLength={7} />
        {level ? <Badge tone={level === "fail" ? "danger" : level === "AA-large" ? "warning" : "success"} title={`Contraste ${ratio}:1 com o fundo`}>{level === "fail" ? "Baixo contraste" : level === "AA-large" ? "Só texto grande" : level}</Badge> : null}
      </div>
      {swatches.length ? <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Amostras">{swatches.map((s) => <button key={s} type="button" onClick={() => commit(s)} aria-label={`Usar ${s}`} aria-pressed={normalizeHex(value) === normalizeHex(s)} className={cn("size-6 rounded-full border border-border-strong", normalizeHex(value) === normalizeHex(s) && "ring-2 ring-ring ring-offset-2")} style={{ background: s }} />)}</div> : null}
    </FormField>
  );
}

/* ---- Faixa numérica com campo ao lado -------------------------------------- */
export function RangeField({ label, value, onChange, min, max, step = 1, unit = "", id }: { label: string; value: number; onChange: (n: number) => void; min: number; max: number; step?: number; unit?: string; id: string }) {
  return (
    <FormField label={label} htmlFor={id}>
      <div className="flex items-center gap-3">
        <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="h-2 flex-1 cursor-pointer accent-[var(--accent)]" aria-valuetext={`${value}${unit}`} />
        <div className="flex w-24 items-center gap-1"><Input type="number" aria-label={`${label}: valor`} min={min} max={max} step={step} value={value} onChange={(e) => onChange(Math.min(max, Math.max(min, Number(e.target.value) || min)))} className="h-8 px-2 text-right tabular-nums" />{unit ? <span className="text-xs text-muted-foreground">{unit}</span> : null}</div>
      </div>
    </FormField>
  );
}

/* ---- Endereço amigável com prévia do link ---------------------------------- */
export function SlugField({ label = "Endereço", value, onChange, source, prefix, id }: { label?: string; value: string; onChange: (slug: string) => void; source?: string; prefix: string; id: string }) {
  const suggestion = source ? slugify(source) : "";
  return (
    <FormField label={label} htmlFor={id} hint={value ? undefined : "Letras minúsculas, números e hífens."}>
      <div className="flex items-stretch overflow-hidden rounded-md border border-border bg-surface focus-within:ring-2 focus-within:ring-ring">
        <span className="hidden max-w-[55%] shrink-0 items-center truncate border-r border-border bg-surface-muted px-2.5 text-xs text-muted-foreground sm:flex" title={prefix}>{prefix}</span>
        <input id={id} value={value} onChange={(e) => onChange(slugify(e.target.value))} spellCheck={false} className="h-9 min-w-0 flex-1 bg-transparent px-2.5 text-sm outline-none" />
      </div>
      {suggestion && suggestion !== value ? <button type="button" onClick={() => onChange(suggestion)} className="mt-1 text-xs font-medium text-accent-foreground hover:underline">Usar “{suggestion}”</button> : null}
    </FormField>
  );
}

/* ---- Como aparece no Google ------------------------------------------------- */
export function SearchPreview({ title, description, url }: { title: string; description: string; url: string }) {
  const t = title.length > SEO_LIMITS.title, d = description.length > SEO_LIMITS.description;
  return (
    <figure className="rounded-lg border border-border bg-surface p-4" aria-label="Prévia nos resultados de busca">
      <p className="truncate text-xs text-muted-foreground">{url}</p>
      <p className="mt-0.5 truncate text-lg leading-snug text-link">{truncate(title || "Título da página", SEO_LIMITS.title + 8)}</p>
      <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{truncate(description || "Descrição que aparece abaixo do título nos resultados de busca.", SEO_LIMITS.description + 20)}</p>
      <figcaption className="mt-2 flex gap-3 text-[11px]"><span className={t ? "text-warning" : "text-muted-foreground"}>Título {title.length}/{SEO_LIMITS.title}</span><span className={d ? "text-warning" : "text-muted-foreground"}>Descrição {description.length}/{SEO_LIMITS.description}</span></figcaption>
    </figure>
  );
}

/* ---- Texto com formatação leve (markdown simples, sem HTML do usuário) ----- */
export function RichTextLite({ label, value, onChange, id, rows = 6, hint }: { label: string; value: string; onChange: (v: string) => void; id: string; rows?: number; hint?: string }) {
  const [preview, setPreview] = React.useState(false);
  const ref = React.useRef<HTMLTextAreaElement>(null);
  const wrap = (before: string, after = before, placeholder = "texto") => {
    const el = ref.current; if (!el) return;
    const s = el.selectionStart, e = el.selectionEnd; const sel = value.slice(s, e) || placeholder;
    onChange(value.slice(0, s) + before + sel + after + value.slice(e));
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(s + before.length, s + before.length + sel.length); });
  };
  const list = () => { const el = ref.current; if (!el) return; const s = el.selectionStart; const start = value.lastIndexOf("\n", s - 1) + 1; onChange(value.slice(0, start) + "- " + value.slice(start)); };
  const tool = "rounded p-1.5 text-muted-foreground hover:bg-surface-muted hover:text-foreground";
  return (
    <FormField label={label} htmlFor={id} hint={hint ?? "**negrito**, *itálico*, [link](https://…) e listas com “- ”."}>
      <div className="rounded-md border border-border bg-surface focus-within:ring-2 focus-within:ring-ring">
        <div className="flex items-center justify-between border-b border-border px-1.5 py-1">
          <div className="flex gap-0.5" role="toolbar" aria-label="Formatação">
            <button type="button" className={tool} onClick={() => wrap("**")} aria-label="Negrito"><Bold className="size-4" aria-hidden /></button>
            <button type="button" className={tool} onClick={() => wrap("*")} aria-label="Itálico"><Italic className="size-4" aria-hidden /></button>
            <button type="button" className={tool} onClick={() => wrap("[", "](https://)", "texto do link")} aria-label="Link"><Link2 className="size-4" aria-hidden /></button>
            <button type="button" className={tool} onClick={list} aria-label="Lista"><List className="size-4" aria-hidden /></button>
          </div>
          <div className="flex gap-1 text-xs"><button type="button" onClick={() => setPreview(false)} aria-pressed={!preview} className={cn("rounded px-2 py-1", !preview && "bg-surface-muted font-medium")}>Editar</button><button type="button" onClick={() => setPreview(true)} aria-pressed={preview} className={cn("rounded px-2 py-1", preview && "bg-surface-muted font-medium")}>Prévia</button></div>
        </div>
        {preview ? <div className="prose-lite min-h-24 px-3 py-2 text-sm [&_a]:text-accent-foreground [&_a]:underline [&_li]:ml-4 [&_li]:list-disc [&_p]:mb-2" dangerouslySetInnerHTML={{ __html: renderMarkdownLite(value) || "<p class='text-muted-foreground'>Nada para mostrar.</p>" }} /> : <Textarea ref={ref} id={id} rows={rows} value={value} onChange={(e) => onChange(e.target.value)} className="border-0 shadow-none focus-visible:ring-0" />}
      </div>
    </FormField>
  );
}

/* ---- Fonte: cartões com amostra -------------------------------------------- */
export function FontPicker({ label, value, onChange }: { label: string; value: string; onChange: (key: string) => void }) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-medium">{label}</legend>
      <div className="grid gap-2 sm:grid-cols-2" role="radiogroup">
        {FONT_CHOICES.map((f) => (
          <button key={f.key} type="button" role="radio" aria-checked={value === f.key} onClick={() => onChange(f.key)} className={cn("flex items-center justify-between gap-3 rounded-lg border p-3 text-left transition-colors", value === f.key ? "border-accent bg-accent-soft" : "border-border hover:bg-surface-hover")}>
            <span className="min-w-0"><span className="block text-xs text-muted-foreground">{f.label}</span><span className="block truncate text-base" style={{ fontFamily: f.stack }}>{f.sample}</span></span>
            {value === f.key ? <Check className="size-4 shrink-0 text-accent-foreground" aria-hidden /> : null}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

/* ---- Link: destinos internos e endereço livre validado ---------------------- */
export function LinkPicker({ label, value, onChange, destinations = [], id }: { label: string; value: string; onChange: (v: string) => void; destinations?: { label: string; href: string }[]; id: string }) {
  const valid = isValidLink(value);
  return (
    <FormField label={label} htmlFor={id} error={valid ? undefined : "Use https://, um caminho como /catalog, mailto: ou tel:."}>
      <div className="flex gap-2">
        <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder="https://… ou /catalog" aria-invalid={!valid} spellCheck={false} />
        {destinations.length ? <Select aria-label={`${label}: destinos da loja`} value="" onChange={(e) => e.target.value && onChange(e.target.value)} className="w-40 shrink-0"><option value="">Destinos</option>{destinations.map((d) => <option key={d.href} value={d.href}>{d.label}</option>)}</Select> : null}
      </div>
    </FormField>
  );
}

/* ---- Seletor de recursos (produtos, coleções) em janela --------------------- */
export type ResourceOption = { id: string; label: string; sublabel?: string; image?: string };
export function ResourcePicker({ label, options, value, onChange, multiple = false, noun = "item", id }: { label: string; options: ResourceOption[]; value: string[]; onChange: (ids: string[]) => void; multiple?: boolean; noun?: string; id: string }) {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const [draft, setDraft] = React.useState<string[]>(value);
  const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const shown = options.filter((o) => fold(`${o.label} ${o.sublabel ?? ""}`).includes(fold(q)));
  const chosen = options.filter((o) => value.includes(o.id));
  const toggle = (oid: string) => setDraft((d) => (multiple ? (d.includes(oid) ? d.filter((x) => x !== oid) : [...d, oid]) : [oid]));
  return (
    <FormField label={label} htmlFor={id}>
      <div className="flex flex-wrap items-center gap-2">
        {chosen.map((c) => <Badge key={c.id} tone="outline">{c.label}</Badge>)}
        <Button id={id} type="button" variant="secondary" size="sm" onClick={() => { setDraft(value); setQ(""); setOpen(true); }}>{chosen.length ? "Alterar" : `Escolher ${noun}`}</Button>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title={`Escolher ${noun}`} description={multiple ? "Marque um ou mais." : "Escolha um."}>
          <div className="relative mb-3"><Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-subtle-foreground" aria-hidden /><input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar" aria-label="Buscar" className={cn(inputClass, "pl-8")} /></div>
          <ul className="nl-scroll max-h-72 divide-y divide-border overflow-y-auto rounded-md border border-border">
            {shown.map((o) => { const on = draft.includes(o.id); return (
              <li key={o.id}><button type="button" role={multiple ? "checkbox" : "radio"} aria-checked={on} onClick={() => toggle(o.id)} className={cn("flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-surface-hover", on && "bg-accent-soft")}>
                {o.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={o.image} alt="" className="size-9 rounded object-cover" />
                ) : <span className="size-9 rounded bg-surface-muted" />}
                <span className="min-w-0 flex-1"><span className="block truncate font-medium">{o.label}</span>{o.sublabel ? <span className="block truncate text-xs text-muted-foreground">{o.sublabel}</span> : null}</span>
                {on ? <Check className="size-4 text-accent-foreground" aria-hidden /> : null}
              </button></li>
            ); })}
            {shown.length === 0 ? <li className="p-4 text-center text-sm text-muted-foreground">Nada encontrado.</li> : null}
          </ul>
          <div className="mt-4 flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button><Button type="button" onClick={() => { onChange(draft); setOpen(false); }}>Confirmar</Button></div>
        </DialogContent>
      </Dialog>
    </FormField>
  );
}

export function KeyboardHint({ keys, className }: { keys: string[]; className?: string }) {
  return <span className={cn("inline-flex items-center gap-1", className)}>{keys.map((k) => <kbd key={k} className="rounded border border-border-strong bg-surface-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground shadow-sm">{k}</kbd>)}</span>;
}
