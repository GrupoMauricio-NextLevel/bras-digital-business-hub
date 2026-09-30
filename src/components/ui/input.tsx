import * as React from "react";
import { cn } from "@/lib/utils";

export const inputClass =
  "flex h-9 w-full rounded-md border border-border bg-surface px-3 py-1 text-sm text-foreground shadow-sm transition-colors placeholder:text-subtle-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:border-border-strong disabled:cursor-not-allowed disabled:opacity-50";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(inputClass, className)} {...props} />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(inputClass, "h-auto min-h-[88px] py-2", className)} {...props} />
));
Textarea.displayName = "Textarea";

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(({ className, children, ...props }, ref) => (
  <select ref={ref} className={cn(inputClass, "appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 fill=%22none%22 stroke=%22%236b7280%22 stroke-width=%222%22 viewBox=%220 0 24 24%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-[length:16px] bg-[position:right_10px_center] bg-no-repeat pr-9", className)} {...props}>
    {children}
  </select>
));
Select.displayName = "Select";

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("text-sm font-medium text-foreground", className)} {...props} />;
}

export function Switch({ checked, onCheckedChange, label, disabled, ariaLabel }: { checked: boolean; onCheckedChange: (v: boolean) => void; label?: string; disabled?: boolean; ariaLabel?: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label ? undefined : ariaLabel} disabled={disabled} onClick={() => onCheckedChange(!checked)} className="inline-flex items-center gap-2 disabled:opacity-50">
      <span className={cn("relative inline-flex h-5 w-9 items-center rounded-full transition-colors", checked ? "bg-brand" : "bg-border-strong")}>
        <span className={cn("inline-block size-4 rounded-full bg-white shadow transition-transform", checked ? "translate-x-4.5" : "translate-x-0.5")} />
      </span>
      {label ? <span className="text-sm">{label}</span> : null}
    </button>
  );
}
