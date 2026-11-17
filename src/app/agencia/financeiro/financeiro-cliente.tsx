"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Copy, Link2, MessageCircle, Plus, ReceiptText, RefreshCw } from "lucide-react";
import { cancelarCobrancaAction, conectarMercadoPagoAction, conferirPagamentosAction, criarCobrancaAvulsaAction, desconectarMercadoPagoAction, gerarCobrancasDoMesAction, gerarLinkDePagamentoAction, marcarPagaManualAction } from "@/app/actions/agencias";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";

const campo = "mt-1 h-10 w-full rounded-md border border-border bg-surface px-3 text-sm";
function useRodar() {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const rodar = <T,>(fn: () => Promise<{ ok: true; data: T } | { ok: false; error: string }>, ok: (d: T) => string) => start(async () => { const r = await fn(); if (r.ok) { toast.success(ok(r.data)); router.refresh(); } else toast.error(r.error); });
  return { pending, rodar };
}

/** Conta Mercado Pago da agência: o dinheiro do cliente cai direto nela (a NextLevel nunca guarda). */
export function ContaMercadoPago({ conectada, conta, teste, pode }: { conectada: boolean; conta: string | null; teste: boolean; pode: boolean }) {
  const { pending, rodar } = useRodar();
  const [token, setToken] = React.useState("");
  if (conectada) return (
    <div className="ds-card flex flex-wrap items-center gap-3 !p-4 text-sm"><span className="size-2 rounded-full bg-success" aria-hidden /><span className="min-w-0 flex-1">Mercado Pago conectado: <b>{conta}</b>{teste ? " (conta de teste)" : ""}. Os pagamentos caem direto na conta da agência.</span>{pode ? <Button size="sm" variant="ghost" loading={pending} onClick={() => { if (confirm("Desconectar o Mercado Pago? Os links já enviados continuam, mas não dá para gerar novos.")) rodar(() => desconectarMercadoPagoAction(), () => "Desconectado."); }}>Desconectar</Button> : null}</div>
  );
  return (
    <div className="ds-card !p-4 text-sm">
      <p className="font-semibold">Conecte a conta Mercado Pago da agência</p>
      <p className="mt-1 text-muted-foreground">Sem ela dá para controlar as cobranças e marcar pagas à mão; com ela, cada cobrança ganha um link de Pix ou cartão e a baixa é automática. No Mercado Pago: Seu negócio → Configurações → Credenciais de produção → Access token.</p>
      {pode ? (
        <form className="mt-3 flex flex-wrap items-end gap-2" onSubmit={(e) => { e.preventDefault(); rodar(() => conectarMercadoPagoAction(token), (d) => `Conectado: ${d.conta}.`); }}>
          <label className="min-w-0 flex-1 basis-72 text-sm font-medium">Access token<Input value={token} onChange={(e) => setToken(e.target.value)} type="password" autoComplete="off" placeholder="APP_USR-…" className="mt-1" /></label>
          <Button type="submit" loading={pending} disabled={token.trim().length < 20}>Conectar</Button>
        </form>
      ) : <p className="mt-2 text-xs text-muted-foreground">Só o administrador conecta a conta.</p>}
    </div>
  );
}

export function GerarCobrancas({ mes }: { mes: string }) {
  const { pending, rodar } = useRodar();
  return <Button loading={pending} onClick={() => rodar(() => gerarCobrancasDoMesAction(mes), (d) => d.criadas ? `${d.criadas} cobrança(s) gerada(s).${d.semContrato ? ` ${d.semContrato} cliente(s) sem valor ou vencimento.` : ""}` : `Nada novo para gerar.${d.semContrato ? ` ${d.semContrato} cliente(s) sem valor ou vencimento no contrato.` : ""}`)}><ReceiptText aria-hidden />Gerar cobranças do mês</Button>;
}

