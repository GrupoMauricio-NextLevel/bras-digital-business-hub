import type { BrandCode } from "@/lib/brand";

/** Fotos provisórias do acervo da Commerce (Unsplash License, ver docs/design/HOME-COMMERCE-V1.md). Trocar pelas fotos de direção de arte quando existirem. */
export const AUTH_PHOTO: Record<"login" | "partner", { src: string; alt: string; position: string }> = {
  login: { src: "/portal/commerce/moda-hero.webp", alt: "", position: "center top" },
  partner: { src: "/portal/commerce/ace-hero.webp", alt: "", position: "center 40%" },
};

/** SuperDrop entra com foto de ambiente; as demais marcas usam a foto de moda. */
export function loginPhotoFor(code: BrandCode) {
  return code === "SUPERDROP" ? { src: "/portal/commerce/casa-hero.webp", alt: "", position: "center 45%" } : AUTH_PHOTO.login;
}
