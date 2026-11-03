"use client";
import * as React from "react";
import { toast } from "sonner";
import { BadgeCheck, Check, Headset, Lock, ShieldCheck, Sparkles, Wallet } from "lucide-react";
import { signupAction } from "@/app/actions/signup";
import { ContagemRegressiva } from "@/components/black/contagem-regressiva";
import { formatBRL } from "@/lib/money";
import "@/components/black/black.css";
import "./checkout.css";

export type PlanoCheckout = { key: "COMMERCE_START" | "COMMERCE_PRO" | "COMMERCE_SCALE"; name: string; monthlyCents: number; /** anual que será cobrado (na Black, já com 2 meses grátis) */ annualCents: number; features: string[] };
type Props = {
  plans: PlanoCheckout[];
  trialDays: number;
  black: { fim: string; restanteMs: number } | null;
  initialPlan?: PlanoCheckout["key"];
  initialCycle: "MONTHLY" | "ANNUAL";
  initialRef?: string;
};

const reais = (c: number) => formatBRL(c).replace(",00", "");
const PARA: Record<string, string> = { COMMERCE_START: "Para começar a vender", COMMERCE_PRO: "Para quem já vende todo mês", COMMERCE_SCALE: "Para operações com volume" };

/**
 * Checkout dos planos da NextLevel E-commerce (D233): escolha do plano e do ciclo, dados da conta e um resumo vivo ao lado
 * (no celular, acima do botão). Os valores vêm do catálogo do Master; na Black, o anual já chega com 2 meses grátis e é o
 * mesmo valor que a assinatura congela (`startCommerceSubscription`). Sem "1º mês" especial (D233).
 */
