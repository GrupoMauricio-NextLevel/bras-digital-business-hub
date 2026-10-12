import Link from "next/link";
import { supportContacts } from "@/lib/support";

/**
 * Termos de uso e política de privacidade do GRUPO NextLevel (D148): um texto único para todas as marcas (decisão do dono,
 * 12/10/2026), descrevendo o que o sistema faz hoje. A Brás Digital segue com o texto dela (aceite versionado, D99) até a
 * unificação com novo aceite. Versão inicial, para revisão jurídica: o aviso fica visível no topo.
 */
export const GROUP_LEGAL_VERSION = "2026-10-12";
const data = GROUP_LEGAL_VERSION.split("-").reverse().join("/");

function Contato() {
  const c = supportContacts();
  return c.email ? <a href={`mailto:${c.email}`} className="font-semibold text-link underline">{c.email}</a> : <span>o canal de atendimento informado no seu painel</span>;
}

function Moldura({ titulo, outro, marca, children }: { titulo: string; outro: { href: string; label: string }; marca: string; children: React.ReactNode }) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-14">
      <p className="text-sm font-bold uppercase tracking-widest text-link">Grupo NextLevel · {marca}</p>
      <h1 className="mt-2 font-[family-name:var(--nl-font-display)] text-4xl font-extrabold tracking-tight">{titulo}</h1>
      <p role="note" className="mt-4 rounded-xl border border-border bg-surface-muted px-4 py-3 text-sm text-muted-foreground">Versão inicial de {data}, válida para todas as marcas do Grupo NextLevel. Em revisão jurídica: quando o texto mudar, avisamos no seu painel.</p>
      <div className="mt-8 space-y-4 leading-relaxed">{children}</div>
      <p className="mt-10 text-sm text-muted-foreground">Veja também: <Link href={outro.href} className="font-semibold text-link underline">{outro.label}</Link> · <Link href="/" className="font-semibold text-link underline">Página inicial</Link></p>
    </article>
  );
}

const H2 = ({ children }: { children: React.ReactNode }) => <h2 className="pt-4 text-xl font-bold">{children}</h2>;

export function GroupTerms({ marca }: { marca: string }) {
  return (
    <Moldura titulo="Termos de uso" marca={marca} outro={{ href: "/privacidade", label: "Política de privacidade" }}>
      <H2>1. Quem somos</H2>
      <p>As plataformas SuperDrop, NextLevel Commerce, Brás Digital, NextLevel Cargas e os serviços da NextLevel Soluções Digitais são operados pela NextLevel Marketing Ltda. (“NextLevel”). Estes termos valem para todas elas. Quando uma plataforma tiver regra própria, ela aparece na seção 8 ou na tela onde a regra se aplica.</p>
      <H2>2. Conta e acesso</H2>
      <p>Para usar os painéis você cria uma conta com dados verdadeiros e mantém a senha em sigilo; ela é pessoal. Você responde pelo que for feito com a sua conta e pela equipe que convidar. A NextLevel pode suspender ou bloquear contas em caso de dado falso, fraude, tentativa de acesso indevido, uso que prejudique outros clientes ou desrespeito a estes termos.</p>
      <H2>3. Planos, pagamentos e cancelamento</H2>
      <p>Preço, período de teste, forma de pagamento, renovação e taxas de cada plano aparecem na página de planos e na tela de pagamento antes de você pagar. Os pagamentos são processados pelo Mercado Pago (Pix e cartão); a NextLevel não guarda dados de cartão. Sem pagamento, o acesso ao plano pode ser pausado até a regularização, com aviso no painel. Você pode cancelar a qualquer momento pelo painel ou pelo atendimento; o que já foi pago segue as condições mostradas na contratação.</p>
      <H2>4. Quem vende para quem</H2>
      <p>A NextLevel fornece tecnologia. Nas lojas criadas nas plataformas, quem vende ao cliente final é o dono da loja, que responde pelos produtos, preços, trocas, devoluções e notas fiscais da sua venda. No SuperDrop, o fornecedor separa e envia os pedidos dos lojistas da rede dele. Na Brás Digital, quem vende as caixas é a importadora. Na NextLevel Cargas, o frete é combinado entre quem contrata e a transportadora.</p>
      <H2>5. Sem promessa de ganho</H2>
      <p>Simulações, análises, recomendações e exemplos mostrados nas plataformas são informativos. Não são promessa de venda, faturamento, comissão ou lucro. O resultado depende do seu produto, do seu preço e da sua operação.</p>
      <H2>6. Uso correto e conteúdo</H2>
      <p>É proibido usar as plataformas para vender produtos ilegais, falsificados ou que violem direitos de terceiros, enviar mensagens enganosas ou tentar burlar a segurança. O conteúdo que você publica (fotos, textos, marcas) continua seu, e você nos autoriza a exibi-lo para fazer a sua loja funcionar. Textos, telas, temas e materiais da NextLevel não podem ser copiados ou revendidos sem autorização.</p>
      <H2>7. Disponibilidade</H2>
      <p>Trabalhamos para manter as plataformas no ar e seguras, mas podem ocorrer interrupções para manutenção ou por falhas de terceiros (hospedagem, meios de pagamento, transportadoras). Avisamos no painel quando houver manutenção programada.</p>
      <H2>8. Regras de cada plataforma</H2>
      <ul className="list-disc space-y-2 pl-6">
        <li><b>SuperDrop:</b> o lojista mantém saldo recarregado por Pix; o custo de cada pedido é debitado do saldo e o fornecedor envia ao cliente do lojista. Taxas por pedido e mensalidades seguem o plano escolhido.</li>
        <li><b>NextLevel Commerce:</b> a loja é da sua marca; os pagamentos dos seus clientes vão para a sua conta de pagamento, e a taxa de plataforma segue o plano escolhido.</li>
        <li><b>Brás Digital:</b> só empresas com CNPJ, compra em caixa fechada; regras completas nos termos da Brás Digital, no endereço da Brás.</li>
        <li><b>NextLevel Cargas:</b> transportadoras e ônibus de excursão cadastrados respondem pelo transporte que aceitam.</li>
        <li><b>Programa de Parceiros:</b> comissões, prazos e regras de indicação estão nos termos do programa, na página do programa.</li>
      </ul>
      <H2>9. Atendimento e mudanças</H2>
      <p>Dúvidas e ocorrências: <Contato />. Quando estes termos mudarem, a nova versão aparece aqui com a data, e avisamos no seu painel. Estes termos seguem a lei brasileira.</p>
    </Moldura>
  );
}

