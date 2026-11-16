"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/db/client";
import { getSession } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { assertStoreAdmin, requireStoreId } from "@/lib/domain/access";
import { ForbiddenError } from "@/lib/domain/errors";
import { requireModulo } from "@/lib/business/modulos";
import { arquivarPagina, criarPagina, editarPagina, editarPaginaSchema, novaPaginaSchema } from "@/lib/business/paginas";
import { criarServico, editarServico, servicoSchema } from "@/lib/business/servicos";
import { aplicarModeloDoSite, MODELOS_SITE, modeloDoSite, type ModeloSite } from "@/lib/business/modelos-site";

/**
 * Ações do site da empresa (NextLevel Business, NB2, D307). Só o dono do negócio, só com o módulo Site ligado
 * (o servidor confere: menu escondido não basta). Regras em `src/lib/business/*`.
 */
async function ctx() {
  const session = await getSession();
  if (!session) throw new ForbiddenError("Sessão expirada.");
  assertStoreAdmin(session.actor);
  const storeId = requireStoreId(session.actor);
  const db = await getDb();
  await requireModulo(db, session.actor, "site");
  return { session, storeId, db };
}
const refrescar = (slug?: string) => { revalidatePath("/merchant/site", "layout"); if (slug) revalidatePath(`/store/${slug}`, "layout"); };
const idPagina = z.string().regex(/^pag_[a-z0-9]+$/i);
const idServico = z.string().regex(/^svn_[a-z0-9]+$/i);
const modelo = z.enum(Object.keys(MODELOS_SITE) as [ModeloSite, ...ModeloSite[]]);

/** Página nova, em branco ou com o conteúdo de uma página de um modelo (fica em rascunho; abre no editor). */
export async function criarPaginaAction(input: z.input<typeof novaPaginaSchema> & { modelo?: string; base?: string }) {
  return runAction(async () => {
    const { session, storeId, db } = await ctx();
    const m = input.modelo ? modelo.parse(input.modelo) : null;
    const base = m ? modeloDoSite(m, session.store?.name ?? "").paginas.find((p) => p.slug === input.base)?.modelo : undefined;
    const r = await criarPagina(db, session.actor, storeId, { titulo: input.titulo, slug: input.slug, tipo: input.tipo, noMenu: input.noMenu }, base);
    refrescar(session.store?.slug);
    return r;
  });
}
export async function editarPaginaAction(id: string, input: z.input<typeof editarPaginaSchema>) {
  return runAction(async () => { const { session, storeId, db } = await ctx(); await editarPagina(db, session.actor, storeId, idPagina.parse(id), input); refrescar(session.store?.slug); return undefined; });
}
export async function arquivarPaginaAction(id: string, arquivar: boolean) {
  return runAction(async () => { const { session, storeId, db } = await ctx(); await arquivarPagina(db, session.actor, storeId, idPagina.parse(id), z.boolean().parse(arquivar)); refrescar(session.store?.slug); return undefined; });
}
/** Aplica um modelo pronto em rascunho (início trocado vai para o histórico; páginas que já existem ficam como estão). */
export async function aplicarModeloAction(m: string) {
  return runAction(async () => {
    const { session, storeId, db } = await ctx();
    const r = await aplicarModeloDoSite(db, session.actor, storeId, modelo.parse(m), session.store?.name ?? "");
    refrescar(session.store?.slug);
    return r;
  });
}

export async function criarServicoAction(input: z.input<typeof servicoSchema>) {
  return runAction(async () => { const { session, storeId, db } = await ctx(); const r = await criarServico(db, session.actor, storeId, input); refrescar(session.store?.slug); return r; });
}
export async function editarServicoAction(id: string, input: z.input<typeof servicoSchema>) {
  return runAction(async () => { const { session, storeId, db } = await ctx(); await editarServico(db, session.actor, storeId, idServico.parse(id), input); refrescar(session.store?.slug); return undefined; });
}
