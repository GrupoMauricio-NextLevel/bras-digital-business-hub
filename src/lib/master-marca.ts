import type { BrandCode } from "@/lib/brand";

/**
 * Seletor de marca do Master único (R2, decisão do dono 19/10): um Master só, com a escolha "ver tudo" ou uma marca.
 * A escolha fica num cookie e vale para o menu e para o filtro padrão das listas (lojas, clientes, escritório).
 */
export const MASTER_MARCA_COOKIE = "nl-master-marca";
export const MASTER_MARCAS = [
  { code: "NEXTLEVEL_COMMERCE", nome: "Commerce" },
  { code: "SUPERDROP", nome: "SuperDrop" },
  { code: "BRAS_DIGITAL", nome: "Brás Digital Club" },
  { code: "NEXTLEVEL_CARGAS", nome: "Cargas" },
] as const satisfies readonly { code: BrandCode; nome: string }[];
export type MarcaMaster = (typeof MASTER_MARCAS)[number]["code"];
export const ehMarcaMaster = (v: unknown): v is MarcaMaster => MASTER_MARCAS.some((m) => m.code === v);

/**
 * Marcas abertas no Master (D200, dono: "vamos trancar as marcas e falar só da Commerce"). Padrão: só a Commerce.
 * Para destravar, o Render recebe `MASTER_MARCAS_ATIVAS=NEXTLEVEL_COMMERCE,SUPERDROP` (nada é apagado ao trancar).
 */
export function marcasAtivasNoMaster(env: Record<string, string | undefined> = process.env): MarcaMaster[] {
  const lista = (env.MASTER_MARCAS_ATIVAS ?? "NEXTLEVEL_COMMERCE").split(",").map((s) => s.trim()).filter(ehMarcaMaster);
  return lista.length ? lista : ["NEXTLEVEL_COMMERCE"];
}
