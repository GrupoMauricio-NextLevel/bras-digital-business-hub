import { BrasShell } from "../shell";
import { requireBrasPanelPreview } from "../guard";

export const dynamic = "force-dynamic";

export default async function MeuBras() {
  await requireBrasPanelPreview();
  return <BrasShell panel="meu-bras" regions={[
    { title: "Feed de produtos", description: "Vídeo e produto; preço e caixas só para membro aprovado.", dependsOn: "modelo de membro aprovado e provedor de vídeo ([CONFIRMAR])." },
    { title: "Minhas reservas", description: "Caixas reservadas, prazo e situação do pagamento.", dependsOn: "reserva, expiração e Pix ([CONFIRMAR])." },
    { title: "Minhas retiradas", description: "Código de retirada e histórico.", dependsOn: "contrato de retirada no Balcão ([CONFIRMAR])." },
  ]} />;
}
