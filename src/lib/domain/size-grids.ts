/** Modelos de grade de tamanhos (D328): camisa, calçado, calça, infantil, tamanho único e livre. Todos editáveis depois do cadastro. */
export const SIZE_GRID_KEYS = ["ADULT_MALE", "ADULT_FEMALE", "KIDS", "SHOES", "PANTS", "UNIQUE", "CUSTOM"] as const;
export type SizeGridKey = (typeof SIZE_GRID_KEYS)[number];

export const SIZE_GRIDS: Record<SizeGridKey, { label: string; short: string; sizes: string[] }> = {
  ADULT_MALE: { label: "Adulto masculino", short: "Masculino", sizes: ["P", "M", "G", "GG", "XX1", "2XL"] },
  ADULT_FEMALE: { label: "Adulto feminino", short: "Feminino", sizes: ["P", "M", "G", "GG", "XX1", "2XL"] },
  KIDS: { label: "Conjunto infantil", short: "Infantil", sizes: ["18", "20", "22", "24", "26", "28"] },
  SHOES: { label: "Calçado", short: "Calçado", sizes: ["33", "34", "35", "36", "37", "38", "39", "40", "41", "42", "43", "44"] },
  PANTS: { label: "Calça (numeração)", short: "Calça", sizes: ["36", "38", "40", "42", "44", "46", "48"] },
  UNIQUE: { label: "Tamanho único", short: "Único", sizes: ["ÚNICO"] },
  CUSTOM: { label: "Personalizada", short: "Personalizada", sizes: [] },
};

/** Aceita "masculino", "fem", "infantil", "kids"... (planilha) e devolve a chave da grade. */
export function parseSizeGrid(raw: string | undefined | null): SizeGridKey | null {
  const v = (raw ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();
  if (!v) return null;
  if (/^(m|masc|masculino|adulto masculino|adulto_masculino|homem)$/.test(v)) return "ADULT_MALE";
  if (/^(f|fem|feminino|adulto feminino|adulto_feminino|mulher|baby ?look)$/.test(v)) return "ADULT_FEMALE";
  if (/^(i|inf|infantil|kids|crianca|conjunto infantil|conjunto_infantil)$/.test(v)) return "KIDS";
  if (/^(calcado|calcados|sapato|sapatos|tenis|sandalia|shoes)$/.test(v)) return "SHOES";
  if (/^(calca|calcas|numeracao|pants|jeans)$/.test(v)) return "PANTS";
  if (/^(unico|tamanho unico|u|un)$/.test(v)) return "UNIQUE";
  if (/^(personalizada|custom|outro|livre)$/.test(v)) return "CUSTOM";
  return null;
}

/** Estoque mínimo por tamanho para as lojas poderem ativar o produto. */
export type ActivationCheck = { ok: boolean; min: number; short: { size: string; available: number }[] };
export function activationCheck(variants: { size: string; available: number }[], min: number): ActivationCheck {
  const short = variants.filter((v) => v.available < min).map((v) => ({ size: v.size, available: v.available }));
  return { ok: variants.length > 0 && short.length === 0, min, short };
}
