import * as React from "react";
import { cn } from "@/lib/utils";

export function Table({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="nl-scroll w-full overflow-x-auto" tabIndex={0} role="region" aria-label="Tabela, role para ver mais colunas">
      <table className={cn("ds-table caption-bottom text-sm", className)} {...props} />
    </div>
  );
}
export const THead = ({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => <thead className={cn("", className)} {...props} />;
export const TBody = ({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => <tbody className={cn("[&_tr:last-child>*]:border-b-0", className)} {...props} />;
export const TR = ({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) => <tr className={cn("transition-colors", className)} {...props} />;
export const TH = ({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) => <th className={cn("h-11 px-4 text-left align-middle first:pl-5 last:pr-5", className)} {...props} />;
export const TD = ({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) => <td className={cn("px-4 py-3 align-middle first:pl-5 last:pr-5", className)} {...props} />;
