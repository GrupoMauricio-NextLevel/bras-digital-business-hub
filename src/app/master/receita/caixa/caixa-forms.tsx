"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Lock, LockOpen, Pencil, Plus, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { MoneyField } from "@/components/finance/fields";
import { formatBRL } from "@/lib/money";
import { DESTINOS_DO_MEIO, NOME_DO_DESTINO, destinoPadrao, type Destino, MEIOS_MANUAIS, MEIO_FIXO, NOME_DA_ORIGEM, NOME_DO_MEIO, ORIGENS, TIPO_FIXO, type Meio, type Origem, type Tipo } from "@/lib/finance/caixa-regras";
import { abrirCaixaAction, cancelarAssinaturaAction, editarLancamentoAction, estenderVencimentoAction, estornarLancamentoAction, estornarRecebimentoAction, fecharCaixaAction, lancarAction, reabrirCaixaAction, receberAssinaturaAction, trocarPlanoAction } from "@/app/actions/caixa";

type Produto = { key: string; nome: string; precoCents: number | null };
type Opcoes = { lojas: { id: string; nome: string }[]; parceiros: { id: string; nome: string; executivo: boolean }[]; templates: Produto[]; servicos: Produto[] };
const lab = "grid gap-1 text-xs font-medium";

function useAcao() {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, ok: string, depois?: () => void) => start(async () => {
    const r = await fn();
    if (r.ok) { toast.success(ok); depois?.(); router.refresh(); } else toast.error(r.error ?? "Não foi possível salvar.");
  });
  return { pending, run };
}

export function AbrirCaixa({ data, sugestaoCents }: { data: string; sugestaoCents: number }) {
  const [saldo, setSaldo] = React.useState(sugestaoCents);
  const { pending, run } = useAcao();
  return (
    <form className="flex flex-wrap items-end gap-3" onSubmit={(e) => { e.preventDefault(); run(() => abrirCaixaAction({ data, saldoInicialCents: saldo }), "Caixa aberto"); }}>
      <MoneyField label="Dinheiro na gaveta para começar" hint={sugestaoCents ? `Sugerido: o que foi contado no último fechamento (${formatBRL(sugestaoCents)}).` : "Troco que está na gaveta agora."} valueCents={saldo} onChange={setSaldo} className="w-64" />
      <Button type="submit" loading={pending}><LockOpen /> Abrir o caixa</Button>
    </form>
  );
}

