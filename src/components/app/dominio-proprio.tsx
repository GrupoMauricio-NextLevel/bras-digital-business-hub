"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, Copy, ExternalLink, Globe, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { removerDominioAction, salvarDominioAction, verificarDominioAction } from "@/app/actions/dominio";

type Registro = { tipo: "CNAME" | "A"; nome: string; valor: string };
type Props = { dominio: string | null; status: "NOT_CONFIGURED" | "PENDING" | "CONNECTED"; registros: Registro[]; enderecoAtual: string };

const ROTULO = { NOT_CONFIGURED: "Não configurado", PENDING: "Aguardando DNS", CONNECTED: "Conectado" } as const;

/**
 * Domínio próprio no painel do lojista (D234): três passos na mesma caixa (informar, apontar o DNS, verificar).
 * Os registros vêm do servidor (`registrosDns`); "Verificar agora" confere DNS e HTTPS de verdade.
 */
export function DominioProprio({ dominio, status, registros, enderecoAtual }: Props) {
  const router = useRouter();
  const [valor, setValor] = React.useState("");
  const [pending, start] = React.useTransition();
  const [detalhe, setDetalhe] = React.useState<string | null>(null);
  const copiar = (t: string) => { void navigator.clipboard?.writeText(t).then(() => toast.success("Copiado")); };

  const salvar = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const r = await salvarDominioAction(valor);
      if (!r.ok) { toast.error(r.error); return; }
      toast.success(r.data.hospedagem === "automatica" ? "Domínio cadastrado. Agora aponte o DNS." : "Domínio cadastrado. Agora aponte o DNS; a equipe NextLevel ativa o certificado.");
      setValor(""); router.refresh();
    });
  };
  const verificar = () => start(async () => {
    const r = await verificarDominioAction();
    if (!r.ok) { toast.error(r.error); return; }
    setDetalhe(r.data.detalhe);
    if (r.data.conectado) toast.success("Domínio conectado!");
    router.refresh();
  });
  const remover = () => start(async () => { const r = await removerDominioAction(); if (r.ok) { setDetalhe(null); router.refresh(); } else toast.error(r.error); });

  if (!dominio) {
    return (
      <form onSubmit={salvar} className="space-y-3 text-sm" aria-label="Conectar domínio próprio">
        <p className="text-muted-foreground">Hoje a loja abre em <b className="text-foreground">{enderecoAtual}</b>. Ligue o domínio da sua marca em 3 passos: informe o domínio, aponte o DNS e verifique.</p>
        <label htmlFor="dominio-novo" className="block font-medium">Seu domínio</label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input id="dominio-novo" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="www.sualoja.com.br" autoComplete="off" inputMode="url" required />
          <Button type="submit" loading={pending} disabled={!valor.trim()}><Globe /> Conectar domínio</Button>
        </div>
        <p className="text-xs text-muted-foreground">Ainda não tem domínio? Registre em registro.br (domínios .com.br) e volte aqui.</p>
      </form>
    );
  }

  return (
    <div className="space-y-4 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2 font-semibold"><Globe className="size-4 shrink-0 text-muted-foreground" aria-hidden /><span className="truncate">{dominio}</span></span>
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${status === "CONNECTED" ? "bg-success-soft text-success" : "bg-warning-soft text-warning"}`}>{status === "CONNECTED" ? <CheckCircle2 className="size-3.5" aria-hidden /> : <Loader2 className="size-3.5" aria-hidden />}{ROTULO[status]}</span>
      </div>
      {status === "CONNECTED" ? (
        <p className="text-muted-foreground">Sua loja abre em <a className="font-semibold text-link underline" href={`https://${dominio}`} target="_blank" rel="noreferrer">https://{dominio} <ExternalLink className="inline size-3.5" aria-hidden /></a>, com certificado de segurança.</p>
      ) : (
        <>
          <p className="text-muted-foreground">No site onde você comprou o domínio (Registro.br, GoDaddy, Hostinger…), abra a área de DNS e crie {registros.length > 1 ? "estes registros" : "este registro"}:</p>
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-muted text-muted-foreground"><tr><th scope="col" className="px-3 py-2 font-medium">Tipo</th><th scope="col" className="px-3 py-2 font-medium">Nome</th><th scope="col" className="px-3 py-2 font-medium">Valor</th></tr></thead>
              <tbody>
                {registros.map((r) => (
                  <tr key={`${r.tipo}-${r.nome}`} className="border-t border-border">
                    <td className="px-3 py-2 font-semibold">{r.tipo}</td>
                    <td className="px-3 py-2 font-mono">{r.nome}</td>
                    <td className="px-3 py-2"><button type="button" onClick={() => copiar(r.valor)} className="inline-flex max-w-full items-start gap-1.5 font-mono text-link hover:underline" aria-label={`Copiar ${r.valor}`}><span className="break-all text-left">{r.valor}</span><Copy className="size-3.5 shrink-0" aria-hidden /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">A mudança no DNS pode levar de alguns minutos a 24 horas. Depois, o certificado HTTPS sai sozinho.</p>
        </>
      )}
      {detalhe ? <p role="status" className="rounded-lg bg-surface-muted px-3 py-2">{detalhe}</p> : null}
      <div className="flex flex-wrap gap-2">
        {status !== "CONNECTED" ? <Button type="button" onClick={verificar} loading={pending}><RefreshCw /> Verificar agora</Button> : <Button type="button" variant="secondary" onClick={verificar} loading={pending}><RefreshCw /> Conferir conexão</Button>}
        <Button type="button" variant="ghost" onClick={remover} disabled={pending}><Trash2 /> Trocar domínio</Button>
      </div>
    </div>
  );
}
