"use client";
import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { AlertCircle, AlertTriangle, CheckCircle2, FileDown, FileSpreadsheet, Upload } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, Textarea } from "@/components/ui/input";
import { importProductsCsvAction, previewProductsImportAction, type ImportResult } from "@/app/actions/supplier";
import type { Preview } from "@/lib/domain/product-import-server";

type Source = { kind: "csv"; text: string } | { kind: "xlsx"; base64: string };
const toBase64 = (buf: ArrayBuffer) => { let s = ""; const b = new Uint8Array(buf); for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000)); return btoa(s); };
const ACTION_LABEL = { CREATE: "Criar", UPDATE: "Atualizar", SKIP: "Ignorar", ERROR: "Erro" } as const;
const ACTION_TONE = { CREATE: "success", UPDATE: "info", SKIP: "neutral", ERROR: "danger" } as const;

/** Importação em três passos: escolher o arquivo, conferir o que vai acontecer e confirmar. */
export function ImportForm({ template, base = "/supplier/products" }: { template: string; base?: string }) {
  const [source, setSource] = React.useState<Source | null>(null);
  const [fileName, setFileName] = React.useState("");
  const [pasted, setPasted] = React.useState("");
  const [mode, setMode] = React.useState<"skip" | "update">("skip");
  const [preview, setPreview] = React.useState<Preview | null>(null);
  const [result, setResult] = React.useState<ImportResult | null>(null);
  const [pending, start] = React.useTransition();
  const fileRef = React.useRef<HTMLInputElement>(null);
  const current: Source | null = source ?? (pasted.trim() ? { kind: "csv", text: pasted } : null);

  const check = (src: Source | null, m = mode) => {
    if (!src) return;
    setResult(null);
    start(async () => { const r = await previewProductsImportAction({ source: src, mode: m }); if (r.ok) setPreview(r.data); else { setPreview(null); toast.error(r.error); } });
  };
  const onFile = async (file: File) => {
    setPasted(""); setFileName(file.name); setPreview(null); setResult(null);
    const src: Source = /\.xlsx$/i.test(file.name) ? { kind: "xlsx", base64: toBase64(await file.arrayBuffer()) } : { kind: "csv", text: await file.text() };
    setSource(src); check(src);
  };
  const download = () => {
    const url = URL.createObjectURL(new Blob(["﻿" + template], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = "modelo-produtos.csv"; a.click(); URL.revokeObjectURL(url);
  };
  const errorCsv = () => {
    if (!preview) return;
    const rows = preview.lines.filter((l) => l.errors.length).map((l) => `${l.line};${l.sku};"${l.name.replace(/"/g, '""')}";"${l.errors.join(", ")}"`);
    const url = URL.createObjectURL(new Blob(["﻿linha;sku;nome;erros\n" + rows.join("\n")], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = "erros-da-importacao.csv"; a.click(); URL.revokeObjectURL(url);
  };
  const run = () => current && start(async () => {
    const r = await importProductsCsvAction({ source: current, mode });
    if (r.ok) { setResult(r.data); setPreview(null); toast[r.data.failed.length ? "warning" : "success"](`${r.data.created} criado(s), ${r.data.updated} atualizado(s)`); } else toast.error(r.error);
  });

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <Card>
          <CardHeader><div><CardTitle>1. Escolha a planilha</CardTitle><CardDescription>Excel (.xlsx) ou CSV. Baixe o modelo, preencha e envie. Você confere tudo antes de importar.</CardDescription></div></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={() => fileRef.current?.click()} loading={pending && !preview}><Upload /> Escolher arquivo</Button>
              <Link href={`${base}/import/modelo`} prefetch={false} className={buttonVariants({ variant: "secondary" })}><FileSpreadsheet /> Modelo Excel (.xlsx)</Link>
              <Button type="button" variant="ghost" onClick={download}><FileDown /> Modelo CSV</Button>
              <input ref={fileRef} type="file" accept=".xlsx,.csv,text/csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void onFile(f); e.target.value = ""; }} />
            </div>
            {fileName ? <p className="text-sm text-muted-foreground">Arquivo: <b className="text-foreground">{fileName}</b></p> : null}
            <details className="text-sm"><summary className="cursor-pointer text-muted-foreground">Ou cole o conteúdo CSV</summary>
              <Textarea aria-label="Conteúdo do CSV" className="mt-2 min-h-[160px] font-mono text-xs" value={pasted} onChange={(e) => { setPasted(e.target.value); setSource(null); setFileName(""); setPreview(null); setResult(null); }} placeholder="Cole aqui o conteúdo do CSV, com a linha de cabeçalho" />
              <Button type="button" size="sm" className="mt-2" variant="secondary" disabled={!pasted.trim()} onClick={() => check({ kind: "csv", text: pasted })}>Conferir</Button>
            </details>
            <div className="flex flex-wrap items-center gap-2 text-sm"><label htmlFor="mode" className="text-muted-foreground">Se o SKU já existir:</label>
              <Select id="mode" className="w-56" value={mode} onChange={(e) => { const m = e.target.value as "skip" | "update"; setMode(m); if (current) check(current, m); }}><option value="skip">Ignorar a linha</option><option value="update">Atualizar preços, textos e medidas</option></Select></div>
          </CardContent>
        </Card>

        {preview ? (
          <Card>
            <CardHeader><div><CardTitle>2. Confira</CardTitle><CardDescription>{preview.total} linha(s): {preview.create} para criar, {preview.update} para atualizar, {preview.errors} com erro. Estoque mínimo para as lojas ativarem: {preview.minActivationStock} por tamanho.</CardDescription></div></CardHeader>
            <CardContent className="space-y-3">
              <div className="overflow-x-auto rounded-lg border border-border"><table className="w-full min-w-[40rem] text-sm">
                <thead className="bg-surface-muted text-left text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-3 py-2">Linha</th><th className="px-3 py-2">Produto</th><th className="px-3 py-2">Grade e tamanhos</th><th className="px-3 py-2">Ação</th><th className="px-3 py-2">Avisos</th></tr></thead>
                <tbody className="divide-y divide-border">{preview.lines.map((l) => (
                  <tr key={l.line} className={l.action === "ERROR" ? "bg-danger-soft/40" : undefined}>
                    <td className="px-3 py-2 tabular-nums">{l.line}</td>
                    <td className="px-3 py-2"><div className="font-medium">{l.name || "—"}</div><div className="text-xs text-muted-foreground">{l.sku}{l.newCategory ? " · categoria nova" : ""}</div></td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">{l.grid}{l.sizes ? ` · ${l.sizes}` : ""}</td>
                    <td className="px-3 py-2"><Badge tone={ACTION_TONE[l.action]}>{ACTION_LABEL[l.action]}</Badge></td>
                    <td className="px-3 py-2 text-xs">{l.errors.map((e) => <div key={e} className="flex items-start gap-1 text-danger"><AlertCircle className="mt-0.5 size-3 shrink-0" aria-hidden />{e}</div>)}{l.warnings.map((w) => <div key={w} className="flex items-start gap-1 text-warning"><AlertTriangle className="mt-0.5 size-3 shrink-0" aria-hidden />{w}</div>)}</td>
                  </tr>))}</tbody>
              </table></div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                {preview.errors > 0 ? <Button variant="ghost" size="sm" onClick={errorCsv}><FileDown /> Baixar erros</Button> : <span />}
                <Button loading={pending} disabled={preview.create + preview.update === 0} onClick={run}>3. Importar {preview.create + preview.update} produto(s)</Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {result ? (
          <Card>
            <CardContent className="space-y-3 pt-5">
              <div className="flex items-center gap-2 text-sm font-medium"><CheckCircle2 className="size-4 text-success" /> {result.created} criado(s), {result.updated} atualizado(s){result.skipped ? `, ${result.skipped} ignorado(s)` : ""}</div>
              {result.failed.length ? (
                <div>
                  <div className="mb-1 flex items-center gap-2 text-sm font-medium text-danger"><AlertCircle className="size-4" /> {result.failed.length} linha(s) com erro</div>
                  <ul className="space-y-1 text-sm">{result.failed.map((f) => <li key={f.line} className="rounded-md bg-danger-soft/50 px-3 py-1.5">Linha {f.line} {f.name ? `(${f.name})` : ""}: {f.error}</li>)}</ul>
                </div>
              ) : null}
              <Link href={base} className={buttonVariants({ variant: "secondary" })}>Ver produtos</Link>
            </CardContent>
          </Card>
        ) : null}
      </div>
      <Card className="h-fit">
        <CardHeader><CardTitle>Colunas</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p><b className="text-foreground">nome, sku, categoria, custo, preco_sugerido</b> obrigatórios. Valores em reais (149,90).</p>
          <p><b className="text-foreground">publico</b>: masculino, feminino ou infantil. Já preenche os tamanhos: adulto P, M, G, GG, XX1, 2XL; infantil 18 a 28.</p>
          <p><b className="text-foreground">estoque</b>: um número para todos os tamanhos (10), na ordem (10|20|20) ou por nome (P:10|M:20).</p>
          <p><b className="text-foreground">grade</b>: peças por tamanho para venda em grade (opcional).</p>
          <p><b className="text-foreground">peso_g e medidas</b>: para o cálculo do frete.</p>
          <p><b className="text-foreground">seo_titulo e seo_descricao</b>: aparência no Google.</p>
          <p>As lojas só ativam um produto com o estoque mínimo por tamanho.</p>
        </CardContent>
      </Card>
    </div>
  );
}
