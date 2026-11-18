"use server";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { getSession } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { requireMaster } from "@/lib/domain/access";
import { ForbiddenError } from "@/lib/domain/errors";
import { liberarTemaPelaEquipe, type LiberarTemaInput } from "@/lib/themes/liberar-equipe";

const atualizar = (slug: string) => { revalidatePath(`/store/${slug}`, "layout"); revalidatePath("/merchant", "layout"); revalidatePath("/master", "layout"); revalidatePath("/theme-editor"); };

/** Master: libera um tema pago (ou a Edição completa) para qualquer loja, sem custo ou com o pagamento recebido por fora. */
export async function liberarTemaMasterAction(storeId: string, input: LiberarTemaInput) {
  return runAction(async () => {
    const s = await getSession();
    if (!s) throw new ForbiddenError("Sessão expirada.");
    requireMaster(s.actor);
    if (s.support) throw new ForbiddenError("Saia do modo suporte para usar o Master.");
    const db = await getDb();
    const r = await liberarTemaPelaEquipe(db, { ...input, storeId, operatorId: s.user.id, operatorName: s.user.name });
    const store = await db.query.stores.findFirst({ where: (t, { eq }) => eq(t.id, storeId), columns: { slug: true } });
    if (store) atualizar(store.slug);
    return r;
  });
}

/** Modo suporte (agindo em nome do cliente): a mesma liberação, feita na tela de temas do lojista pelo operador do Master. */
export async function liberarTemaSuporteAction(input: LiberarTemaInput) {
  return runAction(async () => {
    const s = await getSession();
    // getSession só devolve `support` quando a permissão assinada é válida e o operador ainda é Master.
    if (!s?.support || !s.store) throw new ForbiddenError("Só a equipe NextLevel, agindo em nome do cliente, pode liberar temas.");
    if (!s.support.act) throw new ForbiddenError("O modo suporte está só para ver. Peça acesso para agir em nome do cliente.");
    const r = await liberarTemaPelaEquipe(await getDb(), { ...input, storeId: s.store.id, operatorId: s.support.operatorId, operatorName: s.support.operatorName });
    atualizar(s.store.slug);
    return r;
  });
}
