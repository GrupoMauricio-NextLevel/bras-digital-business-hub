"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cancelarContratoAgenciaAction, encerrarContratoAgenciaAction, enviarContratoAction, marcarPagaManualAction, previaContratoAction, reenviarContratoAction, trazerContratoDoMasterAction } from "@/app/actions/agencias";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TextoDoContrato } from "@/components/agencia/texto-contrato";
import type { Secao } from "@/lib/contratos/loja-pronta-express";
import { MEIOS_PAGAMENTO, PLATAFORMAS_ORIGEM, PRODUTOS_PROJETO, type MeioPagamento } from "@/lib/contratos/projeto-constantes";

const campo = "mt-1 min-h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm";
const rotulo = "block text-sm font-medium";
const brl = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
/** "1.600", "1600,00", "R$ 250" → centavos. */
export function reais(v: string): number {
  const t = v.replace(/[R$\s]/gi, "");
  if (!t) return 0;
  const n = /,\d{1,2}$/.test(t) ? Number(t.replace(/\./g, "").replace(",", ".")) : /\.\d{1,2}$/.test(t) && !/\.\d{3}$/.test(t) ? Number(t) : Number(t.replace(/[.,]/g, ""));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : 0;
}
const paraReais = (c: number) => (c / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function TrazerDoMaster({ id, loja }: { id: string; loja: string }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  return <Button size="sm" loading={pending} onClick={() => { if (!confirm(`Trazer o contrato de ${loja} para a agência? O texto e o aceite continuam os mesmos e o cliente recebe um aviso por e-mail com a cópia.`)) return; start(async () => { const r = await trazerContratoDoMasterAction(id); if (r.ok) { toast.success(`Contrato ${r.data.numero} trazido.`); router.push(`/agencia/contratos/${r.data.id}`); } else toast.error(r.error); }); }}>Trazer para a agência</Button>;
}

/** "Recebi por fora": data, meio e observação da baixa de uma parcela. */
export function BaixaDaParcela({ id, hoje }: { id: string; hoje: string }) {
  const router = useRouter();
  const [aberto, setAberto] = React.useState(false);
  const [f, setF] = React.useState({ pagoEm: hoje, meio: "PIX" as MeioPagamento, obs: "" });
  const [pending, start] = React.useTransition();
  if (!aberto) return <Button size="sm" variant="secondary" onClick={() => setAberto(true)}>Recebi por fora</Button>;
  return (
    <form className="mt-2 grid w-full gap-2 rounded-xl bg-surface-muted/60 p-3 sm:grid-cols-3" aria-label="Registrar pagamento" onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await marcarPagaManualAction(id, f.obs.trim() || `Recebido por ${MEIOS_PAGAMENTO[f.meio]}`, { pagoEm: f.pagoEm, meio: f.meio }); if (r.ok) { toast.success("Pagamento registrado."); setAberto(false); router.refresh(); } else toast.error(r.error); }); }}>
      <label className={rotulo}>Pago em<Input type="date" max={hoje} required value={f.pagoEm} onChange={(e) => setF({ ...f, pagoEm: e.target.value })} className="mt-1" /></label>
      <label className={rotulo}>Como<select className={campo} value={f.meio} onChange={(e) => setF({ ...f, meio: e.target.value as MeioPagamento })}>{Object.entries(MEIOS_PAGAMENTO).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
      <label className={rotulo}>Observação (opcional)<Input value={f.obs} maxLength={300} onChange={(e) => setF({ ...f, obs: e.target.value })} className="mt-1" placeholder="Ex.: comprovante no WhatsApp" /></label>
      <div className="flex gap-2 sm:col-span-3"><Button type="submit" size="sm" loading={pending}>Registrar pagamento</Button><Button type="button" size="sm" variant="ghost" onClick={() => setAberto(false)}>Fechar</Button></div>
    </form>
  );
}

