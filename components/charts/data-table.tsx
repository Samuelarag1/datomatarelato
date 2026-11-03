/** Equivalente en tabla de un gráfico: ningún valor depende de pasar el cursor por encima. */
export function DataTable({ columns, rows }: { columns: string[]; rows: string[][] }) {
  return (
    <div className="max-h-64 overflow-auto rounded-md border border-rule">
      <table className="w-full border-collapse text-left text-[13px] tabular-nums">
        <thead className="sticky top-0 bg-surface-2">
          <tr>
            {columns.map((column, index) => (
              <th key={column} scope="col" className={`px-3 py-1.5 font-medium ${index > 0 ? "text-right" : ""}`}>
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[0]} className="border-t border-rule">
              {row.map((cell, index) => (
                <td key={index} className={`px-3 py-1 ${index > 0 ? "text-right" : ""}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
