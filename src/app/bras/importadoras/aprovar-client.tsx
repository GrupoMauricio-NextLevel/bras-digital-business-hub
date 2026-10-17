"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { reviewSupplierAction } from "@/app/actions/bras";

export type FornecedorPendente = { id: string; name: string; legalName: string | null; cnpj: string | null; tipo: string; polo: string; categories: string[]; description: string | null; contato: string; enviadoEm: string };

/** Fila de aprovação dos fornecedores que se cadastraram sozinhos (D160). Recusa exige motivo (o fornecedor vê). */
export function AprovarFornecedores({ itens }: { itens: FornecedorPendente[] }) {
  const router = useRouter();
  const [motivo, setMotivo] = React.useState<Record<string, string>>({});
  const [pending, start] = React.useTransition();
  const decidir = (id: string, decision: "APROVAR" | "RECUSAR") => start(async () => {
    const r = await reviewSupplierAction(id, { decision, note: motivo[id] });
    if (!r.ok) { toast.error(r.error); return; }
    toast.success(decision === "APROVAR" ? "Fornecedor aprovado: já aparece no diretório." : "Cadastro recusado; o fornecedor vê o motivo.");
    router.refresh();
  });
  return (
    <section className="ds-card mb-6 p-5" aria-labelledby="aprovar-t">
      <h2 id="aprovar-t" className="text-lg font-bold">Fornecedores para aprovar <span className="ml-1 rounded-full bg-[var(--bd-acao)] px-2 py-0.5 text-sm text-white">{itens.length}</span></h2>
      <p className="mt-1 text-sm text-muted-foreground">Cadastros feitos em /fornecer. Confira o CNPJ antes de aprovar: aprovado aparece para os compradores e abre o painel.</p>
      <ul className="mt-4 divide-y divide-border">
        {itens.map((f) => (
          <li key={f.id} className="grid gap-3 py-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
            <div className="min-w-0">
              <p className="font-bold">{f.name} <span className="font-normal text-muted-foreground">· {f.tipo} · {f.polo}</span></p>
              <p className="text-sm text-muted-foreground">{f.legalName} · CNPJ {f.cnpj} · enviado em {f.enviadoEm}</p>
              <p className="mt-1 text-sm">{f.categories.join(", ")}</p>
              {f.description ? <p className="mt-1 text-sm text-muted-foreground">{f.description}</p> : null}
              <p className="mt-1 text-sm">Responsável: {f.contato}</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row lg:w-[26rem]">
              <Input aria-label={`Motivo da recusa de ${f.name}`} placeholder="Motivo, se recusar" value={motivo[f.id] ?? ""} onChange={(e) => setMotivo((m) => ({ ...m, [f.id]: e.target.value }))} />
              <Button variant="secondary" disabled={pending} onClick={() => decidir(f.id, "RECUSAR")}>Recusar</Button>
              <Button disabled={pending} onClick={() => decidir(f.id, "APROVAR")}>Aprovar</Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
