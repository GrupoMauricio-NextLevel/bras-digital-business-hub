import { count, eq } from "drizzle-orm";
import type { Database } from "@/db/client";
import { experiments } from "@/db/schema";
import { brandsFrom } from "@/lib/brand";
import { finFlag } from "@/lib/finance/flags";
import { brasPanelsEnabled } from "@/lib/bras/panels";
import { requireMasterFn, type Actor } from "./access";
import { launchRoadmap } from "./precos/roteiro";
import { getProposal } from "./precos/proposta";
import { getNextLevelMp } from "./nextlevel-billing";
import { getExcursionRules } from "./cargas/regras-excursao";

/**
 * "Pronto e desligado" (D145): tudo o que já está no ar mas desligado de propósito até o dono decidir, com o estado de
 * agora e onde ligar. Só LÊ: nada é ligado daqui. Variáveis do Render aparecem só como "ligada/desligada"; nenhum valor
 * (token, chave, endereço de e-mail) sai desta função.
 */
export type OffState = "LIGADO" | "PARCIAL" | "DESLIGADO";
export type OffHow = { kind: "tela"; href: string } | { kind: "render"; vars: string[] };
export type OffItem = { key: string; title: string; state: OffState; detail: string; how: OffHow; step?: number; next?: boolean };
export type OffGroup = { key: string; title: string; hint: string; items: OffItem[] };

const on = (b: boolean): OffState => (b ? "LIGADO" : "DESLIGADO");
const set = (env: Record<string, string | undefined>, k: string) => !!env[k]?.trim();

