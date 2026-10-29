import { formatBRL } from "@/lib/money";
import { ordenar, type ItemAgora } from "./loja-agora";
import type { SituacaoComercial } from "./situacao-comercial";

/**
 * "Precisa de você agora" das telas do Master da E-commerce (D215): Receita, Lojistas e Crescimento, no mesmo bloco
 * único do lojista (D212). Puras. Cada loja abre a ficha do Comercial (`loja:<id>`), onde estão WhatsApp e histórico.
 */
const ficha = (id: string) => `/master/comercial/${encodeURIComponent(`loja:${id}`)}`;
const DIA = 86_400_000;

export function receitaAgora(lojas: { id: string; nome: string; s: SituacaoComercial }[]): ItemAgora[] {
  const l: ItemAgora[] = [];
  for (const x of lojas) {
    const d = x.s.diasParaVencer;
    if (x.s.pagamento === "vencido") l.push({ id: x.id, titulo: `${x.nome}: plano vencido`, detalhe: `${x.s.plano ?? "Plano"}${d !== null && d < 0 ? ` · venceu há ${-d} dia(s)` : ""}. Chame antes de a loja parar.`, tom: "danger", href: ficha(x.id), acao: "Cobrar" });
    else if (x.s.pagamento === "aguardando") l.push({ id: x.id, titulo: `${x.nome}: pagamento pendente`, detalhe: `${x.s.plano ?? "Plano"} escolhido, Pix ainda não pago.`, tom: "warning", href: ficha(x.id), acao: "Lembrar" });
    else if (x.s.pagamento === "teste" && d !== null && d <= 3) l.push({ id: x.id, titulo: `${x.nome}: teste termina em ${Math.max(0, d)} dia(s)`, detalhe: "Hora de ajudar a escolher o plano.", tom: "warning", href: ficha(x.id), acao: "Chamar" });
    else if (x.s.pagamento === "pagante" && d !== null && d >= 0 && d <= 5) l.push({ id: x.id, titulo: `${x.nome}: renova em ${d} dia(s)`, detalhe: `${x.s.plano ?? "Plano"} · ${formatBRL(x.s.valorCents)}/mês.`, tom: "info", href: ficha(x.id), acao: "Ver ficha" });
  }
  return ordenar(l);
}

export function lojistasAgora(lojas: { id: string; nome: string; publicada: boolean; criadaEm: string; pagamentoLoja: string; s: SituacaoComercial }[], agora = new Date()): ItemAgora[] {
  const l: ItemAgora[] = [];
  for (const x of lojas) {
    if (x.s.pagamento === "vencido") { l.push({ id: x.id, titulo: `${x.nome}: acesso vencido`, detalhe: "A loja pode estar bloqueada para vender.", tom: "danger", href: ficha(x.id), acao: "Resolver" }); continue; }
    const dias = Math.floor((agora.getTime() - new Date(x.criadaEm).getTime()) / DIA);
    if (!x.publicada && dias >= 3) l.push({ id: x.id, titulo: `${x.nome}: criada há ${dias} dias e ainda não publicada`, detalhe: "Ofereça ajuda para montar e publicar (ou a Loja Pronta).", tom: "warning", href: ficha(x.id), acao: "Ajudar" });
    else if (x.publicada && x.pagamentoLoja !== "CONNECTED") l.push({ id: x.id, titulo: `${x.nome}: publicada sem Mercado Pago`, detalhe: "Os clientes veem a loja, mas a loja não recebe pagamento real.", tom: "warning", href: ficha(x.id), acao: "Ajudar" });
  }
  return ordenar(l);
}

export function crescimentoAgora(e: { mp: { connected: boolean; isTest?: boolean }; emailLigado: boolean; iaComChave: boolean; iaUsoReal: boolean }): ItemAgora[] {
  const l: ItemAgora[] = [];
  if (!e.mp.connected) l.push({ id: "mp", titulo: "Conecte o Mercado Pago da NextLevel", detalhe: "Sem ele os planos, temas e serviços não geram Pix: ninguém consegue pagar.", tom: "danger", href: "/master/settings", acao: "Conectar" });
  else if (e.mp.isTest) l.push({ id: "mp", titulo: "Mercado Pago da NextLevel em modo de teste", detalhe: "Troque pela conta de produção antes de vender.", tom: "danger", href: "/master/settings", acao: "Trocar" });
  if (!e.emailLigado) l.push({ id: "email", titulo: "E-mails automáticos desligados", detalhe: "Boas-vindas, cobrança e lembretes ficam registrados, mas não saem (RESEND_API_KEY e EMAIL_FROM no Render).", tom: "warning", href: "/master/qualidade", acao: "Ver como ligar" });
  if (!e.iaComChave) l.push({ id: "ia", titulo: "Maurício em modo manual", detalhe: "Responde pelo manual. Com a chave da OpenAI, passa a conversar de verdade com visitantes e lojistas.", tom: "info", href: "/master/ia/ajustes", acao: "Colocar a chave" });
  else if (!e.iaUsoReal) l.push({ id: "ia", titulo: "Chave da IA salva, uso real desligado", detalhe: "Ligue o uso real quando quiser que o Maurício responda com a IA.", tom: "info", href: "/master/ia/ajustes", acao: "Ligar" });
  return ordenar(l);
}
