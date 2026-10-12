import { statSync } from "node:fs";
import { join } from "node:path";
import type { BrandCode } from "@/lib/brand";

/**
 * Foto da tela de entrada: só fotos de direção de arte da PRÓPRIA marca (manifestos em public/portal/<marca>/v3).
 * Cada marca tem uma lista em ordem de preferência; vale o primeiro arquivo que existir (arquivo vazio não conta).
 * Marca sem foto aprovada (NextLevel Cargas, marcas "em breve") entra com o fundo na cor da marca, sem foto:
 * foto de outra marca ou de loja de demonstração não serve (decisão do dono, 2026-10-09). O Master (NEXTLEVEL) ganhou
 * foto própria na auditoria geral de imagens (2026-10-12).
 */
export type AuthPhoto = { src: string; alt: string; position: string };
const LOGIN_PHOTOS: Partial<Record<BrandCode, AuthPhoto[]>> = {
  SUPERDROP: [
    { src: "/portal/superdrop/v3/sd-login-lateral.webp", alt: "", position: "50% 45%" },
    { src: "/portal/superdrop/v3/sd-lojista-home-office.webp", alt: "", position: "60% 45%" },
  ],
  NEXTLEVEL_COMMERCE: [
    { src: "/portal/commerce/v3/cm-login-lateral.webp", alt: "", position: "50% 45%" },
    { src: "/portal/commerce/v3/cm-dono-gestao.webp", alt: "", position: "48% 40%" },
  ],
  BRAS_DIGITAL: [{ src: "/portal/bras/v3/bd-cadastro-lateral.webp", alt: "", position: "50% 40%" }],
  NEXTLEVEL: [{ src: "/portal/nextlevel/v3/nl-login-lateral.webp", alt: "", position: "50% 45%" }],
};

const existe = (src: string) => { try { return statSync(join(process.cwd(), "public", src)).size > 0; } catch { return false; } };

export function loginPhotoFor(code: BrandCode): AuthPhoto | null {
  return (LOGIN_PHOTOS[code] ?? []).find((p) => existe(p.src)) ?? null;
}
