/**
 * Onde o Brás Digital Club existe (decisão do dono, 19/10/2026, R3): os pontos são do Brás Digital Club e só aparecem
 * na Brás Digital e na NextLevel Cargas. E-commerce, SuperDrop e o site do grupo não falam de Club nem de pontos.
 */
export const MARCAS_CLUB = ["BRAS_DIGITAL", "NEXTLEVEL_CARGAS"] as const;
export const clubNaMarca = (brandCode: string | null | undefined) => (MARCAS_CLUB as readonly string[]).includes(brandCode ?? "");
