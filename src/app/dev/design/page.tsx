import { notFound } from "next/navigation";
import { THEME_KEYS, THEME_INPUTS } from "@/design-system/themes";
import { GalleryFrame } from "./gallery-frame";

export const metadata = { title: "Galeria do sistema de design" };

/** Galeria: escolhe tema, modo e largura e mostra a amostra de componentes em um quadro com a largura real (os breakpoints respondem de verdade). */
export default function DesignGalleryPage() {
  if (process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_DEMO_MODE !== "true") notFound();
  return <GalleryFrame themes={THEME_KEYS.map((k) => ({ key: k, label: THEME_INPUTS[k].label }))} />;
}
