"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { CalendarClock, Check, MessageCircle, Phone, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/dialog";
import { Input, Select, Textarea } from "@/components/ui/input";
import { FormField } from "@/components/app/form-field";
import { formatBRL } from "@/lib/money";
import type { PartnerStage } from "@/db/schema";
import type { CartaoParceiro } from "@/lib/domain/crm-parceiros";
import { concluirTarefaAction, fichaAction, moverEtapaAction, registrarAtividadeAction, salvarPerfilParceiroAction } from "@/app/actions/crm-parceiros";

type Etapa = { key: PartnerStage; nome: string; dica: string };
type Ficha = Extract<Awaited<ReturnType<typeof fichaAction>>, { ok: true }>["data"];
const TIPO: Record<string, string> = { AFFILIATE: "Criador", REPRESENTATIVE: "Representante", AGENCY: "Agência", AGENCY_ELITE: "Agência Elite", WHITE_LABEL: "White label" };
const NIVEL: Record<string, string> = { INICIAL: "Inicial", PRATA: "Prata", OURO: "Ouro", DIAMANTE: "Diamante" };
const MOVIVEIS: PartnerStage[] = ["CANDIDATO", "EM_ANALISE", "APROVADO", "ATIVANDO", "PRODUTIVO", "EM_RISCO"];
const data = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) : "—");
const whats = (tel: string) => `https://wa.me/55${tel.replace(/\D/g, "").replace(/^55/, "")}`;
const tomSaude = (n: number) => (n >= 70 ? "text-success" : n >= 40 ? "text-warning" : "text-danger");

