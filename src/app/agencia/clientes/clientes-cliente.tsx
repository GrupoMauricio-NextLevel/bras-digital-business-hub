"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileSpreadsheet, Plus } from "lucide-react";
import { criarClienteAction, importarClientesAction } from "@/app/actions/agencias";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { formatBRL } from "@/lib/money";

export const campo = "mt-1 h-10 w-full rounded-md border border-border bg-surface px-3 text-sm";
const num = (f: FormData, k: string) => { const v = Number(String(f.get(k) ?? "").trim()); return Number.isFinite(v) && v > 0 ? Math.round(v) : undefined; };
export const ITENS_INCLUSO = [["videos", "Vídeos"], ["fotos", "Fotos"], ["posts", "Posts"], ["criativos", "Criativos"], ["gravacoes", "Gravações"]] as const;

/** Cadastrar um cliente na carteira. Valor e vencimento só aparecem para quem cuida do contrato. */
export function NovoCliente({ equipe, contrato, abertoInicial = false }: { equipe: { id: string; nome: string }[]; contrato: boolean; abertoInicial?: boolean }) {
  const router = useRouter();
  const [aberto, setAberto] = React.useState(abertoInicial);
  const [valor, setValor] = React.useState(0);
  const [pending, start] = React.useTransition();
  if (!aberto) return <Button onClick={() => setAberto(true)}><Plus aria-hidden />Novo cliente</Button>;
  return (
    <form aria-label="Novo cliente" className="ds-card grid w-full gap-3 sm:w-[34rem]" onSubmit={(e) => {
      e.preventDefault(); const f = new FormData(e.currentTarget);
      const incluso = Object.fromEntries(ITENS_INCLUSO.map(([k]) => [k, num(f, k)]));
      start(async () => {
        const r = await criarClienteAction({
          nome: String(f.get("nome")), segmento: String(f.get("segmento") ?? ""), contatoNome: String(f.get("contatoNome") ?? ""), whatsapp: String(f.get("whatsapp") ?? ""),
          email: String(f.get("email") ?? ""), documento: String(f.get("documento") ?? ""), pacote: String(f.get("pacote") ?? ""), incluso,
          valorMensalCents: contrato && valor ? valor : null, diaVencimento: contrato ? num(f, "dia") ?? null : null, responsavelId: String(f.get("responsavel") ?? "") || null,
        });
        if (r.ok) { toast.success("Cliente cadastrado."); router.push(`/agencia/clientes/${r.data.id}`); } else toast.error(r.error);
      });
    }}>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium sm:col-span-2">Nome do cliente<Input name="nome" required minLength={2} maxLength={120} className="mt-1" /></label>
        <label className="text-sm font-medium">Segmento<Input name="segmento" maxLength={80} placeholder="Ex.: clínica, academia" className="mt-1" /></label>
        <label className="text-sm font-medium">Pessoa de contato<Input name="contatoNome" maxLength={120} className="mt-1" /></label>
        <label className="text-sm font-medium">WhatsApp<Input name="whatsapp" type="tel" maxLength={20} className="mt-1" /></label>
        <label className="text-sm font-medium">E-mail<Input name="email" type="email" maxLength={160} className="mt-1" /></label>
        <label className="text-sm font-medium">CPF ou CNPJ<Input name="documento" inputMode="numeric" maxLength={20} className="mt-1" /></label>
        <label className="text-sm font-medium">Pacote<Input name="pacote" maxLength={80} placeholder="Ex.: Mensal 8 vídeos" className="mt-1" /></label>
      </div>
      <fieldset className="rounded-lg border border-border p-3">
        <legend className="px-1 text-sm font-semibold">O que entra no mês</legend>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">{ITENS_INCLUSO.map(([k, l]) => <label key={k} className="text-sm">{l}<Input name={k} type="number" min={0} max={999} inputMode="numeric" className="mt-1" /></label>)}</div>
      </fieldset>
      {contrato ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <MoneyInput label="Valor mensal" valueCents={valor} onChange={setValor} />
          <label className="text-sm font-medium">Dia do vencimento<Input name="dia" type="number" min={1} max={28} inputMode="numeric" className="mt-1" /></label>
        </div>
      ) : <p className="text-sm text-muted-foreground">Valor e vencimento ficam com o administrador ou o financeiro.</p>}
      <label className="text-sm font-medium">Responsável na agência<select name="responsavel" className={campo}><option value="">Definir depois</option>{equipe.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}</select></label>
      <div className="flex gap-2"><Button type="submit" loading={pending}>Cadastrar</Button><Button type="button" variant="ghost" onClick={() => setAberto(false)}>Cancelar</Button></div>
    </form>
  );
}

