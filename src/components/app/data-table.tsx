import * as React from "react";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { EmptyState } from "./empty-state";

export type Column<T> = {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  className?: string;
  /** Exibir no card mobile (default: true) */
  mobile?: boolean;
  /** Título do card mobile */
  primary?: boolean;
};

/**
 * Tabela responsiva: tabela real em telas médias+, cards em mobile.
 */
export function DataTable<T>({ rows, columns, rowKey, empty, rowHref, className }: { rows: T[]; columns: Column<T>[]; rowKey: (row: T) => string; empty?: React.ReactNode; rowHref?: (row: T) => string; className?: string }) {
  if (rows.length === 0) return <>{empty ?? <EmptyState title="Nada por aqui" description="Nenhum registro encontrado." />}</>;
  const primary = columns.find((c) => c.primary) ?? columns[0]!;
  const rest = columns.filter((c) => c !== primary && c.mobile !== false);
  return (
    <div className={cn("rounded-lg border border-border bg-surface shadow-sm", className)}>
      <div className="hidden md:block">
        <Table>
          <THead>
            <TR className="hover:bg-transparent">
              {columns.map((c) => (
                <TH key={c.key} className={c.className}>{c.header}</TH>
              ))}
            </TR>
          </THead>
          <TBody>
            {rows.map((row) => (
              <TR key={rowKey(row)} className={rowHref ? "relative cursor-pointer" : undefined}>
                {columns.map((c, i) => (
                  <TD key={c.key} className={c.className}>
                    {i === 0 && rowHref ? (
                      <a href={rowHref(row)} className="after:absolute after:inset-0">{c.cell(row)}</a>
                    ) : (
                      c.cell(row)
                    )}
                  </TD>
                ))}
              </TR>
            ))}
          </TBody>
        </Table>
      </div>
      <ul className="divide-y divide-border md:hidden">
        {rows.map((row) => (
          <li key={rowKey(row)} className="relative p-4">
            <div className="mb-2 text-sm font-medium">{rowHref ? <a href={rowHref(row)} className="after:absolute after:inset-0">{primary.cell(row)}</a> : primary.cell(row)}</div>
            <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm">
              {rest.map((c) => (
                <React.Fragment key={c.key}>
                  <dt className="text-xs text-muted-foreground">{c.header}</dt>
                  <dd className="flex justify-end text-right [&_span]:max-w-full [&_span]:truncate">{c.cell(row)}</dd>
                </React.Fragment>
              ))}
            </dl>
          </li>
        ))}
      </ul>
    </div>
  );
}