/** Quadro do funil de parceiros (D251): arrastar entre colunas (ou "Mover para" no teclado) e ficha 360 em gaveta. */
export function QuadroFunil({ etapas, cartoes, equipe }: { etapas: Etapa[]; cartoes: CartaoParceiro[]; equipe: { id: string; name: string }[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const pathname = usePathname();
  const [arrastando, setArrastando] = React.useState<string | null>(null);
  const [sobre, setSobre] = React.useState<PartnerStage | null>(null);
  const aberto = params.get("p");
  const abrir = (id: string | null) => {
    const q = new URLSearchParams(params.toString());
    if (id) q.set("p", id); else q.delete("p");
    router.replace(`${pathname}?${q.toString()}`, { scroll: false });
  };
  const mover = async (id: string, etapa: PartnerStage) => {
    const c = cartoes.find((x) => x.id === id);
    if (!c || c.etapa === etapa) return;
    if (!MOVIVEIS.includes(etapa)) { toast.error("Inativo e desligado mudam pela situação do parceiro, na ficha."); return; }
    const r = await moverEtapaAction(id, etapa);
    if (r.ok) { toast.success(`${c.nome} → ${etapas.find((e) => e.key === etapa)!.nome}`); router.refresh(); } else toast.error(r.error);
  };

  return (
    <>
      <div className="relative -mx-1 overflow-x-auto pb-3" style={{ contain: "inline-size" }} role="region" aria-label="Funil de parceiros" tabIndex={0}>
        <ol className="flex min-w-max gap-3 px-1">
          {etapas.map((e) => {
            const col = cartoes.filter((c) => c.etapa === e.key);
            return (
              <li key={e.key} aria-labelledby={`col-${e.key}`}
                onDragOver={(ev) => { if (arrastando) { ev.preventDefault(); setSobre(e.key); } }} onDragLeave={() => setSobre(null)}
                onDrop={(ev) => { ev.preventDefault(); setSobre(null); if (arrastando) void mover(arrastando, e.key); setArrastando(null); }}
                className={`flex w-72 shrink-0 flex-col rounded-2xl border bg-surface-muted/50 p-2 transition-colors ${sobre === e.key ? "border-[var(--brand-signal,var(--ds-primary))] bg-surface" : "border-border"}`}>
                <div className="flex items-baseline justify-between px-2 pb-2 pt-1">
                  <h3 id={`col-${e.key}`} className="text-sm font-semibold">{e.nome} <span className="ml-1 tabular-nums text-muted-foreground">{col.length}</span></h3>
                  <span className="text-[11px] text-muted-foreground">{e.dica}</span>
                </div>
                <ul className="grid content-start gap-2">
                  {col.map((c) => (
                    <li key={c.id} draggable={MOVIVEIS.includes(c.etapa)} onDragStart={() => setArrastando(c.id)} onDragEnd={() => { setArrastando(null); setSobre(null); }}
                      className={`rounded-xl border border-border bg-surface p-3 text-sm shadow-[0_1px_0_rgba(0,0,0,.03)] ${arrastando === c.id ? "opacity-50" : ""}`}>
                      <div className="flex items-start justify-between gap-2">
                        <button type="button" onClick={() => abrir(c.id)} className="text-left font-semibold leading-tight hover:underline">{c.nome}</button>
                        <span className={`text-xs font-semibold tabular-nums ${tomSaude(c.saude)}`} title="Saúde de 0 a 100">{c.saude}</span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">{TIPO[c.kind] ?? c.kind} · {NIVEL[c.tier] ?? c.tier}{c.regiao ? ` · ${c.regiao}` : ""}{c.manual ? " · etapa manual" : ""}</p>
                      <dl className="mt-2 grid grid-cols-3 gap-1 text-xs">
                        <div><dt className="text-muted-foreground">Ativos</dt><dd className="font-semibold tabular-nums">{c.ativos}</dd></div>
                        <div><dt className="text-muted-foreground">Receita mês</dt><dd className="font-semibold tabular-nums">{formatBRL(c.receitaMesCents)}</dd></div>
                        <div><dt className="text-muted-foreground">A pagar</dt><dd className="font-semibold tabular-nums">{formatBRL(c.aPagarCents)}</dd></div>
                      </dl>
                      {c.proximaAcao ? <p className={`mt-2 flex items-center gap-1 text-xs ${c.proximaAcaoEm && new Date(c.proximaAcaoEm) <= new Date() ? "font-semibold text-danger" : "text-muted-foreground"}`}><CalendarClock className="size-3.5" aria-hidden />{data(c.proximaAcaoEm)} · {c.proximaAcao}</p> : null}
                      <p className="mt-1 text-[11px] text-muted-foreground">Última atividade {data(c.ultimaAtividadeEm)}{c.donoNome ? ` · cuida: ${c.donoNome}` : ""}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <a href={whats(c.telefone)} target="_blank" rel="noreferrer" className="ds-btn ds-btn--sm ds-btn--secondary" aria-label={`WhatsApp de ${c.nome}`}><MessageCircle className="size-3.5" aria-hidden />WhatsApp</a>
                        <label className="sr-only" htmlFor={`mv-${c.id}`}>Mover {c.nome} para</label>
                        {MOVIVEIS.includes(c.etapa) ? (
                          <Select id={`mv-${c.id}`} className="h-8 flex-1 text-xs" value="" onChange={(ev) => { if (ev.target.value) void mover(c.id, ev.target.value as PartnerStage); }}>
                            <option value="">Mover para…</option>
                            {MOVIVEIS.filter((k) => k !== c.etapa).map((k) => <option key={k} value={k}>{etapas.find((x) => x.key === k)!.nome}</option>)}
                          </Select>
                        ) : null}
                      </div>
                    </li>
                  ))}
                  {!col.length ? <li className="rounded-xl border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">Ninguém aqui</li> : null}
                </ul>
              </li>
            );
          })}
        </ol>
      </div>
      <FichaGaveta id={aberto} onClose={() => abrir(null)} equipe={equipe} etapas={etapas} />
    </>
  );
}

function FichaGaveta({ id, onClose, equipe, etapas }: { id: string | null; onClose: () => void; equipe: { id: string; name: string }[]; etapas: Etapa[] }) {
  const router = useRouter();
  const [carregada, setFicha] = React.useState<Ficha | null>(null);
  const [versao, setVersao] = React.useState(0);
  const fechar = React.useRef(onClose);
  React.useEffect(() => { fechar.current = onClose; });
  React.useEffect(() => {
    let vivo = true;
    if (!id) return;
    void fichaAction(id).then((r) => { if (!vivo) return; if (r.ok) setFicha(r.data); else { toast.error(r.error); fechar.current(); } });
    return () => { vivo = false; };
  }, [id, versao]);
  const ficha = carregada && carregada.parceiro.id === id ? carregada : null;
  const depois = (r: { ok: boolean; error?: string }, msg: string) => { if (r.ok) { toast.success(msg); setVersao((v) => v + 1); router.refresh(); return true; } toast.error(r.error ?? "Não foi possível."); return false; };

  return (
    <Drawer open={!!id} onOpenChange={(o) => { if (!o) onClose(); }} title={ficha?.parceiro.nome ?? "Parceiro"} description={ficha ? `${TIPO[ficha.parceiro.kind] ?? ficha.parceiro.kind} · ${NIVEL[ficha.parceiro.tier]} · código ${ficha.parceiro.codigo}` : "Carregando…"} className="max-w-xl">
      {!ficha ? <p className="p-5 text-sm text-muted-foreground">Carregando a ficha…</p> : (
        <div className="grid gap-6 overflow-y-auto p-5">
          <div className="flex flex-wrap gap-2">
            <a href={whats(ficha.parceiro.telefone)} target="_blank" rel="noreferrer" className="ds-btn ds-btn--sm ds-btn--secondary"><MessageCircle className="size-3.5" aria-hidden />WhatsApp</a>
            <a href={`mailto:${ficha.parceiro.email}`} className="ds-btn ds-btn--sm ds-btn--secondary">E-mail</a>
            <Link href={`/master/partners/${ficha.parceiro.id}`} className="ds-btn ds-btn--sm ds-btn--ghost">Ficha financeira completa</Link>
          </div>
          <Perfil ficha={ficha} equipe={equipe} etapas={etapas} onSaved={depois} />
          <NovaAtividade id={ficha.parceiro.id} onSaved={depois} />
          <section aria-labelledby="ft-t">
            <h3 id="ft-t" className="text-sm font-semibold">Tarefas</h3>
            {ficha.tarefas.length ? <ul className="mt-2 grid gap-1.5 text-sm">{ficha.tarefas.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2">
                <span className={t.feita ? "text-muted-foreground line-through" : ""}>{data(t.em)} · {t.texto}</span>
                {!t.feita ? <Button size="sm" variant="ghost" onClick={async () => depois(await concluirTarefaAction(t.id), "Tarefa feita")}><Check /> Feita</Button> : null}
              </li>))}</ul> : <p className="mt-1 text-sm text-muted-foreground">Nenhuma tarefa.</p>}
          </section>
          <section aria-labelledby="fi-t">
            <h3 id="fi-t" className="text-sm font-semibold">Indicados ({ficha.indicados.length})</h3>
            {ficha.indicados.length ? <ul className="mt-2 grid gap-1 text-sm">{ficha.indicados.map((l) => <li key={l.id} className="flex justify-between gap-2"><span>{l.nome}</span><span className="text-muted-foreground">{l.situacao}</span></li>)}</ul> : <p className="mt-1 text-sm text-muted-foreground">Nenhuma loja indicada ainda.</p>}
          </section>
          <section aria-labelledby="fd-t">
            <h3 id="fd-t" className="text-sm font-semibold">Comissões por mês</h3>
            {ficha.porMes.length ? <ul className="mt-2 grid grid-cols-3 gap-2 text-sm">{ficha.porMes.map((m) => <li key={m.periodo} className="rounded-lg bg-surface-muted px-3 py-2"><span className="block text-xs text-muted-foreground">{m.periodo}</span><b className="tabular-nums">{formatBRL(m.cents)}</b></li>)}</ul> : <p className="mt-1 text-sm text-muted-foreground">Sem comissões ainda.</p>}
          </section>
          <section aria-labelledby="fl-t">
            <h3 id="fl-t" className="text-sm font-semibold">Linha do tempo</h3>
            <ol className="mt-2 grid gap-2 border-l border-border pl-4 text-sm">{ficha.linha.map((e, i) => <li key={i}><span className="text-xs text-muted-foreground">{data(e.em)} · {e.tipo}</span><p>{e.texto}</p></li>)}</ol>
          </section>
        </div>
      )}
    </Drawer>
  );
}