export async function readyButOff(db: Database, actor: Actor, env: Record<string, string | undefined> = process.env, now = new Date()): Promise<OffGroup[]> {
  requireMasterFn(actor, []);
  const [roadmap, proposal, mp, excursion, [running]] = await Promise.all([
    launchRoadmap(db, actor, now), getProposal(db), getNextLevelMp(db), getExcursionRules(db),
    db.select({ n: count() }).from(experiments).where(eq(experiments.status, "RODANDO")),
  ]);
  const brands = brandsFrom(env);
  const runningN = running?.n ?? 0;
  const emailOn = set(env, "RESEND_API_KEY") && set(env, "EMAIL_FROM");
  const supportOn = set(env, "NEXT_PUBLIC_SUPPORT_WHATSAPP") || set(env, "NEXT_PUBLIC_SUPPORT_EMAIL");
  const offices = (["SUPERDROP", "NEXTLEVEL_COMMERCE"] as const).filter((c) => brands[c].officeUrl);

  return [
    {
      key: "roteiro", title: "Roteiro de ligar em ordem (preço e ecossistema)",
      hint: "Ordem aprovada em D140. Ligue um passo, observe uma ou duas semanas e só então passe ao seguinte.",
      items: roadmap.map((s) => ({ key: `roteiro-${s.n}`, title: s.title, state: s.state, detail: s.detail, how: { kind: "tela", href: s.href }, step: s.n, next: s.next })),
    },
    {
      key: "dinheiro", title: "Dinheiro e cobrança",
      hint: "Nada aqui cobra sozinho: cada chave só passa a valer depois que você liga.",
      items: [
        { key: "mp-nextlevel", title: "Conta Mercado Pago da NextLevel", state: on(mp.connected), detail: mp.connected ? `Conectada${mp.isTest ? " (conta de TESTE: troque pela de produção antes de vender)" : ""}.` : "Sem conta conectada: as cobranças da NextLevel (planos, temas, serviços) não conseguem gerar Pix.", how: { kind: "tela", href: "/master/settings" } },
        { key: "pagarme", title: "Pagar.me como segundo gateway", state: on(finFlag("FIN_PAGARME", env)), detail: finFlag("FIN_PAGARME", env) ? "Ligado: produtos marcados no catálogo cobram pelo Pagar.me." : "Desligado: tudo cobra pelo Mercado Pago.", how: { kind: "render", vars: ["FIN_PAGARME=true"] } },
        { key: "excursao-taxa", title: "Taxa da NextLevel nos fardos da Excursão", state: on(excursion.fee.charging), detail: excursion.fee.charging ? "Cobrança ligada: a taxa entra na fatura mensal de cada ônibus." : "Calculada e mostrada, mas nada é cobrado dos ônibus.", how: { kind: "tela", href: "/bras/excursao" } },
        { key: "excursao-pix", title: "Pix do frete do ônibus na conta do dono do ônibus", state: on(excursion.pixOnline), detail: excursion.pixOnline ? "Ligado: o cliente paga o frete por Pix direto na conta Mercado Pago de cada ônibus." : "Desligado: cliente e ônibus combinam o pagamento entre eles.", how: { kind: "tela", href: "/bras/excursao" } },
        { key: "experimentos", title: "Experimentos de preço rodando", state: on(runningN > 0), detail: runningN ? `${runningN} experimento(s) rodando agora.` : "Nenhum experimento rodando.", how: { kind: "tela", href: "/master/financeiro/experimentos" } },
        { key: "proposta", title: "Proposta de preços do grupo", state: proposal.status === "APROVADA" ? "LIGADO" : "DESLIGADO", detail: proposal.status === "APROVADA" ? "Aprovada (registro da decisão; os preços só mudam na porta de entrada ou no catálogo)." : "Em rascunho: aprovar registra a decisão, não muda preço sozinho.", how: { kind: "tela", href: "/master/financeiro/proposta" } },
      ],
    },
    {
      key: "acesso", title: "Marcas e acesso (chaves no Render)",
      hint: "Ligam-se em Render → serviço → Environment. Cada mudança publica de novo em 3 a 6 minutos.",
      items: [
        { key: "cadastro-commerce", title: "Cadastro aberto da NextLevel Commerce", state: on(brands.NEXTLEVEL_COMMERCE.signupOpen), detail: brands.NEXTLEVEL_COMMERCE.signupOpen ? "Qualquer pessoa cria a loja Commerce pelo site." : "Fechado: o site leva a “Quero minha loja” (contato).", how: { kind: "render", vars: ["BRAND_SIGNUP_NEXTLEVEL_COMMERCE=true"] } },
        { key: "parceiros-commerce", title: "Programa de Parceiros na Commerce", state: on(brands.NEXTLEVEL_COMMERCE.partnersOpen), detail: brands.NEXTLEVEL_COMMERCE.partnersOpen ? "Aberto também no endereço da Commerce." : "Aberto só no SuperDrop.", how: { kind: "render", vars: ["BRAND_PARTNERS_NEXTLEVEL_COMMERCE=true"] } },
        { key: "bras-publico", title: "Brás Digital Club aberto ao público", state: on(brands.BRAS_DIGITAL.live), detail: brands.BRAS_DIGITAL.live ? "Página pública e cadastro grátis com CNPJ no ar." : "Página “em breve” com lista de espera.", how: { kind: "render", vars: ["BRAND_SIGNUP_BRAS_DIGITAL=true"] } },
        { key: "bras-paineis", title: "Painéis da Brás (Balcão, importadora, Club no balcão)", state: on(brasPanelsEnabled(env)), detail: brasPanelsEnabled(env) ? "Ligados." : "Desligados: só o Master vê uma prévia.", how: { kind: "render", vars: ["BRAS_PANELS=true"] } },
        { key: "site-grupo", title: "Site do grupo no endereço próprio (nextlevelgroup.com.br)", state: on(set(env, "GROUP_SITE_URL")), detail: set(env, "GROUP_SITE_URL") ? "Ligado: Soluções e Loja NextLevel abrem no endereço do grupo." : "Soluções e Loja NextLevel moram por ora em master.nextlevelgroup.com.br. Precisa do domínio verificado no Render antes (Fase 3).", how: { kind: "render", vars: ["GROUP_SITE_URL=https://nextlevelgroup.com.br", "BRAND_DOMAINS_NEXTLEVEL"] } },
        { key: "master-exclusivo", title: "Painéis da equipe só no endereço do Master", state: env.MASTER_HOST_ONLY === "false" ? "DESLIGADO" : "LIGADO", detail: env.MASTER_HOST_ONLY === "false" ? "Desligado: o Master também abre nos endereços das marcas." : "Ligado (padrão desde D149): Master, Admin Commerce e Estúdio Brás só abrem em master.nextlevelgroup.com.br.", how: { kind: "render", vars: ["MASTER_HOST_ONLY=false (só para desligar)"] } },
        { key: "escritorio", title: "Endereço só dos painéis (ex.: office.superdrop.com.br)", state: offices.length === 2 ? "LIGADO" : offices.length ? "PARCIAL" : "DESLIGADO", detail: offices.length ? `Ligado em: ${offices.map((c) => brands[c].name).join(", ")}.` : "Painéis no mesmo endereço do site. Precisa do domínio verificado no Render antes.", how: { kind: "render", vars: ["BRAND_OFFICE_SUPERDROP", "BRAND_OFFICE_NEXTLEVEL_COMMERCE"] } },
      ],
    },
    {
      key: "comunicacao", title: "Comunicação",
      hint: "Sem estas chaves o sistema funciona, mas guarda os e-mails sem enviar e esconde o botão de suporte.",
      items: [
        { key: "email", title: "Envio real de e-mails (Resend)", state: on(emailOn), detail: emailOn ? "E-mails saem de verdade." : "Os e-mails ficam só registrados (status “guardado”), ninguém recebe.", how: { kind: "render", vars: ["RESEND_API_KEY", "EMAIL_FROM", "EMAIL_REPLY_TO (opcional)"] } },
        { key: "suporte", title: "WhatsApp e e-mail de suporte nas telas", state: on(supportOn), detail: supportOn ? "Botão de suporte aparece para os clientes." : "Sem contato de suporte nas telas.", how: { kind: "render", vars: ["NEXT_PUBLIC_SUPPORT_WHATSAPP", "NEXT_PUBLIC_SUPPORT_EMAIL"] } },
      ],
    },
  ];
}
