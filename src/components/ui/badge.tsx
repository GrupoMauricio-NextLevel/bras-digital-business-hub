import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/** Pill do sistema de design (.ds-pill). A cor do estado vem do tema; "brand" usa a cor funcional do projeto. */
const badgeVariants = cva("ds-pill", {
  variants: {
    tone: {
      neutral: "ds-pill--mute",
      success: "ds-pill--ok",
      warning: "ds-pill--warn",
      danger: "ds-pill--bad",
      info: "ds-pill--info",
      brand: "",
      outline: "ds-pill--outline",
    },
  },
  defaultVariants: { tone: "neutral" },
});

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {
  dot?: boolean;
  icon?: React.ReactNode;
}

export function Badge({ className, tone, dot, icon, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ tone }), className)} {...props}>
      {icon ? <span aria-hidden className="flex shrink-0 [&>svg]:size-3">{icon}</span> : null}
      {dot && !icon ? <span className="size-1.5 rounded-full bg-current" aria-hidden /> : null}
      {children}
    </span>
  );
}
