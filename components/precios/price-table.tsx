import type { ReactNode } from "react";

interface PriceTableProps {
  columns: string[];
  rows: { key: string; cells: ReactNode[] }[];
  visible: number;
  moreLabel: string;
}

function Table({ columns, rows, hideHead }: { columns: string[]; rows: PriceTableProps["rows"]; hideHead?: boolean }) {
  return (
    <table className="w-full table-fixed border-collapse text-[15px]">
      <thead className={hideHead ? "sr-only" : undefined}>
        <tr className="border-b border-rule-strong text-left text-[13px] text-ink-3">
          {columns.map((column, index) => (
            <th key={column} scope="col" className={`py-1.5 font-normal ${index === 0 ? "w-[46%]" : "text-right"}`}>
              {column}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map(({ key, cells }) => (
          <tr key={key} className="border-b border-rule">
            {cells.map((cell, index) => (
              <td key={index} className={`py-2 ${index === 0 ? "" : "text-right"}`}>
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Lista de precios: unas pocas filas a la vista y el resto plegado. */
export function PriceTable({ columns, rows, visible, moreLabel }: PriceTableProps) {
  const rest = rows.slice(visible);
  return (
    <div className="max-w-3xl">
      <Table columns={columns} rows={rows.slice(0, visible)} />
      {rest.length > 0 ? (
        <details className="mt-3">
          <summary className="w-fit text-sm text-link hover:underline">{moreLabel}</summary>
          <div className="mt-1">
            <Table columns={columns} rows={rest} hideHead />
          </div>
        </details>
      ) : null}
    </div>
  );
}
