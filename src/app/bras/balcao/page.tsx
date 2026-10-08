import { BrasShell } from "../shell";
import { requireBrasPanelPreview } from "../guard";

export const dynamic = "force-dynamic";

export default async function Balcao() {
  await requireBrasPanelPreview();
  return <BrasShell panel="balcao" regions={[
    { title: "Retiradas de hoje", description: "Fila de retiradas com o número de caixas em destaque.", dependsOn: "fluxo de pedido e papéis da importadora. Pagamento na primeira etapa: direto à importadora, comissão acertada à parte (D92)." },
    { title: "Conferência", description: "Leitura do código da retirada e confirmação da conferência.", dependsOn: "contrato de retirada. Decidido: o Balcão vê só os dados de envio do pedido (D92)." },
    { title: "Ocorrências", description: "Registro de divergência, falta ou avaria na retirada.", dependsOn: "decidido: ocorrência, cancelamento e reembolso ficam com o atendimento da Brás Digital (D92); a tela entra com o fluxo de pedido." },
  ]} />;
}
