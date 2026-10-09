import Link from "next/link";
import { BRAS_TERMS_VERSION } from "@/lib/domain/bras/membros";
import { supportContacts } from "@/lib/support";
import "./bras.css";

/**
 * Termos de uso e política de privacidade da Brás Digital (D99). Descrevem o que o sistema faz hoje (dados de `bd_members`,
 * `users` e `bd_requests`; importadora recebe só o envio; vídeos no YouTube; cookie de sessão). Versão inicial, para revisão
 * jurídica: o aviso fica visível no topo. Mudou o texto, mude `BRAS_TERMS_VERSION` (os membros aceitam de novo no Meu Brás).
 */
const data = BRAS_TERMS_VERSION.split("-").reverse().join("/");

function Contato() {
  const c = supportContacts();
  return c.email ? <a href={`mailto:${c.email}`} className="font-semibold underline">{c.email}</a> : <span>o canal de atendimento informado na área do cliente</span>;
}

function Moldura({ titulo, outro, children }: { titulo: string; outro: { href: string; label: string }; children: React.ReactNode }) {
  return (
    <div className="bd-home">
      <article className="bd-legal bd-claro mx-auto max-w-3xl px-4 py-14 text-foreground">
        <p className="text-sm font-bold uppercase tracking-widest bd-accent">Brás Digital</p>
        <h1 className="bd-display mt-2 text-4xl">{titulo}</h1>
        <p role="note" className="mt-4 rounded-xl border border-border bg-surface-muted px-4 py-3 text-sm text-muted-foreground">Versão inicial de {data}. Em revisão jurídica: quando o texto mudar, avisamos na área do cliente e pedimos um novo aceite.</p>
        <div className="mt-8 space-y-4 leading-relaxed">{children}</div>
        <p className="mt-10 text-sm text-muted-foreground">Veja também: <Link href={outro.href} className="font-semibold underline">{outro.label}</Link> · <Link href="/" className="font-semibold underline">Página inicial</Link></p>
      </article>
    </div>
  );
}

const H2 = ({ children }: { children: React.ReactNode }) => <h2 className="pt-4 text-xl font-bold">{children}</h2>;

export function BrasTerms() {
  return (
    <Moldura titulo="Termos de uso" outro={{ href: "/privacidade", label: "Política de privacidade" }}>
      <H2>1. O que é a Brás Digital</H2>
      <p>A Brás Digital é uma plataforma de atacado operada pela NextLevel Marketing Ltda. Ela mostra descobertas de produtos de importadoras do Brás, em São Paulo, com análise de mercado, e organiza pedidos de compra em caixa fechada. A Brás Digital não é a vendedora dos produtos: quem vende e entrega as caixas é a importadora.</p>
      <H2>2. Quem pode se cadastrar</H2>
      <p>Somente empresas com CNPJ ativo que compram para revender. Um cadastro por CNPJ. Você declara que as informações do cadastro são verdadeiras e que tem autorização para representar a empresa. O cadastro é grátis.</p>
      <H2>3. Acesso e bloqueio</H2>
      <p>O acesso de membro é liberado na hora do cadastro. A equipe pode bloquear o cadastro em caso de dado falso, uso por concorrente ou importadora se passando por lojista, revenda da tabela de preços, tentativa de acesso indevido ou desrespeito a estes termos. A senha é pessoal; não compartilhe.</p>
      <H2>4. Preços, caixas e pedidos</H2>
      <p>Os preços e as caixas disponíveis são de atacado e só aparecem para membros. A venda é só em caixa fechada, com pedido mínimo de uma caixa. A quantidade de unidades de cada caixa é a informada na descoberta. Preço e disponibilidade podem mudar até a confirmação do pedido.</p>
      <p>O pedido feito pela plataforma é um pedido de compra: a equipe da Brás Digital confirma com você a disponibilidade, o valor e a forma de pagamento combinada. O pedido passa pelas situações recebido, confirmado, pago e retirado, ou cancelado.</p>
      <H2>5. Retirada</H2>
      <p>A retirada é no Brás, na importadora, pela transportadora que você escolher. A plataforma não calcula frete. A importadora recebe só os dados de envio do pedido (endereço, transportadora e quantidade de caixas).</p>
      <H2>6. Análise de mercado</H2>
      <p>As análises (tendência, concorrência, preço praticado no Mercado Livre, margem estimada, riscos e sugestões de anúncio) são dados e opinião da equipe na data da publicação. Não são promessa de venda, de preço ou de ganho. A decisão de compra é sua.</p>
      <p>Na fase de lançamento, a análise completa pode estar liberada para todos os membros. Depois, ela pode depender de assinatura ou de volume de compras no período, com as regras mostradas na área do cliente antes de qualquer cobrança.</p>
      <H2>7. Conteúdo</H2>
      <p>Vídeos, textos e análises da Brás Digital não podem ser copiados, revendidos ou publicados fora da plataforma sem autorização. Os vídeos ficam hospedados no YouTube.</p>
      <H2>8. Atendimento</H2>
      <p>Dúvidas, ocorrências e trocas são tratadas com a equipe da Brás Digital: <Contato />.</p>
      <H2>9. Mudanças nestes termos</H2>
      <p>Quando estes termos mudarem, a nova versão aparece aqui e na área do cliente, e o seu aceite é pedido de novo.</p>
    </Moldura>
  );
}

