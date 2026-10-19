"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { escolherMarcaMasterAction } from "@/app/actions/master-marca";
import { MASTER_MARCAS, type MarcaMaster } from "@/lib/master-marca";

/** Faixa do Master único (R2): "Todas" ou uma marca. Muda o menu e o filtro padrão das listas. */
export function SeletorMarcaMaster({ atual }: { atual: MarcaMaster | null }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const escolher = (m: string) => start(async () => {
    const r = await escolherMarcaMasterAction(m);
    if (!r.ok) toast.error(r.error ?? "Não foi possível trocar a marca."); else router.refresh();
  });
  const opcoes = [{ code: "todas", nome: "Todas as marcas" }, ...MASTER_MARCAS];
  return (
    <nav aria-label="Marca que você está vendo" className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2 text-sm" data-seletor-marca>
      <span className="text-xs text-muted-foreground">Vendo:</span>
      <div className="ds-seg" role="group">
        {opcoes.map((o) => {
          const ativo = (atual ?? "todas") === o.code;
          return <button key={o.code} type="button" className="ds-seg-btn" aria-pressed={ativo} disabled={pending} onClick={() => escolher(o.code)}>{o.nome}</button>;
        })}
      </div>
      {atual ? <span className="text-xs text-muted-foreground">Erros, qualidade, equipe e configurações ficam em “Todas as marcas”.</span> : null}
    </nav>
  );
}
