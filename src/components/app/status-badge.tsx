import { Badge } from "@/components/ui/badge";
import type { OrderStatus } from "@/db/schema";
import { ORDER_STATUS_LABEL, ORDER_STATUS_TONE } from "@/lib/domain/order-status";

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge tone={ORDER_STATUS_TONE[status]} dot>{ORDER_STATUS_LABEL[status]}</Badge>;
}

const GENERIC: Record<string, { label: string; tone: "neutral" | "success" | "warning" | "danger" | "info" | "brand" | "outline" }> = {
  ACTIVE: { label: "Ativa", tone: "success" },
  SUSPENDED: { label: "Suspensa", tone: "warning" },
  CLOSED: { label: "Encerrada", tone: "danger" },
  DRAFT: { label: "Rascunho", tone: "neutral" },
  ARCHIVED: { label: "Arquivado", tone: "outline" },
  PAID: { label: "Pago", tone: "success" },
  PENDING: { label: "Pendente", tone: "warning" },
  REFUNDED: { label: "Estornado", tone: "danger" },
  READY: { label: "Pronta", tone: "success" },
  OPEN: { label: "Em aberto", tone: "warning" },
  OVERDUE: { label: "Vencida", tone: "danger" },
  PAST_DUE: { label: "Em atraso", tone: "warning" },
  NEW: { label: "Novo", tone: "info" },
  CONTACTED: { label: "Em contato", tone: "warning" },
  WON: { label: "Fechado", tone: "success" },
  LOST: { label: "Perdido", tone: "outline" },
  NOT_CONFIGURED: { label: "Não configurado", tone: "outline" },
  DEMO: { label: "Demonstração", tone: "info" },
  CONNECTED: { label: "Conectado", tone: "success" },
  ALL_NETWORK: { label: "Toda a rede", tone: "brand" },
  SELECTED_STORES: { label: "Lojas selecionadas", tone: "info" },
  SUPERDROP: { label: "SuperDrop", tone: "brand" },
  WHITE_LABEL: { label: "White Label", tone: "info" },
  ONLINE_STORE: { label: "Loja virtual", tone: "neutral" },
  WHATSAPP: { label: "WhatsApp", tone: "success" },
  INSTAGRAM: { label: "Instagram", tone: "info" },
  MANUAL: { label: "Manual", tone: "outline" },
  RETAIL: { label: "Varejo", tone: "neutral" },
  WHOLESALE: { label: "Atacado", tone: "info" },
  STARTER: { label: "Starter", tone: "brand" },
  PRO: { label: "Pro", tone: "info" },
  ELITE: { label: "Elite", tone: "neutral" },
};

export function StatusBadge({ value, dot }: { value: string; dot?: boolean }) {
  const g = GENERIC[value] ?? { label: value, tone: "neutral" as const };
  return <Badge tone={g.tone} dot={dot}>{g.label}</Badge>;
}