export function AcoesDoContrato({ id, status, link, whatsapp, mensagem }: { id: string; status: "ENVIADO" | "ACEITO" | "CANCELADO" | "ENCERRADO"; link: string; whatsapp: string | null; mensagem: string }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [encerrar, setEncerrar] = React.useState(false);
  const [motivo, setMotivo] = React.useState("");
  const wa = whatsapp ? `https://wa.me/${whatsapp.replace(/\D/g, "").replace(/^(?!55)/, "55")}?text=${encodeURIComponent(mensagem)}` : null;
  if (status === "CANCELADO") return null;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" loading={pending} onClick={() => start(async () => { const r = await reenviarContratoAction(id); if (r.ok) toast.success(status === "ENVIADO" ? `Lembrete enviado para ${r.data.para}.` : `Cópia assinada enviada para ${r.data.para}.`); else toast.error(r.error); })}>{status === "ENVIADO" ? "Lembrar por e-mail" : "Reenviar o PDF por e-mail"}</Button>
        {wa ? <a href={wa} target="_blank" rel="noreferrer" className="ds-btn ds-btn--secondary">Mandar no WhatsApp</a> : null}
        <Button variant="ghost" onClick={() => { void navigator.clipboard.writeText(link).then(() => toast.success("Link do portal copiado.")); }}>Copiar link do portal</Button>
        <a href={`/agencia/contratos/${id}/pdf`} target="_blank" rel="noreferrer" className="ds-btn ds-btn--quiet">Baixar PDF</a>
      </div>
      <div className="flex flex-wrap gap-2 border-t border-border pt-3">
        {status === "ENVIADO" ? <Button variant="ghost" loading={pending} onClick={() => { if (!confirm("Cancelar este contrato? O cliente deixa de vê-lo no portal e as parcelas em aberto são canceladas.")) return; start(async () => { const r = await cancelarContratoAgenciaAction(id); if (r.ok) { toast.success("Contrato cancelado."); router.refresh(); } else toast.error(r.error); }); }}>Cancelar o envio</Button> : null}
        {status === "ACEITO" ? (encerrar ? (
          <form className="flex w-full flex-wrap items-end gap-2" onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await encerrarContratoAgenciaAction(id, motivo); if (r.ok) { toast.success("Contrato encerrado."); router.refresh(); } else toast.error(r.error); }); }}>
            <label className={`${rotulo} min-w-0 flex-1`}>Motivo do encerramento<Input required minLength={3} maxLength={300} value={motivo} onChange={(e) => setMotivo(e.target.value)} className="mt-1" placeholder="Ex.: trabalho entregue" /></label>
            <Button type="submit" variant="danger" loading={pending}>Encerrar</Button><Button type="button" variant="ghost" onClick={() => setEncerrar(false)}>Voltar</Button>
          </form>
        ) : <Button variant="ghost" onClick={() => setEncerrar(true)}>Encerrar contrato</Button>) : null}
      </div>
    </div>
  );
}

type ClienteOpcao = { id: string; nome: string; temEmail: boolean; temDocumento: boolean; aceitos: { id: string; numero: string }[] };
type Tema = { key: string; nome: string; precoCents: number };
type Modelo = "LOJA_PRONTA_EXPRESS" | "MIGRACAO_PLATAFORMA" | "MENSAL_MARKETING";
type Parc = { valor: string; vencimento: string; pago: boolean; pagoEm: string; meio: MeioPagamento };

/**
 * Novo contrato (D335): cliente → serviço → condições (valor, como paga, o que já foi pago, o que está incluso e as
 * cortesias) → prévia com o texto exato e as pendências → enviar ao portal.
 */
