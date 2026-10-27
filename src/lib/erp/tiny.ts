import type { FetchLike } from "@/lib/payments/mercadopago";
import { timeoutSignal } from "@/lib/http-timeout";
import { dataBR, ErpError, reais, type ErpCliente, type SaldoErp } from "./tipos";

/**
 * Tiny / Olist ERP, API v2 (Rodada C, D191; PRECISA VALIDAR com token real): cada chamada é um POST de formulário com
 * token e formato=json; a resposta vem em { retorno: { status: "OK" | "Erro", erros?: [{ erro }] , ... } }.
 */
export const TINY_BASE = process.env.ERP_TINY_BASE ?? "https://api.tiny.com.br/api2";
type Retorno = { status?: string; codigo_erro?: string | number; erros?: { erro?: string }[] } & Record<string, unknown>;

export function tinyErp(token: string, fetchImpl: FetchLike = fetch, base = TINY_BASE): ErpCliente {
  async function chamar(metodo: string, params: Record<string, string> = {}): Promise<Retorno> {
    let res: Response;
    try {
      res = await fetchImpl(`${base}/${metodo}`, { method: "POST", signal: timeoutSignal(), headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" }, body: new URLSearchParams({ token, formato: "json", ...params }).toString() });
    } catch { throw new ErpError("Não foi possível falar com o Tiny. Tentaremos de novo."); }
    if (!res.ok) throw new ErpError(`O Tiny respondeu com erro (${res.status}).`);
    const r = (((await res.json().catch(() => ({}))) as { retorno?: Retorno }).retorno ?? {}) as Retorno;
    if (r.status !== "OK") {
      const msg = r.erros?.map((e) => e.erro).filter(Boolean).join(" ") || "erro sem descrição";
      // Código 2: token inválido ou não informado.
      throw new ErpError(`Tiny: ${msg}`, String(r.codigo_erro) === "2" || /token/i.test(msg));
    }
    return r;
  }
  return {
    async verificar() {
      const r = await chamar("info.php");
      const conta = r.conta as { razao_social?: string; fantasia?: string } | undefined;
      return { conta: conta?.fantasia || conta?.razao_social || "conta Tiny" };
    },
    async enviarPedido(p) {
      const pedido = {
        pedido: {
          data_pedido: dataBR(new Date(p.dataIso)), numero_pedido_ecommerce: String(p.numero),
          cliente: { nome: p.cliente.nome, email: p.cliente.email, fone: p.cliente.telefone ?? "", endereco: p.cliente.endereco ?? "", cidade: p.cliente.cidade ?? "", uf: p.cliente.uf ?? "", cep: p.cliente.cep ?? "" },
          itens: p.itens.map((i) => ({ item: { codigo: i.sku, descricao: i.nome, unidade: "UN", quantidade: i.quantidade, valor_unitario: reais(i.valorCents) } })),
          valor_frete: reais(p.freteCents), valor_desconto: reais(p.descontoCents), forma_envio: p.servicoFrete ?? "",
          obs: `Pedido ${p.numero} da loja virtual (pago).`,
        },
      };
      const r = await chamar("pedido.incluir.php", { pedido: JSON.stringify(pedido) });
      const reg = (r.registros as { registro?: { id?: string | number; numero?: string | number; status?: string; erros?: { erro?: string }[] } }[] | undefined)?.[0]?.registro;
      if (!reg?.id) throw new ErpError(`Tiny não criou o pedido: ${reg?.erros?.map((e) => e.erro).join(" ") || "sem número"}.`);
      return { externoId: String(reg.numero ?? reg.id) };
    },
    async estoque(desde) {
      // O Tiny só lista mudanças dos últimos 30 dias: sem data, pedimos os últimos 29.
      const data = dataBR(desde ?? new Date(Date.now() - 29 * 86400_000), true);
      const out: SaldoErp[] = [];
      for (let pagina = 1; pagina <= 20; pagina++) {
        let r: Retorno;
        try { r = await chamar("lista.atualizacoes.estoque.php", { dataAlteracao: data, pagina: String(pagina) }); }
        catch (e) { if (e instanceof ErpError && /não retornou registros|nenhum registro/i.test(e.message)) break; throw e; }
        for (const x of (r.produtos as { produto?: { codigo?: string; saldo?: unknown; saldoReservado?: unknown } }[] | undefined) ?? []) {
          const saldo = Number(x.produto?.saldo), reservado = Number(x.produto?.saldoReservado ?? 0);
          if (x.produto?.codigo && Number.isFinite(saldo)) out.push({ sku: x.produto.codigo, saldo: Math.floor(saldo - (Number.isFinite(reservado) ? reservado : 0)) });
        }
        if (pagina >= Number(r.numero_paginas ?? 1)) break;
      }
      return out;
    },
  };
}