export function BrasPrivacy() {
  return (
    <Moldura titulo="Política de privacidade" outro={{ href: "/termos", label: "Termos de uso" }}>
      <H2>1. Quem trata os seus dados</H2>
      <p>A NextLevel Marketing Ltda., que opera a Brás Digital, é a controladora dos dados do cadastro e dos pedidos. Contato para assuntos de privacidade: <Contato />.</p>
      <H2>2. Quais dados guardamos</H2>
      <ul className="list-disc space-y-1 pl-6">
        <li><b>Cadastro:</b> CNPJ, nome da empresa, seu nome, e-mail, WhatsApp e senha (guardada só como código irreversível).</li>
        <li><b>Pedidos:</b> produto, quantidade de caixas, dados de envio (endereço, cidade, CEP, transportadora) e observações que você escrever.</li>
        <li><b>Uso:</b> data do cadastro, do aceite destes textos, da última visita à área do cliente e a descoberta pela qual você chegou ao cadastro, quando houver.</li>
        <li><b>Segurança:</b> registros de ações importantes (como bloqueios e mudanças de situação de pedido) para auditoria.</li>
      </ul>
      <H2>3. Para que usamos</H2>
      <p>Para liberar o acesso de membro, mostrar preços de atacado, registrar e acompanhar os seus pedidos, falar com você sobre eles, prevenir fraude e uso indevido e cumprir obrigações legais. Não vendemos os seus dados.</p>
      <H2>4. Com quem compartilhamos</H2>
      <p><b>Importadora:</b> recebe só os dados de envio de cada pedido (endereço, transportadora e quantidade de caixas). Ela não recebe o seu CNPJ, telefone, e-mail ou nome. <b>Prestadores:</b> hospedagem, banco de dados e envio de e-mail, só para operar a plataforma. <b>Autoridades:</b> quando a lei exigir.</p>
      <H2>5. Vídeos e cookies</H2>
      <p>Os vídeos são do YouTube e só carregam quando você toca para assistir; a partir daí valem as regras do YouTube. Usamos um cookie de sessão para manter você conectado. Não usamos cookies de publicidade.</p>
      <H2>6. Por quanto tempo</H2>
      <p>Enquanto o seu cadastro estiver ativo e, depois disso, pelo prazo necessário para cumprir obrigações legais e resolver eventuais pendências de pedidos.</p>
      <H2>7. Seus direitos</H2>
      <p>Você pode pedir acesso, correção, portabilidade ou exclusão dos seus dados, e saber com quem eles foram compartilhados, pelo contato acima. Alguns dados de pedidos podem ser mantidos quando a lei exigir.</p>
      <H2>8. Segurança</H2>
      <p>Acesso aos dados só por pessoas autorizadas da equipe, senhas guardadas como código irreversível e conexão criptografada. Nenhum sistema é infalível; se houver incidente que afete você, avisamos.</p>
    </Moldura>
  );
}
