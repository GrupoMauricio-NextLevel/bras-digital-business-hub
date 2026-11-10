"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Banknote, CheckCircle2, Copy, SearchX, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { avisarPixAction, confirmarRecebimentoAction, lancarParcelaNoCaixaAction, pixNaoEncontradoAction } from "@/app/actions/contratos";

export type ParcelaTela = { id: string; descricao: string; valorCents: number; vencimento: string; status: "ABERTA" | "AVISADA" | "PAGA"; avisadoEm: string | null; avisoNota: string | null; confirmadoEm: string | null; naoEncontradoEm: string | null; caixaLancamentoId: string | null };

const brl = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const data = (iso: string) => iso.slice(0, 10).split("-").reverse().join("/");
const quando = (iso: string) => new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }).format(new Date(iso));

function Situacao({ p, lado }: { p: ParcelaTela; lado: "cliente" | "master" }) {
  if (p.status === "PAGA") return <Badge tone="success">Recebido</Badge>;
  if (p.status === "AVISADA") return <Badge tone="warning">{lado === "cliente" ? "Pix avisado · em conferência" : "Cliente avisou o Pix"}</Badge>;
  return <Badge tone="neutral">{p.naoEncontradoEm ? "Pix não encontrado" : "A pagar"}</Badge>;
}

/** Parcelas do contrato (CT3, D277). Cliente: "Já fiz o Pix". Master: "Confirmar recebimento" ou "Não encontrei". */
export function Parcelas({ parcelas, lado, chavePix, banco, favorecido, emailComprovante }: { parcelas: ParcelaTela[]; lado: "cliente" | "master"; chavePix: string; banco: string; favorecido: string; emailComprovante: string }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [aberta, setAberta] = React.useState<string | null>(null);
  const [nota, setNota] = React.useState("");
  const rodar = (fn: () => Promise<{ ok: boolean; error?: string }>, ok: string) => start(async () => { const r = await fn(); if (r.ok) { toast.success(ok); setAberta(null); setNota(""); router.refresh(); } else toast.error(r.error ?? "Não deu certo. Tente de novo."); });
  const copiar = async () => { try { await navigator.clipboard.writeText(chavePix.replace(/\D/g, "")); toast.success("Chave Pix copiada."); } catch { toast.error("Não deu para copiar. Selecione a chave e copie."); } };
  const pago = parcelas.filter((p) => p.status === "PAGA").reduce((s, p) => s + p.valorCents, 0), total = parcelas.reduce((s, p) => s + p.valorCents, 0);
  return (
    <section className="ds-card grid gap-4 p-5" aria-labelledby="pagamentos-t">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="pagamentos-t" className="flex items-center gap-2 text-base font-semibold"><Wallet className="size-4" aria-hidden /> Pagamentos</h2>
        <p className="text-sm tabular-nums text-muted-foreground">Recebido {brl(pago)} de {brl(total)}</p>
      </div>
      {lado === "cliente" && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#294cdc]/40 bg-[#eef3ff] px-4 py-3 text-sm text-[#101a33]">
          <span>Pix na chave <strong className="tabular-nums">{chavePix}</strong> (CNPJ) · {banco} · favorecido {favorecido}</span>
          <Button type="button" size="sm" variant="secondary" onClick={copiar}><Copy /> Copiar chave</Button>
        </div>
      )}
      <ul className="divide-y">
        {parcelas.map((p) => (
          <li key={p.id} className="grid gap-2 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium">{p.descricao} · <span className="tabular-nums">{brl(p.valorCents)}</span></p>
                <p className="text-xs text-muted-foreground">
                  {p.descricao === "Sinal" ? `Em ${data(p.vencimento)}` : `Até ${data(p.vencimento)}`}
                  {p.avisadoEm && p.status !== "ABERTA" ? ` · Pix avisado em ${quando(p.avisadoEm)}` : ""}
                  {p.confirmadoEm ? ` · confirmado em ${quando(p.confirmadoEm)}` : ""}
                  {lado === "master" && p.status === "PAGA" ? (p.caixaLancamentoId ? " · lançado no caixa" : " · ainda não está no caixa") : ""}
                </p>
                {p.avisoNota && p.status === "AVISADA" && <p className="mt-1 text-xs">Recado: “{p.avisoNota}”</p>}
                {lado === "cliente" && p.status === "ABERTA" && p.naoEncontradoEm && <p className="mt-1 text-xs text-[#9a3412]">Não encontramos este Pix no extrato. Confira a chave e mande o comprovante para {emailComprovante}.</p>}
              </div>
              <span className="flex flex-wrap items-center gap-2">
                <Situacao p={p} lado={lado} />
                {lado === "cliente" && p.status === "ABERTA" && aberta !== p.id && <Button type="button" size="sm" onClick={() => setAberta(p.id)}><Banknote /> Já fiz o Pix</Button>}
                {lado === "master" && p.status !== "PAGA" && <Button type="button" size="sm" loading={pending} onClick={() => { if (confirm(`Você conferiu o Pix de ${brl(p.valorCents)} no extrato do ${banco}?`)) rodar(() => confirmarRecebimentoAction(p.id), "Recebimento confirmado. O cliente foi avisado por e-mail."); }}><CheckCircle2 /> Confirmar recebimento</Button>}
                {lado === "master" && p.status === "AVISADA" && <Button type="button" size="sm" variant="secondary" disabled={pending} onClick={() => { if (confirm("Avisar o cliente de que o Pix não foi encontrado no extrato?")) rodar(() => pixNaoEncontradoAction(p.id), "Cliente avisado: o Pix não foi encontrado."); }}><SearchX /> Não encontrei</Button>}
                {lado === "master" && p.status === "PAGA" && !p.caixaLancamentoId && <Button type="button" size="sm" variant="secondary" loading={pending} onClick={() => rodar(() => lancarParcelaNoCaixaAction(p.id), "Lançado no caixa de hoje.")}>Lançar no caixa</Button>}
              </span>
            </div>
            {lado === "cliente" && aberta === p.id && (
              <form className="grid gap-2 rounded-lg border p-3" onSubmit={(e) => { e.preventDefault(); rodar(() => avisarPixAction(p.id, nota), "Aviso enviado. A NextLevel confere no banco e confirma aqui."); }}>
                <label className="grid gap-1 text-xs font-medium">Recado (opcional): horário, banco de onde saiu, nome de quem pagou
                  <Input value={nota} onChange={(e) => setNota(e.target.value)} maxLength={300} placeholder="Ex.: paguei às 15h pelo Nubank, em nome de Maria" />
                </label>
                <p className="text-xs text-muted-foreground">Este aviso não confirma o pagamento: a NextLevel confere no extrato e confirma aqui. Se puder, mande o comprovante para {emailComprovante}.</p>
                <span className="flex flex-wrap gap-2"><Button type="submit" size="sm" loading={pending}><Banknote /> Avisar que paguei {brl(p.valorCents)}</Button><Button type="button" size="sm" variant="ghost" onClick={() => setAberta(null)}>Voltar</Button></span>
              </form>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
