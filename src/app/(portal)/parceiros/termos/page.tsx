import type { Metadata } from "next";
import { getDb } from "@/db/client";
import { requireBrandFeature } from "@/lib/brand-server";
import { getPartnerSettings } from "@/lib/domain/partners";
import { formatBRL } from "@/lib/money";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Termos do Programa de Parceiros", robots: { index: false } };

export default async function TermosParceiros() {
  await requireBrandFeature("partners");
  const s = await getPartnerSettings(await getDb());
  const tiers = [...s.tiers].sort((a, b) => a.min - b.min).map((t) => `${t.bps / 100}% (${t.max ? `${t.min}${t.max !== t.min ? ` a ${t.max}` : ""}` : `${t.min} ou mais`} ativações no mês)`).join(", ");
  return (
    <article className="mx-auto max-w-3xl space-y-5 px-4 py-14 text-foreground">
      <h1 className="font-[family-name:var(--nl-font-display)] text-3xl font-extrabold tracking-tight">Termos do Programa de Parceiros</h1>
      <p className="text-sm text-muted-foreground">Versão {s.termsVersion}. Programa operado pela NextLevel Marketing Ltda. Este texto é um modelo de partida e deve passar por revisão jurídica e contábil antes do lançamento público.</p>
      <h2 className="text-xl font-bold">1. O programa</h2>
      <p>O parceiro indica lojistas para assinar planos SuperDrop e recebe comissão sobre os pagamentos efetivamente realizados por esses clientes. O programa cobre apenas a venda de planos; não há comissão sobre frete, taxa por pedido, serviços da Loja NextLevel, temas ou qualquer venda dos clientes indicados.</p>
      <h2 className="text-xl font-bold">2. Ativação e meta mensal</h2>
      <p>Ativação é a loja indicada que paga o primeiro pagamento (setup e primeira mensalidade). O cadastro é gratuito enquanto o parceiro fizer {s.monthlyGoal} ativação(ões) por mês civil. Sem ativação, o cadastro fica inativo: links e cupons são pausados e a reativação custa {formatBRL(s.inactiveFeeCents)} por mês. Inativo, o parceiro continua recebendo a manutenção dos clientes já indicados.</p>
      <h2 className="text-xl font-bold">3. Comissões</h2>
      <p>Setup: {tiers}, apurado pelas ativações do mês civil e ajustado no fechamento do mês. Manutenção: {s.maintenanceBps / 100}% sobre cada mensalidade paga pelo cliente indicado, enquanto ele pagar. Não há comissão sobre outros parceiros.</p>
      <h2 className="text-xl font-bold">4. Garantia, estorno e saque</h2>
      <p>Toda comissão fica em garantia por {s.guaranteeDays} dias antes de ficar disponível. Estorno ou cancelamento do pagamento do cliente devolve a comissão correspondente, inclusive por débito no saldo se já tiver sido sacada. O saque mínimo é {formatBRL(s.minPayoutCents)}, limitado a {s.payoutsPerWeek} pedido(s) por semana, por Pix para chave do mesmo CPF/CNPJ do cadastro.</p>
      <h2 className="text-xl font-bold">5. Atribuição</h2>
      <p>O cupom do parceiro tem prioridade; na falta dele vale o último link clicado em até {s.attributionDays} dias. A atribuição é gravada no cadastro da loja e não muda. Indicação da própria pessoa (mesmo CPF/CNPJ ou e-mail) não gera comissão.</p>
      <h2 className="text-xl font-bold">6. Conduta e ganhos</h2>
      <p>É proibido prometer ganhos, usar spam, se passar pela NextLevel ou usar a marca fora das regras. Os ganhos dependem das vendas de cada parceiro e não são garantidos. A NextLevel pode suspender cadastros por fraude ou descumprimento destes termos.</p>
      <h2 className="text-xl font-bold">7. Dados pessoais</h2>
      <p>O parceiro não recebe dados pessoais dos clientes indicados além do necessário para acompanhar comissões (nome da loja parcial, etapa e valores). Cliques são guardados apenas como registros com hash, sem IP ou agente de usuário em texto.</p>
    </article>
  );
}
