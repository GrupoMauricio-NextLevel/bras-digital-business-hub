import { describe, expect, it } from "vitest";
import { agoraDoParceiro, type IndicadoEc } from "@/lib/domain/parceiros-ec";
import type { SituacaoComercial } from "@/lib/domain/situacao-comercial";

const agora = new Date("2026-10-29T12:00:00Z");
const s = (pagamento: SituacaoComercial["pagamento"], d: number | null): SituacaoComercial => ({ pagamento, rotulo: pagamento, plano: "Start", ciclo: "MONTHLY", valorCents: 5700, venceEm: null, diasParaVencer: d });
const ind = (id: string, sit: SituacaoComercial, publicada = true, dias = 10): IndicadoEc => ({ id, nome: id, slug: id, criadaEm: new Date(agora.getTime() - dias * 86_400_000).toISOString(), publicada, s: sit, ganhoCents: 0 });

describe("painel do parceiro da Commerce (D220)", () => {
  it("prioriza teste acabando, depois pagamento pendente e vencido, e loja parada por último", () => {
    const r = agoraDoParceiro([ind("parada", s("teste", 10), false), ind("ok", s("pagante", 20)), ind("venc", s("vencido", -2)), ind("aguarda", s("aguardando", null)), ind("teste", s("teste", 2))], agora);
    expect(r.map((x) => x.id)).toEqual(["teste", "venc", "aguarda", "parada"]);
  });
});