export function CheckoutEc({ plans, trialDays, black, initialPlan, initialCycle, initialRef }: Props) {
  const [plan, setPlan] = React.useState<PlanoCheckout["key"]>(initialPlan ?? "COMMERCE_PRO");
  const [cycle, setCycle] = React.useState<"MONTHLY" | "ANNUAL">(black ? (initialCycle === "MONTHLY" && initialPlan ? "MONTHLY" : "ANNUAL") : initialCycle);
  const [f, setF] = React.useState({ storeName: "", ownerName: "", email: "", password: "", taxId: "" });
  const [pending, start] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const p = plans.find((x) => x.key === plan) ?? plans[0]!;
  const anual = cycle === "ANNUAL";
  const descontoAnual = (x: PlanoCheckout) => Math.round((1 - x.annualCents / (x.monthlyCents * 12)) * 100);
  const maiorDesconto = Math.max(...plans.map(descontoAnual));
  const economiaAno = p.monthlyCents * 12 - p.annualCents;
  const cobra = anual ? p.annualCents : p.monthlyCents;
  const set = (patch: Partial<typeof f>) => setF((x) => ({ ...x, ...patch }));
  const submit = (e: React.FormEvent) => {
    e.preventDefault(); setError(null);
    start(async () => { const r = await signupAction({ ...f, ref: initialRef, plan, cycle }); if (r && !r.ok) { setError(r.error); toast.error(r.error); } });
  };

  const resumo = (
    <aside className="ck-resumo" aria-label="Resumo do pedido">
      <p className="ck-rotulo">Resumo do pedido</p>
      <p className="ck-resumo-plano">{p.name}<span>{anual ? (black ? "anual Black" : "anual") : "mensal"}</span></p>
      <dl className="ck-linhas">
        <div><dt>{anual ? "12 meses de plano" : "Mensalidade"}</dt><dd>{reais(anual ? p.monthlyCents * 12 : p.monthlyCents)}</dd></div>
        {anual ? <div className="ck-linha-desc"><dt>{black ? "Black: 2 meses grátis" : "Desconto do anual"}</dt><dd>− {reais(economiaAno)}</dd></div> : null}
        <div><dt>Taxa da plataforma nas vendas</dt><dd className="ck-zero">0%</dd></div>
        <div className="ck-linha-total"><dt>{anual ? "Total do ano" : "Por mês"}</dt><dd>{reais(cobra)}</dd></div>
      </dl>
      {trialDays > 0 ? <p className="ck-hoje"><span>Hoje você paga</span><b>R$ 0</b><small>{trialDays} dias grátis para montar a loja; a 1ª fatura chega depois, por Pix ou cartão.</small></p> : null}
      {anual && economiaAno > 0 ? <p className="ck-economia"><Sparkles className="size-4" aria-hidden /><span>Você economiza <b>{reais(economiaAno)}</b> no ano{black ? ", com o preço travado enquanto for cliente" : ""}.</span></p> : null}
      {black ? <div className="ck-contagem"><ContagemRegressiva fim={black.fim} restanteMs={black.restanteMs} tamanho="sm" rotulo="Preço Black termina em" /></div> : null}
      <ul className="ck-confianca">
        <li><Wallet className="size-4" aria-hidden />O dinheiro das vendas cai direto na sua conta Mercado Pago</li>
        <li><ShieldCheck className="size-4" aria-hidden />{anual ? "Pagamento único do ano, com 7 dias para desistir" : "Sem fidelidade: cancele quando quiser"}</li>
        <li><Headset className="size-4" aria-hidden />Gente de verdade no suporte, com sede no Brás</li>
      </ul>
    </aside>
  );

  return (
    <form onSubmit={submit} className="ck-grade" aria-label="Cadastro">
      <div className="ck-coluna">
        <section className="ck-painel" aria-labelledby="ck-passo-1">
          <div className="ck-passo-topo">
            <h2 id="ck-passo-1" className="ck-passo"><span>01</span>Escolha o plano</h2>
            <div className="ck-ciclo" role="group" aria-label="Forma de pagamento">
              <button type="button" aria-pressed={!anual} onClick={() => setCycle("MONTHLY")}>Mensal</button>
              <button type="button" aria-pressed={anual} onClick={() => setCycle("ANNUAL")}>{black ? "Anual Black" : "Anual"} <span className="ck-ciclo-selo">−{maiorDesconto}%</span></button>
            </div>
          </div>
          {black && anual ? <p className="ck-aviso-black"><span aria-hidden className="bk-raio" /><b>2 meses grátis</b> no anual e preço travado enquanto você for cliente.</p> : null}
          <div className="ck-planos" role="radiogroup" aria-label="Plano">
            {plans.map((x) => {
              const on = x.key === plan;
              return (
                <label key={x.key} className={`ck-plano${on ? " ck-plano--on" : ""}`}>
                  <input type="radio" name="plan" value={x.key} checked={on} onChange={() => setPlan(x.key)} className="sr-only" />
                  {x.key === "COMMERCE_PRO" ? <span className="ck-plano-tag">Recomendado</span> : null}
                  <span className="ck-plano-nome">{x.name}<span className="ck-radio" aria-hidden>{on ? <Check className="size-3.5" /> : null}</span></span>
                  <span className="ck-plano-para">{PARA[x.key]}</span>
                  <span className="ck-plano-preco"><b>{reais(anual ? Math.round(x.annualCents / 12) : x.monthlyCents)}</b>/mês</span>
                  <span className="ck-plano-sub">{anual ? `${reais(x.annualCents)} no ano · economia de ${reais(x.monthlyCents * 12 - x.annualCents)}` : `ou ${reais(Math.round(x.annualCents / 12))}/mês no anual`}</span>
                  <span className="ck-plano-recursos">{x.features.slice(0, 3).map((r) => <span key={r}><Check className="size-3.5" aria-hidden />{r}</span>)}</span>
                </label>
              );
            })}
          </div>
        </section>

        <section className="ck-painel" aria-labelledby="ck-passo-2">
          <h2 id="ck-passo-2" className="ck-passo"><span>02</span>Seus dados</h2>
          <div className="ck-campos">
            <Campo id="store" rotulo="Nome da loja" value={f.storeName} onChange={(v) => set({ storeName: v })} />
            <Campo id="owner" rotulo="Seu nome" value={f.ownerName} onChange={(v) => set({ ownerName: v })} autoComplete="name" />
            <Campo id="email" rotulo="E-mail" type="email" value={f.email} onChange={(v) => set({ email: v })} autoComplete="email" />
            <Campo id="tax" rotulo="CPF ou CNPJ" value={f.taxId} onChange={(v) => set({ taxId: v })} inputMode="numeric" />
            <Campo id="pass" rotulo="Senha" dica="Mínimo de 8 caracteres" type="password" value={f.password} onChange={(v) => set({ password: v })} autoComplete="new-password" minLength={8} largo />
          </div>
        </section>

        <div className="ck-resumo-celular">{resumo}</div>

        {error ? <p role="alert" className="ck-erro">{error}</p> : null}
        <button type="submit" className="ck-enviar" disabled={pending} aria-busy={pending}>
          <Lock className="size-4" aria-hidden />{pending ? "Criando a sua loja…" : black && anual ? "Garantir a Black e criar minha loja" : trialDays > 0 ? `Criar loja e começar ${trialDays} dias grátis` : "Criar minha loja"}
        </button>
        <p className="ck-termos"><BadgeCheck className="size-3.5" aria-hidden />Vale uma vez por CPF/CNPJ. Ao criar a conta você aceita os termos de uso e a política de privacidade.</p>
      </div>
      <div className="ck-resumo-lateral">{resumo}</div>
    </form>
  );
}

function Campo({ id, rotulo, dica, value, onChange, largo, ...rest }: { id: string; rotulo: string; dica?: string; value: string; onChange: (v: string) => void; largo?: boolean } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "id">) {
  return (
    <div className={`ck-campo${largo ? " ck-campo--largo" : ""}`}>
      <label htmlFor={id}>{rotulo}</label>
      <input id={id} required value={value} onChange={(e) => onChange(e.target.value)} {...rest} aria-describedby={dica ? `${id}-d` : undefined} />
      {dica ? <p id={`${id}-d`}>{dica}</p> : null}
    </div>
  );
}
