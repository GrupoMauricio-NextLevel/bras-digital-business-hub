/**
 * Marca da casa: empresa do próprio grupo que compra das importadoras e vende como vendedora.
 * Fonte única dos dados cadastrais da Mega Tron; telas, seed e provisionamento leem daqui.
 * Regras de sigilo e o desenho dos dois painéis: docs/MEGATRON.md.
 */

export type CompanyProfile = {
  legalName: string;
  tradeName: string;
  /** CNPJ só com dígitos. */
  taxId: string;
  stateRegistration: string;
  stateRegistrationUf: string;
  /** AAAA-MM-DD */
  foundedOn: string;
  mainActivity: string;
  registrationStatus: string;
  city: string;
  state: string;
};

export type HouseBrand = CompanyProfile & {
  /** Nome curto exibido nas telas (vendedor, remetente, assinatura). */
  displayName: string;
  orgSlug: string;
  supplierSlug: string;
};

export const MEGATRON: HouseBrand = {
  legalName: "MEGA TRON COMERCIO ELETRONICO LTDA - ME",
  tradeName: "MEGA TRON BRASIL",
  taxId: "50922728000149",
  stateRegistration: "121.681.071.11",
  stateRegistrationUf: "SP",
  foundedOn: "2023-06-02",
  mainActivity: "Comércio varejista especializado de eletrodomésticos e equipamentos de áudio e vídeo",
  registrationStatus: "Ativa",
  city: "São Paulo",
  state: "SP",
  displayName: "Mega Tron",
  orgSlug: "mega-tron",
  supplierSlug: "megatron",
};

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/** Valida os dois dígitos verificadores do CNPJ (aceita com ou sem máscara). */
export function isValidCnpj(value: string): boolean {
  const d = onlyDigits(value);
  if (d.length !== 14 || /^(\d)\1{13}$/.test(d)) return false;
  const digit = (len: number) => {
    const weights = len === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const sum = weights.reduce((acc, w, i) => acc + w * Number(d[i]), 0);
    const r = sum % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return digit(12) === Number(d[12]) && digit(13) === Number(d[13]);
}

export function formatCnpj(value: string): string {
  const d = onlyDigits(value);
  if (d.length !== 14) return value;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

/** "2023-06-02" → "02/06/2023" */
export function formatDateBr(isoDate: string): string {
  const [y, m, d] = isoDate.split("-");
  return y && m && d ? `${d}/${m}/${y}` : isoDate;
}