type Valores = { tipo: Tipo; origem: Origem; meio: Meio; destino: Destino; produtoKey: string; valorCents: number; storeId: string; partnerId: string; descricao: string };
function CamposDoLancamento({ v, set, opcoes }: { v: Valores; set: (p: Partial<Valores>) => void; opcoes: Opcoes }) {
  const uid = React.useId();
  const tipoFixo = TIPO_FIXO[v.origem];
  const meioFixo = MEIO_FIXO[v.origem];
  const meio = meioFixo ?? v.meio;
  const destinos = DESTINOS_DO_MEIO[meio];
  const produtos = v.origem === "TEMPLATE" ? opcoes.templates : v.origem === "SERVICO" ? opcoes.servicos : null;
  const ehAssinatura = v.origem === "ASSINATURA";
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <label className={lab}>O que é
        <Select value={v.origem} disabled={ehAssinatura} onChange={(e) => { const o = e.target.value as Origem; const m = MEIO_FIXO[o] ?? v.meio; set({ origem: o, tipo: TIPO_FIXO[o] ?? v.tipo, meio: m, destino: DESTINOS_DO_MEIO[m].includes(v.destino) ? v.destino : destinoPadrao(m), produtoKey: "" }); }}>
          {(ehAssinatura ? ORIGENS : ORIGENS.filter((o) => o !== "ASSINATURA")).map((o) => <option key={o} value={o}>{NOME_DA_ORIGEM[o]}</option>)}
        </Select>
      </label>
      {produtos ? (
        <label className={lab}>{v.origem === "TEMPLATE" ? "Qual template" : "Qual serviço"}
          <Select value={v.produtoKey} onChange={(e) => { const p = produtos.find((x) => x.key === e.target.value); set({ produtoKey: e.target.value, valorCents: v.valorCents || p?.precoCents || 0, descricao: v.descricao || (p ? p.nome : "") }); }} required><option value="">Escolha</option>{produtos.map((p) => <option key={p.key} value={p.key}>{p.nome}{p.precoCents ? ` · ${formatBRL(p.precoCents)}` : ""}</option>)}</Select>
        </label>
      ) : null}
      <label className={lab}>Entrada ou saída
        <Select value={tipoFixo ?? v.tipo} disabled={!!tipoFixo} onChange={(e) => set({ tipo: e.target.value as Tipo })}><option value="ENTRADA">Entrada</option><option value="SAIDA">Saída</option></Select>
      </label>
      <label className={lab}>Forma de pagamento
        <Select value={meio} disabled={!!meioFixo} onChange={(e) => { const m = e.target.value as Meio; set({ meio: m, destino: DESTINOS_DO_MEIO[m].includes(v.destino) ? v.destino : destinoPadrao(m) }); }}>{MEIOS_MANUAIS.map((m) => <option key={m} value={m}>{NOME_DO_MEIO[m]}</option>)}</Select>
      </label>
      <label className={lab}>Conta de destino
        <Select value={destinos.includes(v.destino) ? v.destino : destinos[0]} disabled={destinos.length === 1} onChange={(e) => set({ destino: e.target.value as Destino })}>{destinos.map((d) => <option key={d} value={d}>{NOME_DO_DESTINO[d]}</option>)}</Select>
      </label>
      <MoneyField key={`valor-${v.produtoKey}`} label="Valor" id={`valor-${uid}`} valueCents={v.valorCents} onChange={(c) => set({ valorCents: c })} />
      <label className={lab}>{v.origem === "TEMPLATE" ? "Loja que comprou" : "Loja (opcional)"}
        <Select value={v.storeId} onChange={(e) => set({ storeId: e.target.value })}><option value="">Nenhuma</option>{opcoes.lojas.map((l) => <option key={l.id} value={l.id}>{l.nome}</option>)}</Select>
      </label>
      <label className={lab}>{v.origem === "PRESTACAO_EXECUTIVO" ? "Executivo" : "Executivo ou parceiro (opcional)"}
        <Select value={v.partnerId} onChange={(e) => set({ partnerId: e.target.value })}><option value="">Nenhum</option>{opcoes.parceiros.map((p) => <option key={p.id} value={p.id}>{p.nome}{p.executivo ? " (executivo)" : ""}</option>)}</Select>
      </label>
      <label className={`${lab} sm:col-span-2`}>{v.origem === "OUTRO" ? "O que foi pago (obrigatório)" : "Descrição"}<Input value={v.descricao} onChange={(e) => set({ descricao: e.target.value })} placeholder={v.origem === "OUTRO" ? "Ex.: fotos de produto para a loja" : "Ex.: detalhe para lembrar depois"} maxLength={300} /></label>
    </div>
  );
}

export function NovoLancamento({ data, opcoes }: { data: string; opcoes: Opcoes }) {
  const vazio: Valores = { tipo: "ENTRADA", origem: "SERVICO", meio: "DINHEIRO", destino: "DINHEIRO_MAURICIO", produtoKey: "", valorCents: 0, storeId: "", partnerId: "", descricao: "" };
  const [v, setV] = React.useState<Valores>(vazio);
  const [chave, setChave] = React.useState(0);
  const { pending, run } = useAcao();
  return (
    <form key={chave} className="grid gap-3" aria-label="Novo lançamento" onSubmit={(e) => { e.preventDefault(); run(() => lancarAction({ data, tipo: v.tipo, origem: v.origem, meio: v.meio, destino: v.destino, produtoKey: v.produtoKey || null, valorCents: v.valorCents, storeId: v.storeId || null, partnerId: v.partnerId || null, descricao: v.descricao }), "Lançado no caixa", () => { setV(vazio); setChave((k) => k + 1); }); }}>
      <CamposDoLancamento v={v} set={(p) => setV({ ...v, ...p })} opcoes={opcoes} />
      <div><Button type="submit" loading={pending} disabled={!v.valorCents}><Plus /> Lançar</Button></div>
    </form>
  );
}

