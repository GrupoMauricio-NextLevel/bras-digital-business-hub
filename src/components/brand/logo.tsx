import { cn } from "@/lib/utils";

type Props = {
  /** `full` = símbolo + nome; `mark` = só o símbolo. */
  variant?: "full" | "mark";
  /** `auto` acompanha o tema; `on-dark`/`on-light` fixam a versão para fundos que não mudam de cor. */
  tone?: "auto" | "on-dark" | "on-light";
  /** Altura via classe (ex.: `h-8`); a largura acompanha. */
  className?: string;
  alt?: string;
  /** Logo visível na primeira tela: carrega já (as demais só quando aparecem). */
  priority?: boolean;
};

const FILES = {
  full: { light: { src: "/brand/superdrop-logo-light.webp", w: 480, h: 122 }, dark: { src: "/brand/superdrop-logo-dark.webp", w: 480, h: 119 } },
  mark: { light: { src: "/brand/superdrop-mark.webp", w: 240, h: 256 }, dark: { src: "/brand/superdrop-mark-dark.webp", w: 251, h: 256 } },
} as const;

/** Logo da SuperDrop. A versão escura (texto branco) vale para fundos escuros; a clara (texto preto) para fundos claros. */
export function Logo({ variant = "full", tone = "auto", className, alt = "SuperDrop", priority = false }: Props) {
  const f = FILES[variant];
  const img = (v: "light" | "dark", extra: string, a: string) => (
    // eslint-disable-next-line @next/next/no-img-element -- arquivo estático pequeno, sem otimização necessária
    <img src={f[v].src} width={f[v].w} height={f[v].h} alt={a} className={cn("w-auto", className, extra)} decoding="async" loading={priority ? "eager" : "lazy"} />
  );
  if (tone === "on-dark") return img("dark", "", alt);
  if (tone === "on-light") return img("light", "", alt);
  // As duas versões existem no HTML, mas o navegador não baixa a que está escondida (carregamento tardio).
  return <>{img("light", "nl-logo-light", alt)}{img("dark", "nl-logo-dark", "")}</>;
}
