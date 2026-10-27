"use client";
import * as React from "react";
import { marcarImpressoAction } from "@/app/actions/orders";

/** Abrir a folha de impressão marca o pedido como impresso (D184). Roda só no navegador, nunca numa pré-busca do link. */
export function MarcarImpresso({ orderId }: { orderId: string }) {
  React.useEffect(() => { void marcarImpressoAction(orderId); }, [orderId]);
  return null;
}
