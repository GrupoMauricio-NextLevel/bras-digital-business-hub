import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/** Botão do sistema de design: geometria e estados vivem em `src/design-system/core.css` (.ds-btn); aqui só a escolha de variante. */
const buttonVariants = cva("ds-btn [&_svg]:size-4 [&_svg]:shrink-0", {
  variants: {
    variant: {
      primary: "",
      brand: "",
      secondary: "ds-btn--secondary",
      ghost: "ds-btn--quiet",
      danger: "ds-btn--danger",
      link: "ds-btn--link",
    },
    size: {
      sm: "ds-btn--sm",
      md: "",
      lg: "ds-btn--lg",
      icon: "ds-btn--icon",
      "icon-sm": "ds-btn--icon ds-btn--sm",
    },
  },
  defaultVariants: { variant: "primary", size: "md" },
});

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, loading, children, disabled, ...props }, ref) => (
  <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
    {loading ? <Degraus /> : null}
    {children}
  </button>
));
Button.displayName = "Button";

/** "Carregando" da marca (D193): três degraus que sobem em sequência. */
export function Degraus({ className }: { className?: string }) {
  return <span aria-hidden className={cn("nl-degraus", className)}><i /><i /><i /></span>;
}

export { buttonVariants };
