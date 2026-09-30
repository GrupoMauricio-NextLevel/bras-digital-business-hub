import { cn } from "@/lib/utils";

type Props = {
  /** `full` = símbolo + nome; `mark` = só o símbolo. */
  variant?: "full" | "mark";
  /** `auto` acompanha o tema; `on-dark`/`on-light` fixam a versão para fundos que não mudam de cor. */
  tone?: "auto" | "on-dark" | "on-light";
  /** Altura via classe (ex.: `h-8`); a largura acompanha. */
  className?: string;
  alt?: string;
};

const FILES = {
  full: { light: { src: "/brand/superdrop-logo-light.png", w: 900, h: 228 }, dark: { src: "/brand/superdrop-logo-dark.png", w: 900, h: 224 } },
  mark: { light: { src: "/brand/superdrop-mark.png", w: 479, h: 512 }, dark: { src: "/brand/superdrop-mark-dark.png", w: 484, h: 512 } },
} as const;

/** Logo da SuperDrop. A versão escura (texto branco) vale para fundos escuros; a clara (texto preto) para fundos claros. */
export function Logo({ variant = "full", tone = "auto", className, alt = "SuperDrop" }: Props) {
  const f = FILES[variant];
  const img = (v: "light" | "dark", extra: string, a: string) => (
    // eslint-disable-next-line @next/next/no-img-element -- arquivo estático pequeno, sem otimização necessária
    <img src={f[v].src} width={f[v].w} height={f[v].h} alt={a} className={cn("w-auto", className, extra)} decoding="async" />
  );
  if (tone === "on-dark") return img("dark", "", alt);
  if (tone === "on-light") return img("light", "", alt);
  return <>{img("light", "nl-logo-light", alt)}{img("dark", "nl-logo-dark", "")}</>;
}