export function GroupPrivacy({ marca }: { marca: string }) {
  return (
    <Moldura titulo="Política de privacidade" marca={marca} outro={{ href: "/termos", label: "Termos de uso" }}>
      <H2>1. Quem trata os seus dados</H2>
      <p>A NextLevel Marketing Ltda., que opera as plataformas do Grupo NextLevel, é a controladora dos dados das contas (lojistas, fornecedores, parceiros, membros, importadoras e transportadoras). Nos pedidos feitos nas lojas, o dono de cada loja é o responsável pelos dados dos clientes dele, e a NextLevel trata esses dados em nome da loja para a venda funcionar. Contato para assuntos de privacidade: <Contato />.</p>
      <H2>2. Quais dados guardamos</H2>
      <ul className="list-disc space-y-1 pl-6">
        <li><b>Conta:</b> nome, e-mail, telefone ou WhatsApp, CPF ou CNPJ, dados da empresa e da loja, e a senha (guardada só como código irreversível).</li>
        <li><b>Pedidos:</b> produtos, valores, situação, e os dados de entrega do cliente final (nome, e-mail, telefone e endereço).</li>
        <li><b>Pagamentos:</b> identificação e situação das cobranças do Mercado Pago. Dados de cartão ficam só com o Mercado Pago. Chaves e tokens de pagamento ficam criptografados.</li>
        <li><b>Uso e segurança:</b> datas de acesso, aceites e registro de ações importantes para auditoria.</li>
      </ul>
      <H2>3. Para que usamos</H2>
      <p>Para criar e manter a sua conta, processar pedidos e entregas, cobrar planos e repassar valores, pagar comissões de parceiros, dar suporte, prevenir fraude e cumprir obrigações legais. Não vendemos os seus dados.</p>
      <H2>4. Com quem compartilhamos</H2>
      <p>Com quem precisa para o pedido acontecer: o fornecedor ou a importadora recebe os dados de envio do pedido; a transportadora recebe o necessário para a entrega. Com prestadores que operam as plataformas: hospedagem, banco de dados, envio de e-mail e o Mercado Pago. Com autoridades, quando a lei exigir.</p>
      <H2>5. Cookies</H2>
      <p>Usamos um cookie de sessão para manter você conectado e, quando você chega por um link de parceiro, de indicação ou de campanha, cookies que guardam essa origem por até 30 dias para registrar a indicação corretamente. Guardamos também no seu navegador o carrinho das lojas e preferências da tela (como o modo claro ou escuro). Não usamos cookies de publicidade de terceiros.</p>
      <H2>6. Por quanto tempo</H2>
      <p>Enquanto a sua conta estiver ativa e, depois, pelo prazo necessário para cumprir obrigações legais e fiscais e resolver pendências de pedidos e pagamentos.</p>
      <H2>7. Seus direitos</H2>
      <p>Você pode pedir acesso, correção, portabilidade ou exclusão dos seus dados, e saber com quem eles foram compartilhados, pelo contato acima. Alguns dados de pedidos e pagamentos podem ser mantidos quando a lei exigir.</p>
      <H2>8. Segurança</H2>
      <p>Acesso aos dados só por pessoas autorizadas, cada loja vê só os próprios dados, senhas guardadas como código irreversível, segredos de pagamento criptografados e conexão criptografada. Nenhum sistema é infalível; se houver incidente que afete você, avisamos.</p>
    </Moldura>
  );
}
