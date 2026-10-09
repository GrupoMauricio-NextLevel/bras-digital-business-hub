/** Rótulos da NextLevel Cargas (D108). Puro: serve o formulário (cliente) e o domínio (servidor). */
export const CARGAS_KINDS = ["TRANSPORTADORA", "AUTONOMO", "IMPORTADORA"] as const;
export const CARGAS_KIND_LABEL: Record<(typeof CARGAS_KINDS)[number], string> = { TRANSPORTADORA: "Transportadora (CNPJ)", AUTONOMO: "Autônomo (CPF)", IMPORTADORA: "Importadora" };
export const CARGAS_VEHICLES = ["UTILITARIO", "VAN", "TOCO", "TRUCK", "CARRETA"] as const;
export const CARGAS_VEHICLE_LABEL: Record<(typeof CARGAS_VEHICLES)[number], string> = { UTILITARIO: "Utilitário", VAN: "Van", TOCO: "Caminhão toco", TRUCK: "Truck", CARRETA: "Carreta" };
