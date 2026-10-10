/** Rótulos das empresas do grupo (D112). Puro: serve a tela (cliente) e o domínio (servidor). */
export const GROUP_ROLES = ["TRANSPORTE", "ATACADO", "TECNOLOGIA", "OUTRO"] as const;
export const GROUP_ROLE_LABEL: Record<(typeof GROUP_ROLES)[number], string> = { TRANSPORTE: "Transporte de carga e excursão", ATACADO: "Atacado, distribuição e importação", TECNOLOGIA: "Marcas e sistemas", OUTRO: "Outra atividade" };
