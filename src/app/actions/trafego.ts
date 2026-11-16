"use server";
import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { getDb } from "@/db/client";
import { getSession } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { ForbiddenError } from "@/lib/domain/errors";
import { alterarLink, criarLink, type linkSchema } from "@/lib/domain/trafego/links";

async function ator() {
  const s = await getSession();
  if (!s) throw new ForbiddenError("Sessão expirada.");
  return s.actor;
}

/** Links rastreados (TR1, D290). */
export async function criarLinkAction(input: z.input<typeof linkSchema>) {
  return runAction(async () => {
    const r = await criarLink(await getDb(), await ator(), input);
    revalidatePath("/master/trafego/links");
    return r;
  });
}

export async function alterarLinkAction(id: string, patch: { ativo?: boolean; destino?: string; nota?: string | null }) {
  return runAction(async () => {
    await alterarLink(await getDb(), await ator(), id, patch);
    revalidatePath("/master/trafego/links");
    return undefined;
  });
}

/** "Agora no site" (TR2, D291): a tela pede de novo a cada 10 s enquanto está aberta. */
export async function agoraNoSiteAction() {
  return runAction(async () => {
    const { agoraNoSite } = await import("@/lib/domain/trafego/coletor");
    return agoraNoSite(await getDb(), await ator());
  });
}

/** Números do Pixel da Meta e do Google no site da NextLevel (TR4, D295). */
export async function salvarTagsAnuncioAction(input: unknown) {
  return runAction(async () => {
    const { salvarTagsAnuncio } = await import("@/lib/domain/trafego/tags");
    const r = await salvarTagsAnuncio(await getDb(), await ator(), input as never);
    revalidatePath("/", "layout");
    return r;
  });
}

/** Retorno às plataformas (TR5, D298): tokens e números da Meta e do Google (só o dono). */
export async function salvarConfigRetornoAction(input: unknown) {
  return runAction(async () => {
    const { salvarConfigRetorno } = await import("@/lib/domain/trafego/retorno");
    const r = await salvarConfigRetorno(await getDb(), await ator(), input as never);
    revalidatePath("/master/trafego/retorno");
    return r;
  });
}

export async function reenviarConversaoAction(id: string) {
  return runAction(async () => {
    const { reenviarConversao } = await import("@/lib/domain/trafego/retorno");
    await reenviarConversao(await getDb(), await ator(), id);
    revalidatePath("/master/trafego/retorno");
    return undefined;
  });
}

/** TR6 (D302): lê a Meta agora (sem esperar a rotina de 1 hora). */
export async function atualizarLeituraMetaAction() {
  return runAction(async () => {
    const s = await ator();
    const { requireMasterFn } = await import("@/lib/domain/access");
    requireMasterFn(s, ["COMERCIAL"]);
    const { sincronizarMeta } = await import("@/lib/domain/trafego/meta-leitura");
    const r = await sincronizarMeta(await getDb(), fetch, new Date(), { forcar: true });
    revalidatePath("/master/trafego/campanhas");
    return r;
  });
}