type Previa = { novos: number; importados: number; repetidos: string[]; erros: { linha: number; motivo: string }[]; semResponsavel: string[]; previa: { nome: string; pacote: string | null; valorMensalCents: number | null; diaVencimento: number | null }[] };

/** Colar a planilha da carteira (Excel, Google Planilhas ou CSV), conferir e importar. Não duplica quem já está. */
export function ImportarClientes() {
  const router = useRouter();
  const [aberto, setAberto] = React.useState(false);
  const [texto, setTexto] = React.useState("");
  const [previa, setPrevia] = React.useState<Previa | null>(null);
  const [pending, start] = React.useTransition();
  if (!aberto) return <Button variant="secondary" onClick={() => setAberto(true)}><FileSpreadsheet aria-hidden />Importar planilha</Button>;
  const enviar = (confirmar: boolean) => start(async () => {
    const r = await importarClientesAction(texto, confirmar);
    if (!r.ok) { toast.error(r.error); return; }
    if (confirmar) { toast.success(`${r.data.importados} cliente(s) importado(s).`); setAberto(false); setTexto(""); setPrevia(null); router.refresh(); }
    else setPrevia(r.data);
  });
  return (
    <div className="ds-card grid w-full gap-3 sm:w-[34rem]">
      <label className="text-sm font-medium">Cole a planilha (com a linha de títulos)
        <textarea value={texto} onChange={(e) => { setTexto(e.target.value); setPrevia(null); }} rows={7} className={`${campo} h-auto py-2 font-mono text-xs`} placeholder={"Cliente\tPacote\tValor\tVencimento\tVídeos\tResponsável\nClínica Sorriso\tMensal 8\t2.500,00\t10\t8\tBruna"} />
      </label>
      <p className="text-xs text-muted-foreground">Títulos aceitos: Cliente, Segmento, Contato, WhatsApp, E-mail, CNPJ/CPF, Pacote, Valor, Vencimento (dia de 1 a 28), Vídeos, Fotos, Posts, Criativos, Gravações e Responsável (nome ou e-mail de alguém da equipe).</p>
      {previa ? (
        <div className="rounded-lg bg-surface-muted p-3 text-sm" role="status">
          <p><b>{previa.novos} cliente(s) novo(s)</b>{previa.repetidos.length ? ` · ${previa.repetidos.length} já na carteira (pulados)` : ""}{previa.erros.length ? ` · ${previa.erros.length} linha(s) com problema` : ""}</p>
          {previa.previa.length ? <ul className="mt-2 list-disc pl-5">{previa.previa.map((c) => <li key={c.nome}>{c.nome}{c.pacote ? ` · ${c.pacote}` : ""}{c.valorMensalCents ? ` · ${formatBRL(c.valorMensalCents)}` : ""}{c.diaVencimento ? ` · dia ${c.diaVencimento}` : ""}</li>)}</ul> : null}
          {previa.erros.length ? <ul className="mt-2 list-disc pl-5 text-danger">{previa.erros.slice(0, 10).map((e) => <li key={e.linha}>Linha {e.linha}: {e.motivo}</li>)}</ul> : null}
          {previa.semResponsavel.length ? <p className="mt-2 text-warning">Responsável não encontrado na equipe: {previa.semResponsavel.slice(0, 5).join(", ")}. Entram sem responsável.</p> : null}
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {previa?.novos ? <Button loading={pending} onClick={() => enviar(true)}>Importar {previa.novos} cliente(s)</Button> : <Button loading={pending} disabled={!texto.trim()} onClick={() => enviar(false)}>Conferir</Button>}
        <Button variant="ghost" onClick={() => { setAberto(false); setPrevia(null); }}>Cancelar</Button>
      </div>
    </div>
  );
}
