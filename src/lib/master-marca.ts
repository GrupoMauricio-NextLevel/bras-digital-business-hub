import type { BrandCode } from "@/lib/brand";

/**
 * Seletor de marca do Master único (R2, decisão do dono 19/10): um Master só, com a escolha "ver tudo" ou uma marca.
 * A escolha fica num cookie e vale para o menu e para o filtro padrão das listas (lojas, clientes, escritório).
 */
export const MASTER_MARCA_COOKIE = "nl-master-marca";
export const MASTER_MARCAS = [
  { code: "NEXTLEVEL_COMMERCE", nome: "E-commerce" },
  { code: "SUPERDROP", nome: "SuperDrop" },
  { code: "BRAS_DIGITAL", nome: "Brás Digital Club" },
  { code: "NEXTLEVEL_CARGAS", nome: "Cargas" },
] as const satisfies readonly { code: BrandCode; nome: string }[];
export type MarcaMaster = (typeof MASTER_MARCAS)[number]["code"];
export const ehMarcaMaster = (v: unknown): v is MarcaMaster => MASTER_MARCAS.some((m) => m.code === v);
