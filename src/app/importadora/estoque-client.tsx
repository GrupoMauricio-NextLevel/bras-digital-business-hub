"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Download, FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { applyStockSheetAction, moveStockAction, previewStockSheetAction } from "@/app/actions/importadora";

const KIND = { ENTRADA: "Entrada (chegou)", SAIDA: "Saída", AJUSTE: "Ajuste (+ ou −)", CONTAGEM: "Contagem (saldo de hoje)" } as const;

/** Lançamento rápido de estoque de um produto: entrada, saída, ajuste com motivo ou contagem. */
export function MoverEstoque({ importerId, productId, title }: { importerId: string | null; productId: string; title: string }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [kind, setKind] = React.useState<keyof typeof KIND>("ENTRADA");
  const [boxes, setBoxes] = React.useState("");
  const [note, setNote] = React.useState("");
  return (
    <form className="mt-3 flex flex-wrap items-end gap-2" aria-label={`Lançar estoque de ${title}`} onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await moveStockAction(importerId, { productId, kind, boxes: Number(boxes.replace(",", ".")) || 0, note: note || undefined }); if (r.ok) { toast.success(`Saldo: ${r.data.balance} caixa(s)`); setBoxes(""); setNote(""); router.refresh(); } else toast.error(r.error); }); }}>
      <label className="flex flex-col text-xs font-medium text-muted-foreground">Movimento<Select value={kind} onChange={(e) => setKind(e.target.value as keyof typeof KIND)} className="mt-1">{Object.entries(KIND).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select></label>
      <label className="flex flex-col text-xs font-medium text-muted-foreground">Caixas<Input required inputMode="numeric" value={boxes} onChange={(e) => setBoxes(e.target.value.replace(/[^\d-]/g, ""))} className="mt-1 w-24" /></label>
      {kind === "AJUSTE" || kind === "SAIDA" ? <label className="flex flex-col text-xs font-medium text-muted-foreground">Motivo<Input required={kind === "AJUSTE"} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex.: 2 caixas avariadas" className="mt-1 w-48" /></label> : null}
      <Button type="submit" disabled={pending}>Lançar</Button>
    </form>
  );
}

type Line = { line: number; sku: string; action: "CRIAR" | "ATUALIZAR" | "IGNORAR"; title: string; stockBefore: number | null; stockAfter: number | null; errors: string[] };
const ACAO = { CRIAR: "Novo produto", ATUALIZAR: "Atualiza", IGNORAR: "Fica de fora" } as const;

/** Planilha de produtos e estoque: baixar o modelo, enviar, ver a prévia linha a linha e só então gravar. */
export function PlanilhaEstoque({ importerId, modeloHref }: { importerId: string | null; modeloHref: string }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [file, setFile] = React.useState<{ kind: "csv"; text: string } | { kind: "xlsx"; base64: string } | null>(null);
  const [name, setName] = React.useState("");
  const [prev, setPrev] = React.useState<Line[] | null>(null);
  const pick = async (f: File | undefined) => {
    setPrev(null); if (!f) return;
    setName(f.name);
    const src = f.name.toLowerCase().endsWith(".csv") ? { kind: "csv" as const, text: await f.text() } : { kind: "xlsx" as const, base64: btoa(Array.from(new Uint8Array(await f.arrayBuffer()), (b) => String.fromCharCode(b)).join("")) };
    setFile(src);
    start(async () => { const r = await previewStockSheetAction(importerId, src); if (r.ok) setPrev(r.data); else toast.error(r.error); });
  };
  const ok = prev?.filter((l) => l.action !== "IGNORAR").length ?? 0;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <a href={modeloHref} className="ds-btn ds-btn--secondary"><Download className="size-4" aria-hidden />Baixar planilha modelo</a>
        <label className="ds-btn cursor-pointer"><FileUp className="size-4" aria-hidden />Enviar planilha (.xlsx ou .csv)<input type="file" accept=".xlsx,.csv" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} /></label>
        {name ? <span className="text-sm text-muted-foreground">{name}</span> : null}
      </div>
      {prev ? (
        <div className="space-y-3">
          <div className="ds-card overflow-x-auto">
            <table className="w-full min-w-[40rem] text-sm">
              <caption className="sr-only">Prévia da planilha</caption>
              <thead><tr className="border-b border-border text-left text-xs text-muted-foreground"><th scope="col" className="p-2">Linha</th><th scope="col" className="p-2">SKU</th><th scope="col" className="p-2">Produto</th><th scope="col" className="p-2">O que acontece</th><th scope="col" className="p-2">Estoque</th></tr></thead>
              <tbody>{prev.map((l) => (
                <tr key={l.line} className="border-b border-border last:border-0">
                  <td className="p-2 tabular-nums">{l.line}</td><td className="p-2 font-mono">{l.sku || "—"}</td><td className="p-2">{l.title}</td>
                  <td className="p-2">{ACAO[l.action]}{l.errors.length ? <span className="block text-xs text-danger">{l.errors.join("; ")}</span> : null}</td>
                  <td className="p-2 tabular-nums">{l.stockAfter === null ? "não muda" : `${l.stockBefore ?? 0} → ${l.stockAfter}`}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <Button disabled={pending || !ok || !file} onClick={() => start(async () => { const r = await applyStockSheetAction(importerId, file!); if (r.ok) { toast.success(`Gravado: ${r.data.created} novo(s), ${r.data.updated} atualizado(s), ${r.data.counted} contagem(ns)`); setPrev(null); setFile(null); setName(""); router.refresh(); } else toast.error(r.error); })}>Gravar {ok} linha(s)</Button>
        </div>
      ) : null}
    </div>
  );
}
