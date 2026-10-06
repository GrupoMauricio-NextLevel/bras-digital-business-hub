import * as React from "react";
import { Label } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function FormField({ label, hint, error, htmlFor, children, className }: { label: string; hint?: string; error?: string; htmlFor?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? <p className="ds-field-error" role="alert">{error}</p> : hint ? <p className="ds-field-hint">{hint}</p> : null}
    </div>
  );
}
