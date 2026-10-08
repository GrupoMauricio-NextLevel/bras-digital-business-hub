/**
 * Política comercial da Brás Digital (operação fechada, D5 do prompt mestre e seção 6.2).
 * Preço, estoque, nome da importadora e vídeo completo só saem do servidor para membro autenticado E aprovado.
 * Funções puras: servem a páginas, ações, rotas de API e testes. Toda futura consulta de catálogo da Brás
 * deve devolver o resultado por `projectBrasCommercial`, nunca o registro bruto.
 */
export type BrasCommercialAccess = { authenticated: boolean; approvedMember: boolean };

export function canViewBrasCommercialData(access: BrasCommercialAccess): boolean {
  return access.authenticated && access.approvedMember;
}

/** Ninguém vê dado comercial: estado de partida enquanto não existir sessão nem aprovação. */
export const BRAS_NO_COMMERCIAL_ACCESS: BrasCommercialAccess = Object.freeze({ authenticated: false, approvedMember: false });

/**
 * Acesso só pela sessão, sem consultar o banco: falha fechada (ninguém é tratado como membro ativo).
 * Para liberar preço e estoque use `brasCommercialAccessFor` (src/lib/domain/bras/membros.ts), que lê o status
 * do membro no banco (D92), nunca de cookie, parâmetro ou corpo da requisição.
 */
export function brasCommercialAccessFromSession(session: { user: { id: string } } | null | undefined): BrasCommercialAccess {
  return { authenticated: !!session?.user?.id, approvedMember: false };
}

/** Campos que só o membro aprovado recebe. */
export const BRAS_COMMERCIAL_FIELDS = ["priceCents", "stockBoxes", "importerId", "importerName", "fullVideoUrl"] as const;
export type BrasCommercialField = (typeof BRAS_COMMERCIAL_FIELDS)[number];

/**
 * Campos que visitante e membro não aprovado podem receber. Lista de permissão (não de proibição):
 * campo novo no registro não vaza por esquecimento. Os vídeos públicos de análise (D92) vêm de `bd_videos`, que não guarda preço nem importadora.
 */
export const BRAS_LOCKED_FIELDS = ["id", "title"] as const;
export type BrasLockedField = (typeof BRAS_LOCKED_FIELDS)[number];

export type BrasItemRecord = { id: string; title: string } & Partial<Record<BrasCommercialField, unknown>> & Record<string, unknown>;
export type BrasLockedView = { id: string; title: string; locked: true };
export type BrasOpenView<T> = T & { locked: false };

/** Projeção na fronteira de dados: aprovado recebe o registro; os demais só os campos da lista de permissão. */
export function projectBrasCommercial<T extends BrasItemRecord>(record: T, access: BrasCommercialAccess): BrasOpenView<T> | BrasLockedView {
  if (canViewBrasCommercialData(access)) return { ...record, locked: false };
  return { id: record.id, title: record.title, locked: true };
}

export function projectBrasCommercialList<T extends BrasItemRecord>(records: T[], access: BrasCommercialAccess): (BrasOpenView<T> | BrasLockedView)[] {
  return records.map((r) => projectBrasCommercial(r, access));
}
