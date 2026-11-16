"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { criarServicoAction, editarServicoAction } from "@/app/actions/site";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { EmptyState } from "@/components/app/empty-state";
import { formatBRL } from "@/lib/money";

type Servico = { id: string; nome: string; resumo: string; precoAPartirCents: number | null; ativo: boolean; imagemUrl: string };
const vazio = { nome: "", resumo: "", preco: 0, imagemUrl: "" };

/** Cadastro dos serviços (NB2, D307): nome, resumo, "a partir de" opcional e foto. Esconder tira do site sem apagar. */
export function ServicosCliente({ servicos, temWhatsapp }: { servicos: Servico[]; temWhatsapp: boolean }) {
  const router = useRouter();
  const [editando, setEditando] = React.useState<string | null>(null);
  const [f, setF] = React.useState(vazio);
  const [pending, start] = React.useTransition();
  const abrir = (s?: Servico) => { setEditando(s?.id ?? "novo"); setF(s ? { nome: s.nome, resumo: s.resumo, preco: s.precoAPartirCents ?? 0, imagemUrl: s.imagemUrl } : vazio); };
  const salvar = () => start(async () => {
    const dados = { nome: f.nome, resumo: f.resumo || null, precoAPartirCents: f.preco > 0 ? f.preco : null, imagemUrl: f.imagemUrl || null };
    const atual = servicos.find((s) => s.id === editando);
    const r = editando === "novo" ? await criarServicoAction(dados) : await editarServicoAction(editando!, { ...dados, ativo: atual?.ativo });
    if (r.ok) { toast.success("Serviço salvo."); setEditando(null); router.refresh(); } else toast.error(r.error);
  });
  const alternar = (s: Servico) => start(async () => {
    const r = await editarServicoAction(s.id, { nome: s.nome, resumo: s.resumo || null, precoAPartirCents: s.precoAPartirCents, imagemUrl: s.imagemUrl || null, ativo: !s.ativo });
    if (r.ok) { toast.success(s.ativo ? "Serviço escondido do site." : "Serviço de volta no site."); router.refresh(); } else toast.error(r.error);
  });
  return (
    <div className="space-y-4">
      {!temWhatsapp ? <p role="status" className="rounded-xl border border-warning/40 bg-warning-soft px-4 py-3 text-sm">O botão “Pedir orçamento” usa o WhatsApp da empresa. Preencha o WhatsApp em Ajustes → Empresa para ele aparecer.</p> : null}
      {servicos.length ? (
        <ul className="divide-y divide-border rounded-2xl border border-border bg-surface" aria-label="Serviços">
          {servicos.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{s.nome}{s.ativo ? "" : <span className="ml-2 text-xs font-normal text-muted-foreground">(escondido do site)</span>}</p>
                <p className="text-xs text-muted-foreground">{s.resumo || "Sem resumo"} · {s.precoAPartirCents ? `a partir de ${formatBRL(s.precoAPartirCents)}` : "sob orçamento"}</p>
              </div>
              <Button size="sm" variant="secondary" onClick={() => abrir(s)}>Editar</Button>
              <Button size="sm" variant="ghost" disabled={pending} onClick={() => alternar(s)}>{s.ativo ? "Esconder do site" : "Mostrar no site"}</Button>
            </li>
          ))}
        </ul>
      ) : <EmptyState title="Nenhum serviço ainda" description="Cadastre o que a sua empresa faz. Ex.: box de banheiro, espelhos sob medida, manutenção." compact />}
      {editando ? (
        <Card>
          <CardContent className="space-y-3 py-5">
            <h2 className="text-base font-semibold">{editando === "novo" ? "Novo serviço" : "Editar serviço"}</h2>
            <form className="grid gap-3 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); salvar(); }}>
              <label className="block text-sm font-medium sm:col-span-2">Nome<Input value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} required minLength={2} maxLength={80} className="mt-1" /></label>
              <label className="block text-sm font-medium sm:col-span-2">Resumo (opcional)<Input value={f.resumo} onChange={(e) => setF({ ...f, resumo: e.target.value })} maxLength={200} placeholder="Ex.: vidro temperado 8 mm, instalação em até 7 dias" className="mt-1" /></label>
              <MoneyInput label="A partir de (opcional)" hint="Deixe zero para mostrar “sob orçamento”." valueCents={f.preco} onChange={(c) => setF({ ...f, preco: c })} />
              <label className="block text-sm font-medium">Foto (opcional)<Input value={f.imagemUrl} onChange={(e) => setF({ ...f, imagemUrl: e.target.value })} maxLength={500} placeholder="https://… ou endereço da sua biblioteca" className="mt-1" /></label>
              <div className="flex gap-2 sm:col-span-2"><Button type="submit" loading={pending}>Salvar</Button><Button type="button" variant="ghost" onClick={() => setEditando(null)}>Cancelar</Button></div>
            </form>
          </CardContent>
        </Card>
      ) : <Button onClick={() => abrir()}>Cadastrar serviço</Button>}
    </div>
  );
}
