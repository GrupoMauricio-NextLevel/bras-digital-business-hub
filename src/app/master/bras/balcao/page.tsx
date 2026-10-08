import { BrasShell } from "../shell";
import { requireBrasPanelPreview } from "../guard";

export const dynamic = "force-dynamic";

export default async function Balcao() {
  await requireBrasPanelPreview();
  return <BrasShell panel="balcao" regions={[
    { title: "Retiradas de hoje", description: "Fila de retiradas com o número de caixas em destaque.", dependsOn: "reserva e pagamento ([CONFIRMAR] Pix Split)." },
    { title: "Conferência", description: "Leitura do código da retirada e confirmação da conferência.", dependsOn: "contrato de retirada e dados exibidos ao Balcão ([CONFIRMAR])." },
    { title: "Ocorrências", description: "Registro de divergência, falta ou avaria na retirada.", dependsOn: "regras de ocorrência, cancelamento e estorno ([CONFIRMAR])." },
  ]} />;
}
