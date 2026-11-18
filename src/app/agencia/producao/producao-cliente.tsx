"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarPlus, Plus } from "lucide-react";
import { criarPecaAction, planejarMesAction } from "@/app/actions/agencias";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const campo = "mt-1 h-10 w-full rounded-md border border-border bg-surface px-3 text-sm";
const TIPOS = [["VIDEO", "Vídeo"], ["FOTO", "Foto"], ["CARROSSEL", "Carrossel"], ["ARTE", "Arte"], ["CRIATIVO", "Criativo de anúncio"], ["STORIES", "Stories"]] as const;

/** Cria as peças que faltam no mês pelo pacote contratado de cada cliente (não duplica). */
export function PlanejarMes({ mes, clientes }: { mes: string; clientes: { id: string; nome: string }[] }) {
  const router = useRouter();
  const [aberto, setAberto] = React.useState(false);
  const [pending, start] = React.useTransition();
  if (!aberto) return <Button variant="secondary" onClick={() => setAberto(true)}><CalendarPlus aria-hidden />Planejar o mês</Button>;
  return (
    <form aria-label="Planejar o mês" className="ds-card grid w-full gap-3 sm:w-[26rem]" onSubmit={(e) => {
      e.preventDefault(); const v = String(new FormData(e.currentTarget).get("cliente"));
      start(async () => {
        const r = await planejarMesAction(v === "todos" ? clientes.map((c) => c.id) : [v], mes);
        if (r.ok) { toast.success(r.data.criadas ? `${r.data.criadas} peça(s) criada(s) pelo pacote.` : "O mês já estava planejado."); setAberto(false); router.refresh(); } else toast.error(r.error);
      });
    }}>
      <p className="text-sm text-muted-foreground">Cria as peças que faltam para cumprir o pacote do mês (vídeos, fotos, posts e criativos). Rodar de novo não duplica.</p>
      <label className="text-sm font-medium">Cliente<select name="cliente" className={campo}><option value="todos">Todos os clientes ativos</option>{clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></label>
      <div className="flex gap-2"><Button type="submit" loading={pending}>Planejar</Button><Button type="button" variant="ghost" onClick={() => setAberto(false)}>Cancelar</Button></div>
    </form>
  );
}

export function NovaPeca({ mes, clientes, clienteInicial, tipos, entrega = "Peça" }: { mes: string; clientes: { id: string; nome: string }[]; clienteInicial?: string; /** Tipos ligados com os nomes da empresa (D340). */ tipos?: [string, string][]; entrega?: string }) {
  const opcoes = tipos?.length ? tipos : TIPOS.map(([v, l]) => [v, l] as [string, string]);
  const router = useRouter();
  const [aberto, setAberto] = React.useState(false);
  const [pending, start] = React.useTransition();
  if (!aberto) return <Button onClick={() => setAberto(true)}><Plus aria-hidden />Nova {entrega.toLowerCase()}</Button>;
  return (
    <form aria-label={`Nova ${entrega.toLowerCase()}`} className="ds-card grid w-full gap-3 sm:w-[26rem]" onSubmit={(e) => {
      e.preventDefault(); const f = new FormData(e.currentTarget);
      start(async () => {
        const r = await criarPecaAction({ clienteId: String(f.get("cliente")), tipo: String(f.get("tipo")) as (typeof TIPOS)[number][0], titulo: String(f.get("titulo")), objetivo: String(f.get("objetivo") ?? ""), mes, extra: f.get("extra") === "on" });
        if (r.ok) { toast.success(`${entrega} criada.`); router.push(`/agencia/producao/${r.data.id}`); } else toast.error(r.error);
      });
    }}>
      <label className="text-sm font-medium">Cliente<select name="cliente" defaultValue={clienteInicial ?? ""} required className={campo}><option value="" disabled>Escolha</option>{clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></label>
      <label className="text-sm font-medium">Tipo<select name="tipo" className={campo}>{opcoes.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
      <label className="text-sm font-medium">Título<Input name="titulo" required minLength={2} maxLength={160} className="mt-1" /></label>
      <label className="text-sm font-medium">Objetivo do conteúdo (opcional)<Input name="objetivo" maxLength={500} className="mt-1" /></label>
      <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" name="extra" className="size-4" />Extra (fora do pacote do mês)</label>
      <div className="flex gap-2"><Button type="submit" loading={pending}>Criar peça</Button><Button type="button" variant="ghost" onClick={() => setAberto(false)}>Cancelar</Button></div>
    </form>
  );
}