function Perfil({ ficha, equipe, etapas, onSaved }: { ficha: Ficha; equipe: { id: string; name: string }[]; etapas: Etapa[]; onSaved: (r: { ok: boolean; error?: string }, m: string) => boolean }) {
  const [v, setV] = React.useState({ ...ficha.perfil, nextActionAt: ficha.perfil.nextActionAt?.slice(0, 10) ?? "" });
  const [busy, setBusy] = React.useState(false);
  const salvar = async () => {
    setBusy(true);
    await onSaved(await salvarPerfilParceiroAction(ficha.parceiro.id, { region: v.region, channels: v.channels, ownerUserId: v.ownerUserId || null, nextAction: v.nextAction, nextActionAt: v.nextActionAt ? new Date(`${v.nextActionAt}T12:00:00`).toISOString() : null }), "Ficha salva");
    setBusy(false);
  };
  return (
    <section aria-labelledby="fp-t" className="grid gap-3 rounded-xl border border-border p-4">
      <h3 id="fp-t" className="text-sm font-semibold">Acompanhamento</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField label="Etapa no funil" htmlFor="fp-etapa">
          <Select id="fp-etapa" value={ficha.perfil.manualStage ?? ""} onChange={async (e) => onSaved(await moverEtapaAction(ficha.parceiro.id, (e.target.value || null) as PartnerStage | null), "Etapa atualizada")}>
            <option value="">Automática (pelo desempenho)</option>
            {MOVIVEIS.map((k) => <option key={k} value={k}>{etapas.find((x) => x.key === k)!.nome}</option>)}
          </Select>
        </FormField>
        <FormField label="Quem cuida" htmlFor="fp-dono"><Select id="fp-dono" value={v.ownerUserId} onChange={(e) => setV({ ...v, ownerUserId: e.target.value })}><option value="">Ninguém</option>{equipe.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</Select></FormField>
        <FormField label="Região" htmlFor="fp-reg"><Input id="fp-reg" value={v.region} onChange={(e) => setV({ ...v, region: e.target.value })} placeholder="Ex.: São Paulo - Brás" /></FormField>
        <FormField label="Canais" htmlFor="fp-can"><Input id="fp-can" value={v.channels} onChange={(e) => setV({ ...v, channels: e.target.value })} placeholder="Instagram, TikTok, loja física" /></FormField>
        <FormField label="Próxima ação" htmlFor="fp-acao"><Input id="fp-acao" value={v.nextAction} onChange={(e) => setV({ ...v, nextAction: e.target.value })} placeholder="Ex.: ligar e ensinar o link" /></FormField>
        <FormField label="Quando" htmlFor="fp-quando"><Input id="fp-quando" type="date" value={v.nextActionAt} onChange={(e) => setV({ ...v, nextActionAt: e.target.value })} /></FormField>
      </div>
      <div><Button size="sm" loading={busy} onClick={salvar}>Salvar</Button></div>
    </section>
  );
}

function NovaAtividade({ id, onSaved }: { id: string; onSaved: (r: { ok: boolean; error?: string }, m: string) => boolean }) {
  const [kind, setKind] = React.useState<"NOTA" | "LIGACAO" | "TAREFA">("NOTA");
  const [text, setText] = React.useState("");
  const [due, setDue] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const ir = async () => {
    setBusy(true);
    const ok = await onSaved(await registrarAtividadeAction(id, { kind, text, dueAt: kind === "TAREFA" && due ? new Date(`${due}T12:00:00`).toISOString() : null }), kind === "TAREFA" ? "Tarefa criada" : "Registrado");
    setBusy(false);
    if (ok) { setText(""); setDue(""); }
  };
  const OPC = [["NOTA", "Nota", StickyNote], ["LIGACAO", "Ligação", Phone], ["TAREFA", "Tarefa", CalendarClock]] as const;
  return (
    <section aria-labelledby="fa-t" className="grid gap-2">
      <h3 id="fa-t" className="text-sm font-semibold">Registrar (o parceiro não vê)</h3>
      <div className="flex gap-1" role="radiogroup" aria-label="Tipo de registro">
        {OPC.map(([k, l, I]) => <button key={k} type="button" role="radio" aria-checked={kind === k} onClick={() => setKind(k)} className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs ${kind === k ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground"}`}><I className="size-3.5" aria-hidden />{l}</button>)}
      </div>
      <label htmlFor="fa-texto" className="sr-only">Texto</label>
      <Textarea id="fa-texto" rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder={kind === "TAREFA" ? "Ex.: mandar o kit de conteúdo" : "O que foi conversado"} />
      <div className="flex flex-wrap items-center gap-2">
        {kind === "TAREFA" ? <><label htmlFor="fa-data" className="text-xs text-muted-foreground">Para</label><Input id="fa-data" type="date" className="w-40" value={due} onChange={(e) => setDue(e.target.value)} /></> : null}
        <Button size="sm" variant="secondary" loading={busy} disabled={text.trim().length < 2} onClick={ir}>Registrar</Button>
      </div>
    </section>
  );
}
