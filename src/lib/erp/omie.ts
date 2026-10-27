import type { FetchLike } from "@/lib/payments/mercadopago";
import { timeoutSignal } from "@/lib/http-timeout";
import { dataBR, ErpError, reais, type ErpCliente, type SaldoErp } from "./tipos";

/**
 * Omie (Rodada C, D191; PRECISA VALIDAR com conta real): POST JSON { call, app_key, app_secret, param: [ ... ] } por
 * recurso; erro vem com faultstring. A credencial guardada é { appKey, appSecret } em JSON, criptografado.
 */
export const OMIE_BASE = process.env.ERP_OMIE_BASE ?? "https://app.omie.com.br/api/v1";
export type CredencialOmie = { appKey: string; appSecret: string };
export function lerCredencialOmie(s: string): CredencialOmie | null {
  try { const c = JSON.parse(s) as Partial<CredencialOmie>; return c.appKey?.trim() && c.appSecret?.trim() ? { appKey: c.appKey.trim(), appSecret: c.appSecret.trim() } : null; } catch { return null; }
}

export function omieErp(credencial: string, fetchImpl: FetchLike = fetch, base = OMIE_BASE): ErpCliente {
  const c = lerCredencialOmie(credencial);
  async function chamar<T>(recurso: string, call: string, param: Record<string, unknown>): Promise<T> {
    if (!c) throw new ErpError("Informe a app key e o app secret do Omie.", true);
    let res: Response;
    try {
      res = await fetchImpl(`${base}/${recurso}/`, { method: "POST", signal: timeoutSignal(), headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ call, app_key: c.appKey, app_secret: c.appSecret, param: [param] }) });
    } catch { throw new ErpError("Não foi possível falar com o Omie. Tentaremos de novo."); }
    const b = (await res.json().catch(() => ({}))) as T & { faultstring?: string; faultcode?: string };
    if (b.faultstring || !res.ok) {
      const msg = b.faultstring ?? `erro ${res.status}`;
      throw new ErpError(`Omie: ${msg}`, /app_key|app_secret|chave de acesso|não autorizad/i.test(msg) || res.status === 401 || res.status === 403);
    }
    return b;
  }
  return {
    async verificar() {
      const r = await chamar<{ empresas_cadastro?: { nome_fantasia?: string; razao_social?: string }[] }>("geral/empresas", "ListarEmpresas", { pagina: 1, registros_por_pagina: 1, apenas_importado_api: "N" });
      const e = r.empresas_cadastro?.[0];
      return { conta: e?.nome_fantasia || e?.razao_social || "conta Omie" };
    },
    async enviarPedido(p) {
      // O cliente é criado ou atualizado pelo e-mail (código de integração estável), depois o pedido de venda.
      const cli = await chamar<{ codigo_cliente_omie?: number }>("geral/clientes", "UpsertCliente", {
        codigo_cliente_integracao: `loja:${p.cliente.email.toLowerCase()}`.slice(0, 60), razao_social: p.cliente.nome, nome_fantasia: p.cliente.nome, email: p.cliente.email,
        telefone1_numero: p.cliente.telefone ?? "", endereco: p.cliente.endereco ?? "", cidade: p.cliente.cidade ?? "", estado: p.cliente.uf ?? "", cep: p.cliente.cep ?? "",
      });
      if (!cli.codigo_cliente_omie) throw new ErpError("Omie não devolveu o código do cliente.");
      const r = await chamar<{ codigo_pedido?: number; numero_pedido?: string }>("produtos/pedido", "IncluirPedido", {
        cabecalho: { codigo_cliente: cli.codigo_cliente_omie, codigo_pedido_integracao: p.id, data_previsao: dataBR(new Date(p.dataIso)), etapa: "10", codigo_parcela: "000", quantidade_itens: p.itens.length },
        det: p.itens.map((i, n) => ({ ide: { codigo_item_integracao: String(n + 1) }, produto: { codigo: i.sku, descricao: i.nome, quantidade: i.quantidade, valor_unitario: reais(i.valorCents), unidade: "UN" } })),
        frete: { valor_frete: reais(p.freteCents), modalidade: "0" },
        observacoes: { obs_venda: `Pedido ${p.numero} da loja virtual (pago).` },
      });
      if (!r.codigo_pedido && !r.numero_pedido) throw new ErpError("Omie não devolveu o número do pedido.");
      return { externoId: String(r.numero_pedido ?? r.codigo_pedido) };
    },
    async estoque() {
      // O Omie não lista "o que mudou": lemos a posição de hoje, página a página.
      const out: SaldoErp[] = [];
      for (let pagina = 1; pagina <= 20; pagina++) {
        const r = await chamar<{ nTotPaginas?: number; produtos?: { cCodigo?: string; nSaldo?: unknown; reservado?: unknown }[] }>("estoque/consulta", "ListarPosEstoque", { nPagina: pagina, nRegPorPagina: 500, dDataPosicao: dataBR(new Date()), cExibeTodos: "N" });
        for (const x of r.produtos ?? []) { const s = Number(x.nSaldo), res = Number(x.reservado ?? 0); if (x.cCodigo && Number.isFinite(s)) out.push({ sku: x.cCodigo, saldo: Math.floor(s - (Number.isFinite(res) ? res : 0)) }); }
        if (pagina >= Number(r.nTotPaginas ?? 1)) break;
      }
      return out;
    },
  };
}
