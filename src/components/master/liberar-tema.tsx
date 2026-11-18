"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Switch } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { formatBRL } from "@/lib/money";
import { liberarTemaMasterAction, liberarTemaSuporteAction } from "@/app/actions/temas-equipe";
import type { TemaParaLiberar } from "@/lib/themes/liberar-equipe";

const FORMAS = [["PIX", "Pix direto"], ["DINHEIRO", "Dinheiro"], ["TRANSFERENCIA", "Transferência"], ["CARTAO", "Cartão na maquininha"], ["OUTRO", "Outro"]] as const;
const NIVEL = ["", "N1", "N2 · Profissional", "N3 · Avançado", "N4 · Exclusivo"];

/**
 * Liberação de tema pago pela equipe (D329): cortesia (sem custo) ou pagamento recebido por fora (baixa no caixa),
 * com instalação na hora. `via="master"` no Master (com `storeId`); `via="suporte"` na tela de temas, agindo em nome do cliente.
 */
export function LiberarTema({ via, storeId, temas, editorCompleto, inicial }: { via: "master" | "suporte"; storeId?: string; temas: TemaParaLiberar[]; editorCompleto: boolean; inicial?: string }) {
  const router = useRouter();
  const [item, setItem] = React.useState(inicial ?? temas.find((t) => !t.owned)?.key ?? temas[0]?.key ?? "editor-completo");
  const [modo, setModo] = React.useState<"CORTESIA" | "PAGO_FORA">("CORTESIA");
  const [forma, setForma] = React.useState<(typeof FORMAS)[number][0]>("PIX");
  const tema = temas.find((t) => t.key === item);
  const [valor, setValor] = React.useState(tema?.priceCents ?? 0);
  const [nota, setNota] = React.useState("");
  const [instalar, setInstalar] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const editor = item === "editor-completo";
  const jaTem = editor ? editorCompleto : !!tema?.owned;

  const enviar = async () => {
    setBusy(true);
    const input = { item, modo, forma: modo === "PAGO_FORA" ? forma : undefined, valorCents: modo === "PAGO_FORA" ? valor : undefined, nota: nota || undefined, instalar: !editor && instalar };
    const r = via === "master" ? await liberarTemaMasterAction(storeId!, input) : await liberarTemaSuporteAction(input);
    setBusy(false);
    if (!r.ok) return toast.error(r.error);
    toast.success(`${r.data.nome}: ${r.data.jaTinha ? "a loja já tinha a licença" : modo === "CORTESIA" ? "liberado sem custo" : "pagamento registrado no caixa e licença liberada"}${r.data.instalado ? " e instalado" : ""}.`);
    setNota("");
    router.refresh();
  };

  return (
    <div className="space-y-3 text-sm">
      <div>
        <Label htmlFor="lt-item">O que liberar</Label>
        <Select id="lt-item" value={item} onChange={(e) => { setItem(e.target.value); const t = temas.find((x) => x.key === e.target.value); if (t) setValor(t.priceCents); }}>
          {temas.map((t) => <option key={t.key} value={t.key}>{t.name} · {NIVEL[t.level]} · {formatBRL(t.priceCents)}{t.owned ? " · já liberado" : ""}{t.active ? " · ativo" : ""}{t.release === "draft" ? " · exclusivo da equipe" : t.release !== "released" ? " · em revisão" : ""}</option>)}
          <option value="editor-completo">Edição completa do editor (todas as funções, em qualquer tema){editorCompleto ? " · já liberada" : ""}</option>
        </Select>
        {editor ? <p className="mt-1 text-xs text-muted-foreground">Libera adicionar, mover e duplicar seções, todos os ajustes de estilo e os limites de banners do nível mais alto, no tema que estiver ativo. Bom para os sites montados pela equipe.</p> : null}
      </div>
      {!jaTem ? (
        <fieldset>
          <legend className="mb-1 text-xs font-medium">Como fica a cobrança</legend>
          <div className="flex flex-wrap gap-2">
            {([["CORTESIA", "Sem custo (cortesia)"], ["PAGO_FORA", "Cliente pagou por fora"]] as const).map(([k, l]) => (
              <label key={k} className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 ${modo === k ? "border-accent bg-accent/10" : "border-border"}`}>
                <input type="radio" name="lt-modo" value={k} checked={modo === k} onChange={() => setModo(k)} /> {l}
              </label>
            ))}
          </div>
        </fieldset>
      ) : <p className="text-xs text-muted-foreground">A loja já tem esta licença{editor ? "." : ": é só instalar."}</p>}
      {!jaTem && modo === "PAGO_FORA" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div><Label htmlFor="lt-forma">Forma de pagamento</Label><Select id="lt-forma" value={forma} onChange={(e) => setForma(e.target.value as typeof forma)}>{FORMAS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</Select></div>
          <MoneyInput key={item} label="Valor recebido" valueCents={valor} onChange={setValor} hint="Entra no caixa como fatura paga." />
        </div>
      ) : null}
      <div><Label htmlFor="lt-nota">Observação (opcional)</Label><Input id="lt-nota" value={nota} maxLength={300} onChange={(e) => setNota(e.target.value)} placeholder="Ex.: Site Express, combinado no WhatsApp" /></div>
      {!editor ? <div><Switch checked={instalar} onCheckedChange={setInstalar} label={tema?.active ? "Reinstalar agora (o visual atual vai para o histórico)" : "Instalar agora na loja (o visual atual vai para o histórico)"} /></div> : null}
      <div className="pt-1"><Button onClick={enviar} loading={busy} disabled={jaTem && (editor || !instalar)}><Gift className="size-4" aria-hidden /> {jaTem ? "Instalar" : modo === "CORTESIA" ? "Liberar sem custo" : "Registrar pagamento e liberar"}</Button></div>
    </div>
  );
}
