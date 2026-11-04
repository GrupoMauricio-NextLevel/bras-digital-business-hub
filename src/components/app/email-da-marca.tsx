"use client";
import * as React from "react";
import { toast } from "sonner";
import { CheckCircle2, ExternalLink, Lock, Mail, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { verificarEmailAction } from "@/app/actions/dominio";

type Situacao = { dominio: string; ligado: boolean; nome: string | null };

/**
 * E-mail com o domínio da loja (D245): caminho grátis guiado (Zoho Mail, conta do lojista, até 5 caixas) com verificação
 * automática do DNS, e o adicional pago "Marca Completa" bloqueado até ser ativado pela NextLevel.
 */
export function EmailDaMarca({ dominioEmail }: { dominioEmail: string }) {
  const [s, setS] = React.useState<Situacao | null>(null);
  const [pending, start] = React.useTransition();
  const verificar = () => start(async () => { const r = await verificarEmailAction(); if (r.ok) { setS(r.data); if (r.data.ligado) toast.success(`E-mail ligado: ${r.data.nome}`); } else toast.error(r.error); });
  return (
    <div className="space-y-4 text-sm">
      <div className="rounded-xl border border-border p-4">
        <p className="flex items-center gap-2 font-semibold"><Mail className="size-4 text-muted-foreground" aria-hidden />Grátis: e-mail @{dominioEmail} no Zoho Mail</p>
        <p className="mt-1 text-muted-foreground">Até 5 caixas (ex.: contato@{dominioEmail}), sem custo, numa conta sua.</p>
        <ol className="mt-3 list-decimal space-y-1.5 pl-5">
          <li>Abra o <a href="https://www.zoho.com/mail/zohomail-pricing.html" target="_blank" rel="noreferrer" className="font-semibold text-link underline">plano grátis do Zoho Mail <ExternalLink className="inline size-3.5" aria-hidden /></a> e crie a conta com o domínio <b>{dominioEmail}</b>.</li>
          <li>O Zoho mostra os registros (MX, SPF e um TXT de verificação). Crie esses registros no mesmo lugar onde você apontou o domínio da loja.</li>
          <li>Crie as caixas que quiser no Zoho e volte aqui para conferir.</li>
        </ol>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button type="button" size="sm" variant="secondary" onClick={verificar} loading={pending}><RefreshCw /> Verificar meu e-mail</Button>
          {s ? (s.ligado
            ? <span className="inline-flex items-center gap-1.5 font-semibold text-success"><CheckCircle2 className="size-4" aria-hidden />Ligado no {s.nome}</span>
            : <span className="text-muted-foreground">Ainda sem e-mail em {s.dominio}. A mudança no DNS pode levar algumas horas.</span>) : null}
        </div>
      </div>
      <div className="rounded-xl border border-dashed border-border p-4 opacity-80">
        <p className="flex items-center gap-2 font-semibold"><Lock className="size-4 text-muted-foreground" aria-hidden />Marca Completa · em breve</p>
        <p className="mt-1 text-muted-foreground">Caixas de e-mail criadas por nós, sem configurar nada: R$ 19,90/mês com 3 caixas. Avisamos quando liberar.</p>
      </div>
    </div>
  );
}
