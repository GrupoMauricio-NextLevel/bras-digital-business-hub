"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createCategoryAction, deleteCategoryAction, renameCategoryAction } from "@/app/actions/supplier";
import type { ActionResult } from "@/lib/action-result";

type Row = { id: string; name: string; productCount: number };

export function CategoriesManager({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [name, setName] = React.useState("");
  const run = (fn: () => Promise<ActionResult<unknown>>, ok: string, after?: () => void) =>
    start(async () => {
      const r = await fn();
      if (r.ok) { toast.success(ok); after?.(); router.refresh(); } else toast.error(r.error);
    });

  return (
    <div className="max-w-2xl space-y-4">
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); run(() => createCategoryAction(name), "Categoria criada", () => setName("")); }}>
        <Input aria-label="Nova categoria" placeholder="Nova categoria (ex.: Vestidos)" value={name} onChange={(e) => setName(e.target.value)} />
        <Button type="submit" loading={pending} disabled={name.trim().length < 2}>Adicionar</Button>
      </form>
      {rows.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma categoria ainda. Crie a primeira acima ou informe a categoria ao cadastrar um produto.</p> : null}
      <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
        {rows.map((c) => (
          <li key={c.id} className="flex items-center gap-3 p-3">
            <Input aria-label={`Nome da categoria ${c.name}`} defaultValue={c.name} className="h-9" onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== c.name) run(() => renameCategoryAction(c.id, v), "Categoria renomeada"); }} />
            <span className="w-24 shrink-0 text-right text-xs text-muted-foreground">{c.productCount} {c.productCount === 1 ? "produto" : "produtos"}</span>
            <Button variant="ghost" aria-label={`Excluir categoria ${c.name}`} onClick={() => { if (window.confirm(c.productCount ? `Excluir "${c.name}"? Os ${c.productCount} produtos ficam sem categoria (nada é apagado).` : `Excluir "${c.name}"?`)) run(() => deleteCategoryAction(c.id), "Categoria excluída"); }}><Trash2 /></Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
