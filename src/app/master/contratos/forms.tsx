"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Send, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cancelarContratoAction, enviarContratoAction } from "@/app/actions/contratos";

type Loja = { id: string; nome: string; slug: string; email: string | null };
const centavos = (v: string) => Math.round(Number(v.replace(/\./g, "").replace(",", ".")) * 100) || 0;
const somaDias = (iso: string, n: number) => { const d = new Date(`${iso}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

/** Novo contrato Loja Pronta Express (D276): o envio é a assinatura da NextLevel; o cliente aceita no painel dele. */
export function NovoContrato({ lojas, hoje }: { lojas: Loja[]; hoje: string }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [v, setV] = React.useState({ storeId: "", nome: "", documento: "", email: "", cpfRep: "", cheio: "3000", valor: "1500", sinal: "500", dataSinal: hoje, dataRestante: somaDias(hoje, 6), produtos: "40", prazo: "5", cortesia: "0" });
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setV({ ...v, [k]: e.target.value });
  const restante = Math.max(0, centavos(v.valor) - centavos(v.sinal));
  const campo = (k: keyof typeof v, rotulo: string, extra: React.InputHTMLAttributes<HTMLInputElement> = {}) => <label className="grid gap-1 text-xs font-medium">{rotulo}<Input value={v[k]} onChange={set(k)} {...extra} /></label>;
  const enviar = () => start(async () => {
    const r = await enviarContratoAction({
      storeId: v.storeId, cliente: { nome: v.nome, documento: v.documento, email: v.email },
      ...(v.cpfRep.trim() ? { contratada: { cpfRepresentante: v.cpfRep.trim() } } : {}),
      valorCheioCents: centavos(v.cheio), valorCents: centavos(v.valor), sinalCents: centavos(v.sinal), dataSinal: v.dataSinal, restanteCents: restante, dataRestante: v.dataRestante,
      produtos: Number(v.produtos) || 0, prazoDias: Number(v.prazo) || 0, cortesiaMeses: Number(v.cortesia) || 0,
    } as never);
    if (r.ok) { toast.success("Contrato assinado pela NextLevel e enviado: o cliente recebeu o aviso por e-mail para aceitar no painel."); router.refresh(); }
    else toast.error(r.error ?? "Não foi possível enviar.");
  });
  return (
    <form className="grid gap-3" aria-label="Novo contrato" onSubmit={(e) => { e.preventDefault(); enviar(); }}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="grid gap-1 text-xs font-medium sm:col-span-2">Loja do cliente
          <select className="h-10 rounded-md border bg-background px-3 text-sm" value={v.storeId} required onChange={(e) => { const l = lojas.find((x) => x.id === e.target.value); setV({ ...v, storeId: e.target.value, email: v.email || l?.email || "" }); }}>
            <option value="">Escolha a loja…</option>
            {lojas.map((l) => <option key={l.id} value={l.id}>{l.nome} (/{l.slug})</option>)}
          </select>
        </label>
        {campo("nome", "Nome completo do cliente", { required: true })}
        {campo("documento", "CPF ou CNPJ do cliente", { required: true })}
        {campo("email", "E-mail do cliente", { type: "email", required: true })}
        {campo("cpfRep", "Seu CPF (opcional)")}
        {campo("cheio", "Valor cheio (R$)", { inputMode: "decimal" })}
        {campo("valor", "Valor do contrato (R$)", { inputMode: "decimal" })}
        {campo("sinal", "Sinal (R$)", { inputMode: "decimal" })}
        {campo("dataSinal", "Data do sinal", { type: "date" })}
        <div className="grid gap-1 text-xs font-medium">Restante (R$)<p className="flex h-10 items-center rounded-md border bg-muted px-3 text-sm tabular-nums">{(restante / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p></div>
        {campo("dataRestante", "Data do restante", { type: "date" })}
        {campo("produtos", "Produtos cadastrados por nós", { inputMode: "numeric" })}
        {campo("prazo", "Prazo de entrega (dias corridos)", { inputMode: "numeric" })}
        {campo("cortesia", "Meses de cortesia da mensalidade", { inputMode: "numeric" })}
      </div>
      <p className="text-xs text-muted-foreground">Ao enviar, a NextLevel assina o contrato, o texto fica congelado e o cliente recebe um e-mail para entrar com o login dele e aceitar no painel. Com cortesia, o acesso da loja é estendido na hora. Quando o cliente aceitar, a cópia assinada em PDF vai para o seu e-mail e para o dele.</p>
      <div><Button type="submit" loading={pending} disabled={!v.storeId}><Send /> Assinar e enviar ao cliente</Button></div>
    </form>
  );
}

export function CancelarContrato({ id }: { id: string }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  return <Button size="sm" variant="ghost" loading={pending} onClick={() => { if (!confirm("Cancelar este contrato? O cliente não poderá mais aceitar.")) return; start(async () => { const r = await cancelarContratoAction(id); if (r.ok) { toast.success("Contrato cancelado"); router.refresh(); } else toast.error(r.error ?? "Não foi possível."); }); }}><XCircle /> Cancelar</Button>;
}
