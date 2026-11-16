"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { atualizarContatoAction, registrarContatoManualAction } from "@/app/actions/contatos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";

const campo = "mt-1 h-10 w-full rounded-md border border-border bg-surface px-3 text-sm";

/** Lançar um contato que chegou por fora do site (WhatsApp, telefone, balcão). Já entra "em atendimento" com você. */
export function NovoContatoManual({ servicos }: { servicos: { id: string; nome: string }[] }) {
  const router = useRouter();
  const [aberto, setAberto] = React.useState(false);
  const [pending, start] = React.useTransition();
  if (!aberto) return <Button onClick={() => setAberto(true)}><Plus aria-hidden />Lançar contato</Button>;
  return (
    <form className="grid w-full gap-2 rounded-xl border border-border bg-surface p-3 sm:w-[28rem]" onSubmit={(e) => {
      e.preventDefault(); const f = new FormData(e.currentTarget);
      start(async () => {
        const r = await registrarContatoManualAction({ nome: String(f.get("nome")), whatsapp: String(f.get("whatsapp") ?? ""), servicoId: String(f.get("servico") ?? "") || null, mensagem: String(f.get("mensagem") ?? ""), via: f.get("via") === "WHATSAPP_CONFIRMADO" ? "WHATSAPP_CONFIRMADO" : "MANUAL" });
        if (r.ok) { toast.success("Contato lançado."); router.push(`/merchant/contatos/${r.data.id}`); } else toast.error(r.error);
      });
    }}>
      <label className="text-sm font-medium">Nome<Input name="nome" required minLength={2} maxLength={120} className="mt-1" /></label>
      <label className="text-sm font-medium">WhatsApp<Input name="whatsapp" type="tel" maxLength={20} className="mt-1" /></label>
      {servicos.length ? <label className="text-sm font-medium">Serviço<select name="servico" className={campo}><option value="">Nenhum</option>{servicos.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}</select></label> : null}
      <label className="text-sm font-medium">Chegou por<select name="via" className={campo}><option value="WHATSAPP_CONFIRMADO">Conversa no WhatsApp</option><option value="MANUAL">Telefone, balcão ou outro</option></select></label>
      <label className="text-sm font-medium">Anotação (opcional)<Input name="mensagem" maxLength={1000} className="mt-1" /></label>
      <div className="flex gap-2"><Button type="submit" loading={pending}>Lançar</Button><Button type="button" variant="ghost" onClick={() => setAberto(false)}>Cancelar</Button></div>
    </form>
  );
}

type Situacao = "NOVO" | "EM_ATENDIMENTO" | "ORCAMENTO_ENVIADO" | "GANHO" | "PERDIDO";
/** Andamento do contato: assumir, mudar a situação, valor de quem fechou, motivo de quem perdeu e anotações. */
export function AndamentoDoContato({ id, situacao, valorCents, motivoPerda, notas, temResponsavel, motivos }: { id: string; situacao: Situacao; valorCents: number | null; motivoPerda: string | null; notas: string | null; temResponsavel: boolean; motivos: readonly string[] }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [valor, setValor] = React.useState(valorCents ?? 0);
  const [motivo, setMotivo] = React.useState(motivoPerda ?? "");
  const [nota, setNota] = React.useState(notas ?? "");
  const salvar = (dados: Parameters<typeof atualizarContatoAction>[1], ok: string) => start(async () => { const r = await atualizarContatoAction(id, dados); if (r.ok) { toast.success(ok); router.refresh(); } else toast.error(r.error); });
  const PASSOS: [Situacao, string][] = [["EM_ATENDIMENTO", "Em atendimento"], ["ORCAMENTO_ENVIADO", "Orçamento enviado"]];
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {!temResponsavel ? <Button loading={pending} onClick={() => salvar({ assumir: true, situacao: situacao === "NOVO" ? "EM_ATENDIMENTO" : undefined }, "Contato com você.")}>Assumir o atendimento</Button> : null}
        {PASSOS.map(([s, l]) => <Button key={s} variant={situacao === s ? "primary" : "secondary"} disabled={pending || situacao === s} onClick={() => salvar({ situacao: s }, `Marcado: ${l}.`)}>{l}</Button>)}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <fieldset className="rounded-xl border border-border p-4">
          <legend className="px-1 text-sm font-semibold">Fechou</legend>
          <MoneyInput label="Valor fechado" valueCents={valor} onChange={setValor} />
          <Button className="mt-3" variant={situacao === "GANHO" ? "primary" : "secondary"} loading={pending} onClick={() => salvar({ situacao: "GANHO", valorCents: valor || null }, "Parabéns! Marcado como fechado.")}>Marcar como fechado</Button>
        </fieldset>
        <fieldset className="rounded-xl border border-border p-4">
          <legend className="px-1 text-sm font-semibold">Perdeu</legend>
          <label className="text-sm font-medium">Motivo<select value={motivo} onChange={(e) => setMotivo(e.target.value)} className={campo}><option value="">Escolha</option>{motivos.map((m) => <option key={m} value={m}>{m}</option>)}</select></label>
          <Button className="mt-3" variant="secondary" disabled={!motivo} loading={pending} onClick={() => salvar({ situacao: "PERDIDO", motivoPerda: motivo as never }, "Marcado como perdido.")}>Marcar como perdido</Button>
        </fieldset>
      </div>
      <label className="block text-sm font-medium">Anotações da equipe<textarea value={nota} onChange={(e) => setNota(e.target.value)} rows={3} maxLength={2000} className={`${campo} h-auto py-2`} /></label>
      <Button variant="secondary" loading={pending} onClick={() => salvar({ notas: nota }, "Anotação salva.")}>Salvar anotação</Button>
    </div>
  );
}
