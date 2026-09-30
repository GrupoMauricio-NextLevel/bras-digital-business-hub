"use client";
import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Upload, FileDown, CheckCircle2, AlertCircle } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
import { importProductsCsvAction, type ImportResult } from "@/app/actions/supplier";

export function ImportForm({ template }: { template: string }) {
  const [csv, setCsv] = React.useState("");
  const [result, setResult] = React.useState<ImportResult | null>(null);
  const [pending, start] = React.useTransition();
  const fileRef = React.useRef<HTMLInputElement>(null);
  const lines = csv.split(/\r?\n/).filter((l) => l.trim()).length - 1;
  const download = () => {
    const url = URL.createObjectURL(new Blob(["﻿" + template], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = "modelo-produtos.csv"; a.click(); URL.revokeObjectURL(url);
  };
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <Card>
          <CardHeader><div><CardTitle>Planilha (CSV)</CardTitle><CardDescription>Exporte do Excel ou Google Sheets como CSV. Separador ; ou , e valores em reais.</CardDescription></div></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" onClick={() => fileRef.current?.click()}><Upload /> Escolher arquivo</Button>
              <Button type="button" variant="ghost" onClick={download}><FileDown /> Baixar modelo</Button>
              <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={async (e) => { const file = e.target.files?.[0]; if (file) { setCsv(await file.text()); setResult(null); } }} />
            </div>
            <Textarea aria-label="Conteúdo do CSV" className="min-h-[220px] font-mono text-xs" value={csv} onChange={(e) => { setCsv(e.target.value); setResult(null); }} placeholder="Cole aqui o conteúdo do CSV ou escolha um arquivo…" />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{lines > 0 ? `${lines} produto(s) detectado(s)` : "Nenhuma linha ainda"}</span>
              <Button loading={pending} disabled={lines < 1} onClick={() => start(async () => { const r = await importProductsCsvAction(csv); if (r.ok) { setResult(r.data); toast[r.data.failed.length ? "warning" : "success"](`${r.data.created} produto(s) criado(s)${r.data.failed.length ? `, ${r.data.failed.length} com erro` : ""}`); } else toast.error(r.error); })}>Importar {lines > 0 ? lines : ""} produtos</Button>
            </div>
          </CardContent>
        </Card>
        {result ? (
          <Card>
            <CardContent className="space-y-3 pt-5">
              <div className="flex items-center gap-2 text-sm font-medium"><CheckCircle2 className="size-4 text-success" /> {result.created} produto(s) criado(s)</div>
              {result.failed.length ? (
                <div>
                  <div className="mb-1 flex items-center gap-2 text-sm font-medium text-danger"><AlertCircle className="size-4" /> {result.failed.length} linha(s) com erro</div>
                  <ul className="space-y-1 text-sm">{result.failed.map((f) => <li key={f.line} className="rounded-md bg-danger-soft/50 px-3 py-1.5">Linha {f.line} {f.name ? `(${f.name})` : ""}: {f.error}</li>)}</ul>
                </div>
              ) : null}
              <Link href="/supplier/products" className={buttonVariants({ variant: "secondary" })}>Ver produtos</Link>
            </CardContent>
          </Card>
        ) : null}
      </div>
      <Card className="h-fit">
        <CardHeader><CardTitle>Colunas</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p><b className="text-foreground">nome, sku, categoria</b> obrigatórios.</p>
          <p><b className="text-foreground">custo, preco_sugerido, preco_minimo</b> em reais (ex.: 149,90).</p>
          <p><b className="text-foreground">tamanhos</b> separados por | (ex.: P|M|G|GG).</p>
          <p><b className="text-foreground">estoque</b> na mesma ordem (ex.: 10|20|20|10).</p>
          <p><b className="text-foreground">grade</b> opcional, peças por tamanho (ex.: 2|4|4|2).</p>
          <p><b className="text-foreground">imagens</b> opcional, URLs separadas por |.</p>
        </CardContent>
      </Card>
    </div>
  );
}