export function NovoContrato({ clientes, clienteInicial, hoje, temas, temaPadrao }: { clientes: ClienteOpcao[]; clienteInicial: string | null; hoje: string; temas: Tema[]; temaPadrao: string | null }) {
  const router = useRouter();
  const [clienteId, setClienteId] = React.useState(clienteInicial ?? "");
  const [modelo, setModelo] = React.useState<Modelo>("LOJA_PRONTA_EXPRESS");
  const p0 = PRODUTOS_PROJETO.LOJA_PRONTA_EXPRESS;
  const [valor, setValor] = React.useState(paraReais(p0.valorCents));
  const [valorCheio, setValorCheio] = React.useState("");
  const [forma, setForma] = React.useState<"A_VISTA" | "SINAL">("A_VISTA");
  const [sinal, setSinal] = React.useState<Parc>({ valor: paraReais(p0.valorCents / 2), vencimento: hoje, pago: true, pagoEm: hoje, meio: "PIX" });
  const [resto, setResto] = React.useState<Parc>({ valor: "", vencimento: hoje, pago: false, pagoEm: hoje, meio: "PIX" });
  const [avista, setAvista] = React.useState<Parc>({ valor: "", vencimento: hoje, pago: true, pagoEm: hoje, meio: "PIX" });
  const [produtos, setProdutos] = React.useState<number>(p0.produtos);
  const [banners, setBanners] = React.useState<number>(p0.banners);
  const [prazo, setPrazo] = React.useState<number>(p0.prazoDias);
  const [origem, setOrigem] = React.useState("Nuvemshop");
  const [loja, setLoja] = React.useState("");
  const [tema, setTema] = React.useState(temaPadrao ?? "");
  const [outraCortesia, setOutraCortesia] = React.useState("");
  const [extras, setExtras] = React.useState("");
  const [aditivoDe, setAditivoDe] = React.useState("");
  const [mensal, setMensal] = React.useState({ inicio: hoje, vigenciaMeses: 12, avisoPrevioDias: 30, rodadasAjuste: 2, prazoAprovacaoDias: 3 });
  const [previa, setPrevia] = React.useState<{ secoes: Secao[]; pendencias: string[]; titulo: string } | null>(null);
  const [pending, start] = React.useTransition();
  const mudou = <T,>(fn: (v: T) => void) => (v: T) => { fn(v); setPrevia(null); };

  const cliente = clientes.find((c) => c.id === clienteId);
  const totalCents = reais(valor);
  const sinalCents = reais(sinal.valor);
  const restoCents = Math.max(0, totalCents - sinalCents);
  const projeto = modelo !== "MENSAL_MARKETING";

  function trocarModelo(m: Modelo) {
    setModelo(m); setPrevia(null);
    if (m === "MENSAL_MARKETING") return;
    const p = PRODUTOS_PROJETO[m];
    setValor(paraReais(p.valorCents)); setProdutos(p.produtos); setBanners(p.banners); setPrazo(p.prazoDias); setSinal((s) => ({ ...s, valor: paraReais(p.valorCents / 2) }));
  }

  function opcoes() {
    if (!projeto) return { modelo: "MENSAL_MARKETING" as const, ...mensal, extras: extras || null, aditivoDeId: aditivoDe || null };
    const parc = (descricao: string, p: Parc, valorCents: number) => ({ descricao, valorCents, vencimento: p.pago ? p.pagoEm : p.vencimento, pagoEm: p.pago ? p.pagoEm : null, meio: p.pago ? p.meio : null });
    const parcelas = forma === "A_VISTA" ? [parc("À vista", avista, totalCents)] : [parc("Sinal", sinal, sinalCents), parc("Restante", resto, restoCents)];
    const t = temas.find((x) => x.key === tema);
    const cortesias = [...(t ? [{ titulo: `Tema avançado ${t.nome}, com licença permanente`, valorReferenciaCents: t.precoCents }] : []), ...(outraCortesia.trim() ? [{ titulo: outraCortesia.trim(), valorReferenciaCents: null }] : [])];
    return { modelo, origem: modelo === "MIGRACAO_PLATAFORMA" ? origem : null, loja: loja || null, valorCheioCents: reais(valorCheio) || null, valorCents: totalCents, parcelas, produtos, banners, prazoDias: prazo, cortesias, extras: extras || null, aditivoDeId: aditivoDe || null };
  }

  const parcela = (titulo: string, p: Parc, set: (p: Parc) => void, valorFixo?: number) => (
    <fieldset className="rounded-xl border border-border p-3">
      <legend className="px-1 text-sm font-semibold">{titulo}</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {valorFixo === undefined ? <label className={rotulo}>Valor (R$)<Input inputMode="decimal" value={p.valor} onChange={(e) => mudou(set)({ ...p, valor: e.target.value })} className="mt-1" /></label> : <p className="text-sm"><span className="text-muted-foreground">Valor</span><b className="mt-2 block text-base tabular-nums">{brl(valorFixo)}</b></p>}
        <label className="flex min-h-11 items-center gap-2 self-end text-sm font-medium"><input type="checkbox" className="size-5" checked={p.pago} onChange={(e) => mudou(set)({ ...p, pago: e.target.checked })} /> Já foi pago</label>
        {p.pago ? <>
          <label className={rotulo}>Pago em<Input type="date" max={hoje} value={p.pagoEm} onChange={(e) => mudou(set)({ ...p, pagoEm: e.target.value })} className="mt-1" /></label>
          <label className={rotulo}>Como<select className={campo} value={p.meio} onChange={(e) => mudou(set)({ ...p, meio: e.target.value as MeioPagamento })}>{Object.entries(MEIOS_PAGAMENTO).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
        </> : <label className={rotulo}>Vence em<Input type="date" value={p.vencimento} onChange={(e) => mudou(set)({ ...p, vencimento: e.target.value })} className="mt-1" /></label>}
      </div>
    </fieldset>
  );

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <form className="ds-card space-y-5 p-5 sm:p-6" aria-label="Condições do contrato" onSubmit={(e) => e.preventDefault()}>
        <section className="space-y-3" aria-labelledby="p1">
          <h2 id="p1" className="text-base font-semibold">1. Cliente e serviço</h2>
          <label className={rotulo}>Cliente<select required className={campo} value={clienteId} onChange={(e) => { setClienteId(e.target.value); setAditivoDe(""); setPrevia(null); }}><option value="">Escolha o cliente</option>{clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></label>
          {cliente && (!cliente.temEmail || !cliente.temDocumento) ? <p className="rounded-lg bg-warning-soft px-3 py-2 text-xs">Para <b>enviar</b>, a ficha precisa de {[!cliente.temDocumento && "CPF ou CNPJ", !cliente.temEmail && "e-mail"].filter(Boolean).join(" e ")}. A prévia já funciona. <a className="font-semibold underline" href={`/agencia/clientes/${cliente.id}`}>Editar dados do cliente</a></p> : null}
          <div role="radiogroup" aria-label="Serviço" className="grid gap-2 sm:grid-cols-3">
            {([["LOJA_PRONTA_EXPRESS", PRODUTOS_PROJETO.LOJA_PRONTA_EXPRESS.nome, "Projeto com entrega"], ["MIGRACAO_PLATAFORMA", "Migração para a NextLevel", "Da Nuvemshop e outras"], ["MENSAL_MARKETING", "Mensalidade de marketing", "Conteúdo todo mês"]] as const).map(([k, l, d]) => (
              <button key={k} type="button" role="radio" aria-checked={modelo === k} onClick={() => trocarModelo(k)} className={`min-h-11 rounded-xl border p-3 text-left text-sm transition ${modelo === k ? "border-[var(--ds-link)] bg-accent-soft ring-1 ring-[var(--ds-link)]" : "border-border hover:bg-surface-muted"}`}><b className="block">{l}</b><span className="text-xs text-muted-foreground">{d}</span></button>
            ))}
          </div>
          {cliente?.aceitos.length ? <label className={rotulo}>É um aditivo? (opcional)<select className={campo} value={aditivoDe} onChange={(e) => mudou(setAditivoDe)(e.target.value)}><option value="">Não, é um contrato novo</option>{cliente.aceitos.map((a) => <option key={a.id} value={a.id}>Substitui o contrato {a.numero}</option>)}</select></label> : null}
        </section>

        {projeto ? <>
          <section className="space-y-3" aria-labelledby="p2">
            <h2 id="p2" className="text-base font-semibold">2. O que entra</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className={rotulo}>Produtos<Input type="number" min={1} value={produtos} onChange={(e) => mudou(setProdutos)(Number(e.target.value))} className="mt-1" /></label>
              <label className={rotulo}>Banners<Input type="number" min={0} value={banners} onChange={(e) => mudou(setBanners)(Number(e.target.value))} className="mt-1" /></label>
              <label className={rotulo}>Entrega (dias corridos)<Input type="number" min={1} value={prazo} onChange={(e) => mudou(setPrazo)(Number(e.target.value))} className="mt-1" /></label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {modelo === "MIGRACAO_PLATAFORMA" ? <label className={rotulo}>Vem de qual plataforma?<select className={campo} value={origem} onChange={(e) => mudou(setOrigem)(e.target.value)}>{PLATAFORMAS_ORIGEM.map((p) => <option key={p}>{p}</option>)}</select></label> : null}
              <label className={rotulo}>Nome da loja (opcional)<Input value={loja} maxLength={120} onChange={(e) => mudou(setLoja)(e.target.value)} className="mt-1" placeholder={cliente?.nome ?? ""} /></label>
            </div>
            <label className={rotulo}>Cortesia de tema avançado<select className={campo} value={tema} onChange={(e) => mudou(setTema)(e.target.value)}><option value="">Sem tema de cortesia</option>{temas.map((t) => <option key={t.key} value={t.key}>{t.nome} (valor de referência {brl(t.precoCents)})</option>)}</select></label>
            <label className={rotulo}>Outra cortesia (opcional)<Input value={outraCortesia} maxLength={160} onChange={(e) => mudou(setOutraCortesia)(e.target.value)} className="mt-1" placeholder="Ex.: 1 mês de mensalidade da plataforma" /></label>
          </section>
          <section className="space-y-3" aria-labelledby="p3">
            <h2 id="p3" className="text-base font-semibold">3. Valor e pagamento</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className={rotulo}>Valor do serviço (R$)<Input inputMode="decimal" required value={valor} onChange={(e) => mudou(setValor)(e.target.value)} className="mt-1" /></label>
              <label className={rotulo}>Valor cheio, se houver desconto (opcional)<Input inputMode="decimal" value={valorCheio} onChange={(e) => mudou(setValorCheio)(e.target.value)} className="mt-1" placeholder="Ex.: 2.400,00" /></label>
            </div>
            <div role="radiogroup" aria-label="Como paga" className="ds-seg w-fit">
              {([["A_VISTA", "À vista"], ["SINAL", "Sinal + restante"]] as const).map(([k, l]) => <button key={k} type="button" role="radio" aria-checked={forma === k} aria-current={forma === k ? "page" : undefined} onClick={() => mudou(setForma)(k)}>{l}</button>)}
            </div>
            {forma === "A_VISTA" ? parcela("À vista", avista, setAvista, totalCents) : <>
              {parcela("Sinal", sinal, setSinal)}
              {parcela("Restante", resto, setResto, restoCents)}
            </>}
          </section>
        </> : (
          <section className="space-y-3" aria-labelledby="p2m">
            <h2 id="p2m" className="text-base font-semibold">2. Condições da mensalidade</h2>
            <p className="text-xs text-muted-foreground">Valor, vencimento e o que entra no mês vêm da ficha do cliente.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className={rotulo}>Início<Input type="date" value={mensal.inicio} onChange={(e) => mudou(setMensal)({ ...mensal, inicio: e.target.value })} className="mt-1" /></label>
              {([["vigenciaMeses", "Vigência (meses)"], ["avisoPrevioDias", "Aviso prévio (dias)"], ["rodadasAjuste", "Rodadas de ajuste por conteúdo"], ["prazoAprovacaoDias", "Prazo do cliente para aprovar (dias úteis)"]] as const).map(([k, l]) => <label key={k} className={rotulo}>{l}<Input type="number" min={0} value={mensal[k]} onChange={(e) => mudou(setMensal)({ ...mensal, [k]: Number(e.target.value) })} className="mt-1" /></label>)}
            </div>
          </section>
        )}
        <label className={rotulo}>Combinados adicionais (opcional)<textarea rows={3} maxLength={4000} value={extras} onChange={(e) => mudou(setExtras)(e.target.value)} className={`${campo} py-2`} /></label>
        <div className="flex flex-wrap gap-2 border-t border-border pt-4">
          <Button variant="secondary" disabled={!clienteId} loading={pending} onClick={() => start(async () => { const r = await previaContratoAction(clienteId, opcoes()); if (r.ok) setPrevia(r.data); else toast.error(r.error); })}>Ver prévia</Button>
          <Button disabled={!previa || previa.pendencias.length > 0} loading={pending} onClick={() => start(async () => { const r = await enviarContratoAction(clienteId, opcoes()); if (r.ok) { toast.success(`Contrato ${r.data.numero} enviado. O cliente aceita pelo portal.`); router.push(`/agencia/contratos/${r.data.id}`); } else toast.error(r.error); })}>Enviar ao cliente</Button>
        </div>
      </form>
      <section className="ds-card p-5 sm:p-6 lg:sticky lg:top-4 lg:self-start" aria-labelledby="previa">
        <h2 id="previa" className="text-base font-semibold">{previa ? previa.titulo : "Prévia do contrato"}</h2>
        {projeto && totalCents ? <p className="mt-1 text-sm text-muted-foreground">{brl(totalCents)}{forma === "SINAL" ? ` · sinal ${brl(sinalCents)} ${sinal.pago ? "pago" : "a pagar"} · restante ${brl(restoCents)} ${resto.pago ? "pago" : "a pagar"}` : avista.pago ? " · pago à vista" : " · à vista, a pagar"}</p> : null}
        {!previa ? <p className="mt-3 text-sm text-muted-foreground">Preencha ao lado e aperte <b>Ver prévia</b>. O texto que aparece aqui é exatamente o que o cliente vai ler e aceitar.</p>
          : <>
            {previa.pendencias.length ? <div role="alert" className="mt-3 rounded-xl border border-warning/40 bg-warning-soft p-3 text-sm"><b>Falta antes de enviar:</b><ul className="mt-1 list-disc pl-5">{previa.pendencias.map((p) => <li key={p}>{p}</li>)}</ul></div> : <p className="mt-3 rounded-lg bg-success-soft px-3 py-2 text-sm text-success">Tudo certo para enviar.</p>}
            <div className="mt-3 max-h-[70vh] overflow-y-auto rounded-xl border border-border p-4" tabIndex={0} aria-label="Texto do contrato"><TextoDoContrato secoes={previa.secoes} /></div>
          </>}
      </section>
    </div>
  );
}