export function AcoesDoLancamento({ l, opcoes }: { l: { id: string; tipo: Tipo; origem: Origem; meio: Meio; destino: Destino | null; produtoKey: string | null; valorCents: number; storeId: string | null; partnerId: string | null; descricao: string; data: string }; opcoes: Opcoes }) {
  const [modo, setModo] = React.useState<null | "editar" | "estornar">(null);
  const [v, setV] = React.useState<Valores>({ tipo: l.tipo, origem: l.origem, meio: l.meio, destino: l.destino ?? destinoPadrao(l.meio), produtoKey: l.produtoKey ?? "", valorCents: l.valorCents, storeId: l.storeId ?? "", partnerId: l.partnerId ?? "", descricao: l.descricao });
  const [data, setData] = React.useState(l.data);
  const [motivo, setMotivo] = React.useState("");
  const { pending, run } = useAcao();
  if (!modo) return (
    <span className="flex gap-1">
      <Button size="sm" variant="ghost" onClick={() => setModo("editar")} aria-label="Editar lançamento"><Pencil /></Button>
      <Button size="sm" variant="ghost" onClick={() => setModo("estornar")} aria-label="Estornar lançamento"><Undo2 /></Button>
    </span>
  );
  return (
    <div className="grid gap-3 rounded-xl border border-border bg-surface-muted/40 p-3">
      {modo === "editar" ? <>
        <CamposDoLancamento v={v} set={(p) => setV({ ...v, ...p })} opcoes={opcoes} />
        <label className={`${lab} w-44`}>Data<Input type="date" value={data} onChange={(e) => setData(e.target.value)} /></label>
      </> : <p className="text-sm">Estornar tira este lançamento das contas do dia. Ele continua na lista, riscado, com o motivo.</p>}
      <div className="flex flex-wrap items-end gap-2">
        <label className={`${lab} min-w-0 flex-1`}>Motivo (obrigatório)<Input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder={modo === "editar" ? "Ex.: era Pix, não dinheiro" : "Ex.: lançado em dobro"} /></label>
        <Button size="sm" loading={pending} disabled={motivo.trim().length < 3} onClick={() => run(() => modo === "editar"
          ? editarLancamentoAction(l.id, { data, tipo: v.tipo, origem: v.origem, meio: v.meio, destino: v.destino, produtoKey: v.produtoKey || null, valorCents: v.valorCents, storeId: v.storeId || null, partnerId: v.partnerId || null, descricao: v.descricao, motivo })
          : estornarLancamentoAction(l.id, motivo), modo === "editar" ? "Lançamento atualizado" : "Lançamento estornado", () => setModo(null))}>{modo === "editar" ? "Salvar mudança" : "Estornar"}</Button>
        <Button size="sm" variant="ghost" onClick={() => setModo(null)}>Cancelar</Button>
      </div>
    </div>
  );
}

