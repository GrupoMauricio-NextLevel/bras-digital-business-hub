import { describe, expect, it } from "vitest";
import { pedidosQuePrecisamDeVoce } from "@/lib/domain/pedidos-agora";

const agora = new Date("2026-10-29T12:00:00Z");
const ped = (id: string, status: string, horas: number, pago = "PAID") => ({
  id, number: Number(id), status, customerPaymentStatus: pago, customerName: "Ana Souza", customerPhone: "11988887777", totalCents: 10000,
  createdAt: new Date(agora.getTime() - horas * 3_600_000).toISOString(),
});

describe("pedidos que precisam do lojista (D208)", () => {
  it("só entra o que passou do ritmo normal, do mais urgente ao menos", () => {
    const r = pedidosQuePrecisamDeVoce([
      ped("1", "PENDING", 30, "PENDING"), ped("2", "READY_TO_PICK", 60), ped("3", "READY_TO_PICK", 5), ped("4", "SHIPPED", 24 * 8), ped("5", "DELIVERED", 500), ped("6", "CANCELED", 500),
    ], agora, "Fio & Linha");
    expect(r.map((x) => x.id)).toEqual(["2", "1", "4"]);
    expect(r[0]!.tom).toBe("danger");
  });
  it("traz a mensagem pronta de WhatsApp com o número do pedido", () => {
    const [p] = pedidosQuePrecisamDeVoce([ped("7", "PENDING", 30, "PENDING")], agora, "Fio & Linha");
    expect(decodeURIComponent(p!.whatsappHref!)).toContain("pedido #7 ainda está aguardando o pagamento");
  });
});