export function ConferirPagamentos() {
  const { pending, rodar } = useRodar();
  return <Button size="sm" variant="secondary" loading={pending} onClick={() => rodar(() => conferirPagamentosAction(), (d) => `${d.conferidas} conferida(s), ${d.pagas} paga(s).`)}><RefreshCw aria-hidden />Conferir pagamentos</Button>;
}

export function NovaAvulsa({ clientes }: { clientes: { id: string; nome: string }[] }) {
  const { pending, rodar } = useRodar();
  const [aberto, setAberto] = React.useState(false);
  const [valor, setValor] = React.useState(0);
  if (!aberto) return <Button variant="secondary" onClick={() => setAberto(true)}><Plus aria-hidden />Cobrança avulsa</Button>;
  return (
    <form aria-label="Cobrança avulsa" className="ds-card grid w-full gap-3 sm:w-[26rem]" onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); rodar(() => criarCobrancaAvulsaAction({ clienteId: String(f.get("cliente")), descricao: String(f.get("descricao")), valorCents: valor, vencimento: String(f.get("vencimento")) }), () => "Cobrança criada."); setAberto(false); }}>
      <label className="text-sm font-medium">Cliente<select name="cliente" required className={campo}>{clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></label>
      <label className="text-sm font-medium">O que é<Input name="descricao" required minLength={3} maxLength={160} placeholder="Ex.: gravação extra" className="mt-1" /></label>
      <MoneyInput label="Valor" valueCents={valor} onChange={setValor} />
      <label className="text-sm font-medium">Vencimento<Input name="vencimento" type="date" required className="mt-1" /></label>
      <div className="flex gap-2"><Button type="submit" loading={pending}>Criar</Button><Button type="button" variant="ghost" onClick={() => setAberto(false)}>Cancelar</Button></div>
    </form>
  );
}

/** Ações de uma cobrança em aberto: link de pagamento, copiar, WhatsApp com mensagem pronta, paga por fora, cancelar. */
export function AcoesDaCobranca({ id, temLink, link, mensagem, whatsapp, conectada, compacto = false }: { id: string; aberta: boolean; temLink: boolean; link: string | null; mensagem: string; whatsapp: string | null; conectada: boolean; compacto?: boolean }) {
  const { pending, rodar } = useRodar();
  const [mais, setMais] = React.useState(false);
  const wa = whatsapp ? `https://wa.me/55${whatsapp.replace(/^55/, "")}?text=${encodeURIComponent(mensagem)}` : null;
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      {!temLink && conectada ? <Button size="sm" loading={pending} onClick={() => rodar(() => gerarLinkDePagamentoAction(id), () => "Link de pagamento pronto.")}><Link2 aria-hidden />Gerar link</Button> : null}
      {link ? <Button size="sm" variant="secondary" onClick={() => { navigator.clipboard?.writeText(link).then(() => toast.success("Link copiado."), () => toast.error("Não deu para copiar.")); }}><Copy aria-hidden />Copiar link</Button> : null}
      {wa ? <a href={wa} target="_blank" rel="noreferrer" className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-border px-3 text-sm font-semibold hover:bg-surface-muted"><MessageCircle className="size-4" aria-hidden />WhatsApp</a> : null}
      {!compacto ? (mais ? (
        <>
          <Button size="sm" variant="ghost" loading={pending} onClick={() => { const obs = prompt("Como foi pago? (ex.: Pix direto na conta)"); if (obs) rodar(() => marcarPagaManualAction(id, obs), () => "Marcada como paga."); }}>Paga por fora</Button>
          <Button size="sm" variant="ghost" loading={pending} onClick={() => { const m = prompt("Motivo do cancelamento"); if (m) rodar(() => cancelarCobrancaAction(id, m), () => "Cobrança cancelada."); }}>Cancelar</Button>
        </>
      ) : <Button size="sm" variant="ghost" onClick={() => setMais(true)}>Mais</Button>) : null}
    </span>
  );
}
