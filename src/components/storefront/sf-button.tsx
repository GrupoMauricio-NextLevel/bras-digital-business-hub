import * as React from "react";
import { cn } from "@/lib/utils";

export function SfButton({ className, variant = "primary", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "accent" | "outline" }) {
  const style = variant === "primary" ? { background: "var(--sf-primary)", color: "var(--sf-on-primary)" } : variant === "accent" ? { background: "var(--sf-accent)", color: "var(--sf-on-accent)" } : undefined;
  return <button className={cn("inline-flex h-11 items-center justify-center gap-2 rounded-lg px-5 text-sm font-medium transition-all hover:brightness-95 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50", variant === "outline" && "border border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-50", className)} style={style} {...props} />;
}
