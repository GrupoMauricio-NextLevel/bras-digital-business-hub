import { BrasShell } from "../shell";
import { requireBrasPanelPreview } from "../guard";

export const dynamic = "force-dynamic";

export default async function Estudio() {
  await requireBrasPanelPreview();
  return <BrasShell panel="estudio" regions={[
    { title: "Hoje", description: "Resumo do dia da operação: o que precisa de atenção primeiro.", dependsOn: "D91 e o modelo de operação da importadora." },
    { title: "Gravar e publicar", description: "Fila de vídeos e produtos a publicar.", dependsOn: "provedor de vídeo/live ([CONFIRMAR])." },
    { title: "Membros aguardando aprovação", description: "Pedidos de acesso de lojistas B2B, com ação auditada.", dependsOn: "modelo de membro B2B e validação de CNPJ ([CONFIRMAR])." },
    { title: "Alertas operacionais", description: "Estoque, reservas e pagamentos que precisam de ação.", dependsOn: "regras de estoque, últimas caixas e Pix ([CONFIRMAR])." },
  ]} />;
}
