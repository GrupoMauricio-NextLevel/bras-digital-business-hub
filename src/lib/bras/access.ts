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
 * Acesso a partir da sessão do servidor. Ainda NÃO existe modelo de membro aprovado (pendência do dono:
 * modelo B2B, CNPJ e aprovação), então ninguém é tratado como aprovado: falha fechada.
 * Quando o modelo existir, a aprovação deve vir do banco (status do membro), nunca de cookie, parâmetro ou corpo da requisição.
 */
export function brasCommercialAccessFromSession(session: { user: { id: string } } | null | undefined): BrasCommercialAccess {
  return { authenticated: !!session?.user?.id, approvedMember: false };
}

/** Campos que só o membro aprovado recebe. */
export const BRAS_COMMERCIAL_FIELDS = ["priceCents", "stockBoxes", "importerId", "importerName", "fullVideoUrl"] as const;
export type BrasCommercialField = (typeof BRAS_COMMERCIAL_FIELDS)[number];

/**
 * Campos que visitante e membro não aprovado podem receber. Lista de permissão (não de proibição):
 * campo novo no registro não vaza por esquecimento. Prévia de vídeo/capa fica de fora até decisão do dono.
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
