import { CONTATOS } from "@/lib/contatos";

/**
 * Respostas prontas da caixa de entrada do Master (D297): o dono escolhe, o texto entra no campo e ele ajusta antes de
 * enviar. Sem preço e sem promessa de ganho (os valores mudam em platform_settings; o texto aponta para a página).
 */
export type RespostaPronta = { id: string; titulo: string; texto: (nome: string | null) => string };

const SITE = "https://nextlevelcommerce.com.br";
const ola = (nome: string | null) => (nome ? `Olá, ${nome}! Tudo bem?` : "Olá! Tudo bem?");
const assinatura = "\n\nUm abraço,\nMaurício\nNextLevel Commerce";

export const RESPOSTAS_PRONTAS: RespostaPronta[] = [
  { id: "recebido", titulo: "Recebemos, já vamos ver", texto: (n) => `${ola(n)}\n\nRecebemos a sua mensagem e já estamos olhando. Respondemos em até 1 dia útil.${assinatura}` },
  { id: "planos", titulo: "Planos e teste grátis", texto: (n) => `${ola(n)}\n\nObrigado pelo interesse na NextLevel Commerce. Os planos, o que cada um inclui e o período de teste estão aqui: ${SITE}/planos\n\nPara criar a sua loja e começar o teste: ${SITE}/quero-minha-loja\n\nSe quiser, me conte o que você vende e eu indico o melhor plano para o seu caso.${assinatura}` },
  { id: "dominio", titulo: "Como ligar o domínio próprio", texto: (n) => `${ola(n)}\n\nPara usar o seu domínio na loja: no painel, abra "Minha loja" e siga a parte "Domínio próprio". O painel mostra o registro que você cria no site onde comprou o domínio (Registro.br, Hostinger, GoDaddy...). Depois de criado, a ligação costuma levar de alguns minutos a algumas horas.\n\nSe travar em algum passo, me mande um print da tela que eu te ajudo.${assinatura}` },
  { id: "pix", titulo: "Comprovante de Pix recebido", texto: (n) => `${ola(n)}\n\nRecebemos o seu comprovante, obrigado. Vamos conferir no banco e confirmar no seu painel em até 1 dia útil. Qualquer dúvida sobre faturas e contrato, é só escrever para ${CONTATOS.financeiro}.${assinatura}` },
  { id: "parceiro", titulo: "Quero ser parceiro", texto: (n) => `${ola(n)}\n\nQue bom que você quer ser parceiro da NextLevel Commerce. Como funciona, as comissões e o cadastro estão aqui: ${SITE}/parceiros\n\nDepois do cadastro, o seu link de indicação aparece no painel do parceiro. Dúvidas sobre o programa: ${CONTATOS.parceiros}.${assinatura}` },
];

/** Primeiro nome para a saudação; sem nome ou com cara de e-mail, sem nome. */
export function primeiroNome(nome: string | null | undefined): string | null {
  const n = (nome ?? "").trim().split(/\s+/)[0] ?? "";
  if (!n || n.includes("@") || n.length < 2) return null;
  return n[0]!.toUpperCase() + n.slice(1).toLowerCase();
}