export function FecharCaixa({ data, esperadoCents }: { data: string; esperadoCents: number }) {
  const [contado, setContado] = React.useState(esperadoCents);
  const [motivo, setMotivo] = React.useState("");
  const { pending, run } = useAcao();
  const dif = contado - esperadoCents;
  return (
    <form className="grid gap-3" onSubmit={(e) => { e.preventDefault(); run(() => fecharCaixaAction({ data, contadoCents: contado, motivo: motivo || undefined }), "Caixa fechado"); }}>
      <div className="flex flex-wrap items-end gap-3">
        <MoneyField label="Dinheiro contado na gaveta" valueCents={contado} onChange={setContado} className="w-56" />
        <p className="pb-2 text-sm" aria-live="polite">Esperado <b className="tabular-nums">{formatBRL(esperadoCents)}</b> · {dif === 0 ? <b className="text-success">bate certinho</b> : <b className={dif > 0 ? "text-warning" : "text-danger"}>{dif > 0 ? "sobrou" : "faltou"} {formatBRL(Math.abs(dif))}</b>}</p>
      </div>
      {dif !== 0 ? <label className={`${lab} max-w-lg`}>Motivo da diferença (obrigatório)<Input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ex.: troco dado errado" /></label> : null}
      <div><Button type="submit" loading={pending} disabled={dif !== 0 && motivo.trim().length < 3}><Lock /> Fechar o caixa</Button></div>
    </form>
  );
}

export function ReabrirCaixa({ data }: { data: string }) {
  const [aberto, setAberto] = React.useState(false);
  const [motivo, setMotivo] = React.useState("");
  const { pending, run } = useAcao();
  if (!aberto) return <Button size="sm" variant="secondary" onClick={() => setAberto(true)}><LockOpen /> Reabrir o dia</Button>;
  return (
    <div className="flex flex-wrap items-end gap-2">
      <label className={`${lab} w-72`}>Motivo da reabertura<Input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ex.: conferir um Pix" /></label>
      <Button size="sm" loading={pending} disabled={motivo.trim().length < 3} onClick={() => run(() => reabrirCaixaAction(data, motivo), "Dia reaberto", () => setAberto(false))}>Reabrir</Button>
      <Button size="sm" variant="ghost" onClick={() => setAberto(false)}>Cancelar</Button>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------------------------------
// CX2 (D270): receber assinatura, ações por assinatura e estorno de recebimento
// ---------------------------------------------------------------------------------------------------------------------
type Plano = { key: string; name: string; monthlyCents: number | null; annualCents: number | null };
type LojaOpcao = { id: string; nome: string; productKey: string | null; ciclo: string | null };

export function ReceberAssinatura({ lojas, planos, parceiros, lojaInicial }: { lojas: LojaOpcao[]; planos: Plano[]; parceiros: Opcoes["parceiros"]; lojaInicial?: string }) {
  const inicial = lojas.find((l) => l.id === lojaInicial);
  const vazio = { storeId: inicial?.id ?? "", productKey: inicial?.productKey ?? planos[0]?.key ?? "", cycle: inicial?.ciclo ?? "MONTHLY", meio: "DINHEIRO" as Meio, destino: "DINHEIRO_MAURICIO" as Destino, valorCents: 0, motivoDesconto: "", partnerId: "", observacao: "" };
  const [v, setV] = React.useState(vazio);
  const [chave, setChave] = React.useState(0);
  const { pending, run } = useAcao();
  const plano = planos.find((p) => p.key === v.productKey);
  const tabela = plano ? (v.cycle === "ANNUAL" ? plano.annualCents : plano.monthlyCents) : null;
  const desconto = v.valorCents > 0 && tabela !== null && v.valorCents < tabela;
  const set = (p: Partial<typeof v>) => setV({ ...v, ...p });
  return (
    <form key={chave} className="grid gap-3" aria-label="Receber assinatura" onSubmit={(e) => { e.preventDefault(); run(() => receberAssinaturaAction({ storeId: v.storeId, productKey: v.productKey as "COMMERCE_START", cycle: v.cycle as "MONTHLY", meio: v.meio as "DINHEIRO", destino: v.destino, valorCents: v.valorCents || undefined, motivoDesconto: v.motivoDesconto || undefined, partnerId: v.partnerId || null, observacao: v.observacao || undefined }), "Pagamento recebido: loja liberada e lançada no caixa", () => { setV(vazio); setChave((k) => k + 1); }); }}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className={`${lab} sm:col-span-2`}>Loja
          <Select value={v.storeId} onChange={(e) => { const l = lojas.find((x) => x.id === e.target.value); set({ storeId: e.target.value, productKey: l?.productKey ?? v.productKey, cycle: l?.ciclo ?? v.cycle }); }} required><option value="">Escolha a loja</option>{lojas.map((l) => <option key={l.id} value={l.id}>{l.nome}</option>)}</Select>
        </label>
        <label className={lab}>Plano<Select value={v.productKey} onChange={(e) => set({ productKey: e.target.value })}>{planos.map((p) => <option key={p.key} value={p.key}>{p.name}</option>)}</Select></label>
        <label className={lab}>Ciclo<Select value={v.cycle} onChange={(e) => set({ cycle: e.target.value })}><option value="MONTHLY">Mensal</option><option value="ANNUAL">Anual</option></Select></label>
        <label className={lab}>Forma de pagamento<Select value={v.meio} onChange={(e) => { const m = e.target.value as Meio; set({ meio: m, destino: DESTINOS_DO_MEIO[m].includes(v.destino) ? v.destino : destinoPadrao(m) }); }}>{MEIOS_MANUAIS.map((m) => <option key={m} value={m}>{NOME_DO_MEIO[m]}</option>)}</Select></label>
        <label className={lab}>Conta de destino<Select value={v.destino} disabled={DESTINOS_DO_MEIO[v.meio].length === 1} onChange={(e) => set({ destino: e.target.value as Destino })}>{DESTINOS_DO_MEIO[v.meio].map((d) => <option key={d} value={d}>{NOME_DO_DESTINO[d]}</option>)}</Select></label>
        <MoneyField label="Valor recebido" id="valor-receber" hint={tabela !== null ? `Vazio = tabela (${formatBRL(tabela)}${v.cycle === "ANNUAL" ? ", sem a Black" : ""}).` : undefined} valueCents={v.valorCents} onChange={(c) => set({ valorCents: c })} />
        <label className={lab}>Quem vendeu (opcional)<Select value={v.partnerId} onChange={(e) => set({ partnerId: e.target.value })}><option value="">Ninguém (venda direta)</option>{parceiros.map((p) => <option key={p.id} value={p.id}>{p.nome}{p.executivo ? " (executivo)" : ""}</option>)}</Select></label>
        <label className={lab}>Observação<Input value={v.observacao} onChange={(e) => set({ observacao: e.target.value })} placeholder="Ex.: pago no balcão" maxLength={300} /></label>
        {desconto ? <label className={`${lab} sm:col-span-2`}>Motivo do desconto de {formatBRL(tabela! - v.valorCents)} (obrigatório)<Input value={v.motivoDesconto} onChange={(e) => set({ motivoDesconto: e.target.value })} placeholder="Ex.: cliente antigo do Brás" /></label> : null}
      </div>
      <p className="text-xs text-muted-foreground">Ao receber: a assinatura é renovada, a loja é liberada, a comissão de quem vendeu nasce pela regra do programa e o valor entra no caixa de hoje.{v.meio === "DINHEIRO" ? " Dinheiro aqui é o que entrou na gaveta. Dinheiro com o vendedor entra pela prestação de contas (próxima fase)." : ""}</p>
      <div><Button type="submit" loading={pending} disabled={!v.storeId || (desconto && v.motivoDesconto.trim().length < 3)}><Plus /> Receber e liberar</Button></div>
    </form>
  );
}

export function AcoesDaAssinatura({ storeId, planos, productKey, ciclo }: { storeId: string; planos: Plano[]; productKey: string | null; ciclo: string | null }) {
  const [modo, setModo] = React.useState<null | "estender" | "plano" | "cancelar">(null);
  const [dias, setDias] = React.useState("7");
  const [p, setP] = React.useState({ productKey: productKey ?? planos[0]?.key ?? "", cycle: ciclo ?? "MONTHLY" });
  const [motivo, setMotivo] = React.useState("");
  const { pending, run } = useAcao();
  if (!modo) return (
    <span className="flex flex-wrap gap-1">
      <Button size="sm" variant="secondary" onClick={() => setModo("estender")}>Estender</Button>
      <Button size="sm" variant="secondary" onClick={() => setModo("plano")}>Trocar plano</Button>
      <Button size="sm" variant="ghost" onClick={() => setModo("cancelar")}>Cancelar</Button>
    </span>
  );
  const fechar = () => { setModo(null); setMotivo(""); };
  return (
    <div className="grid w-full gap-2 rounded-xl border border-border bg-surface-muted/40 p-3">
      <div className="flex flex-wrap items-end gap-2">
        {modo === "estender" ? <label className={`${lab} w-28`}>Dias a mais<Input inputMode="numeric" value={dias} onChange={(e) => setDias(e.target.value)} /></label> : null}
        {modo === "plano" ? <>
          <label className={lab}>Plano<Select value={p.productKey} onChange={(e) => setP({ ...p, productKey: e.target.value })}>{planos.map((x) => <option key={x.key} value={x.key}>{x.name}</option>)}</Select></label>
          <label className={lab}>Ciclo<Select value={p.cycle} onChange={(e) => setP({ ...p, cycle: e.target.value })}><option value="MONTHLY">Mensal</option><option value="ANNUAL">Anual</option></Select></label>
        </> : null}
        {modo === "cancelar" ? <p className="text-sm">O acesso segue até o fim do período pago; nada é cobrado depois.</p> : null}
        <label className={`${lab} min-w-48 flex-1`}>Motivo (obrigatório)<Input value={motivo} onChange={(e) => setMotivo(e.target.value)} /></label>
        <Button size="sm" loading={pending} disabled={motivo.trim().length < 3} onClick={() => run(() => modo === "estender" ? estenderVencimentoAction(storeId, Number(dias) || 0, motivo) : modo === "plano" ? trocarPlanoAction(storeId, p as { productKey: "COMMERCE_START"; cycle: "MONTHLY" }, motivo) : cancelarAssinaturaAction(storeId, motivo), modo === "estender" ? "Vencimento estendido" : modo === "plano" ? "Plano trocado (vale na próxima cobrança)" : "Assinatura cancelada no fim do período", fechar)}>Confirmar</Button>
        <Button size="sm" variant="ghost" onClick={fechar}>Voltar</Button>
      </div>
    </div>
  );
}

export function EstornarRecebimento({ lancamentoId }: { lancamentoId: string }) {
  const [aberto, setAberto] = React.useState(false);
  const [motivo, setMotivo] = React.useState("");
  const { pending, run } = useAcao();
  if (!aberto) return <Button size="sm" variant="ghost" onClick={() => setAberto(true)}><Undo2 /> Estornar</Button>;
  return (
    <div className="flex flex-wrap items-end gap-2">
      <label className={`${lab} w-64`}>Motivo do estorno<Input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ex.: cobrado na loja errada" /></label>
      <Button size="sm" loading={pending} disabled={motivo.trim().length < 3} onClick={() => run(() => estornarRecebimentoAction(lancamentoId, motivo), "Recebimento estornado: comissão e período desfeitos", () => setAberto(false))}>Estornar</Button>
      <Button size="sm" variant="ghost" onClick={() => setAberto(false)}>Voltar</Button>
    </div>
  );
}
