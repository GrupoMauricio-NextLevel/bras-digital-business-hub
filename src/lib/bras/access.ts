/** Dados comerciais da Brás são fechados até que exista sessão de membro aprovada. */
export type BrasCommercialAccess = { authenticated: boolean; approvedMember: boolean };

export function canViewBrasCommercialData(access: BrasCommercialAccess): boolean {
  return access.authenticated && access.approvedMember;
}
