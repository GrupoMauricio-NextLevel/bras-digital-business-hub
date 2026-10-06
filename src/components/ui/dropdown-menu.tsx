"use client";
import * as React from "react";
import * as DropdownPrimitive from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils";

export const DropdownMenu = DropdownPrimitive.Root;
export const DropdownMenuTrigger = DropdownPrimitive.Trigger;

export function DropdownMenuContent({ className, align = "end", ...props }: React.ComponentPropsWithoutRef<typeof DropdownPrimitive.Content>) {
  return (
    <DropdownPrimitive.Portal>
      <DropdownPrimitive.Content align={align} sideOffset={6} className={cn("z-[var(--ds-z-popover)] min-w-[200px] rounded-[var(--ds-r-control)] border border-border bg-surface p-1.5 shadow-[var(--ds-shadow-md)] animate-fade-in", className)} {...props} />
    </DropdownPrimitive.Portal>
  );
}

export function DropdownMenuItem({ className, destructive, ...props }: React.ComponentPropsWithoutRef<typeof DropdownPrimitive.Item> & { destructive?: boolean }) {
  return <DropdownPrimitive.Item className={cn("flex cursor-pointer select-none items-center gap-2 min-h-10 rounded-[var(--ds-r-control-sm)] px-2.5 py-2 text-sm font-semibold outline-none data-[highlighted]:bg-surface-muted [&_svg]:size-4 [&_svg]:text-muted-foreground", destructive && "text-danger [&_svg]:text-danger", className)} {...props} />;
}

export function DropdownMenuLabel({ className, ...props }: React.ComponentPropsWithoutRef<typeof DropdownPrimitive.Label>) {
  return <DropdownPrimitive.Label className={cn("px-2.5 py-1.5 text-xs font-medium uppercase tracking-wide text-subtle-foreground", className)} {...props} />;
}

export const DropdownMenuSeparator = ({ className }: { className?: string }) => <DropdownPrimitive.Separator className={cn("my-1 h-px bg-border", className)} />;
