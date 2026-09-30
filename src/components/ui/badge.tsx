import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap", {
  variants: {
    tone: {
      neutral: "bg-surface-muted text-foreground border-transparent",
      success: "bg-success-soft text-success border-transparent",
      warning: "bg-warning-soft text-warning border-transparent",
      danger: "bg-danger-soft text-danger border-transparent",
      info: "bg-info-soft text-info border-transparent",
      brand: "bg-brand-soft text-success border-transparent",
      outline: "bg-transparent text-muted-foreground border-border",
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
      {dot && !icon ? <span className="size-1.5 rounded-full bg-current" /> : null}
      {children}
    </span>
  );
}
