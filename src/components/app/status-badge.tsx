import { CheckCircle2, AlertTriangle, XCircle, Info, Circle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { OrderStatus } from "@/db/schema";
import { ORDER_STATUS_LABEL, ORDER_STATUS_TONE } from "@/lib/domain/order-status";

const TONE_ICON = { success: CheckCircle2, warning: AlertTriangle, danger: XCircle, info: Info, neutral: Circle, brand: CheckCircle2, outline: Circle } as const;
type Tone = keyof typeof TONE_ICON;
function Ico({ tone }: { tone: Tone }) { const I = TONE_ICON[tone]; return <I />; }

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge tone={ORDER_STATUS_TONE[status]} icon={<Ico tone={ORDER_STATUS_TONE[status] as Tone} />}>{ORDER_STATUS_LABEL[status]}</Badge>;
}

const GENERIC: Record<string, { label: string; tone: "neutral" | "success" | "warning" | "danger" | "info" | "brand" | "outline" }> = {
  ACTIVE: { label: "Ativa", tone: "success" },
  PENDING_PAYMENT: { label: "Aguardando pagamento", tone: "warning" },
  WARNING: { label: "Aviso de atraso", tone: "warning" },
  PARTIAL_BLOCK: { label: "Bloqueio parcial", tone: "danger" },
  WAIVED: { label: "Isenta", tone: "brand" },
  CANCELED: { label: "Cancelada", tone: "outline" },
  GUARANTEE: { label: "Em garantia", tone: "info" },
  CREDITED: { label: "Creditada", tone: "success" },
  DROP_MANUAL: { label: "Drop manual", tone: "outline" },
  STORE_SUBDOMAIN: { label: "Loja SuperDrop", tone: "info" },
  STORE_OWN: { label: "Loja própria", tone: "brand" },
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
  return <Badge tone={g.tone} icon={dot === false ? undefined : <Ico tone={g.tone} />}>{g.label}</Badge>;
}
