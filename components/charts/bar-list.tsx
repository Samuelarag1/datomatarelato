import type { ReactNode } from "react";

export interface BarRow {
  label: string;
  value: number;
  /** Texto a la derecha de la barra. */
  display: string;
  detail?: string;
  /** Atenúa la fila para que resalten las demás. */
  muted?: boolean;
}

function Rows({ rows, max, reference }: { rows: BarRow[]; max: number; reference?: number }) {
  return (
    <ul className="space-y-2.5">
      {rows.map(({ label, value, display, detail, muted }) => {
        return (
          <li key={label} className="grid gap-x-4 gap-y-1 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)] sm:items-center">
            <span className="text-[15px] text-ink-2">
              {label}
              {detail ? <span className="block text-[13px] text-ink-3">{detail}</span> : null}
            </span>
            <span className="flex items-center gap-2">
              <span className="relative h-4 min-w-0 flex-1">
                <span
                  aria-hidden="true"
                  className={`absolute inset-y-0 left-0 rounded-r-[4px] ${muted ? "bg-bar-muted" : "bg-series-1"}`}
                  style={{ width: `${Math.max((value / max) * 100, 0)}%` }}
                />
                {reference !== undefined ? (
                  <span
                    aria-hidden="true"
                    className="absolute -inset-y-1 w-px bg-ink"
                    style={{ left: `${(reference / max) * 100}%` }}
                  />
                ) : null}
              </span>
              <span className="w-20 shrink-0 text-right text-[15px] font-medium">{display}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Barras horizontales en una sola escala. Muestra las primeras filas; el resto queda plegado.
 * La referencia marca un valor común.
 */
export function BarList({
  rows,
  visible = rows.length,
  moreLabel,
  reference,
  referenceLabel,
}: {
  rows: BarRow[];
  visible?: number;
  moreLabel?: string;
  reference?: number;
  referenceLabel?: ReactNode;
}) {
  const max = Math.max(...rows.map((row) => row.value), reference ?? 0) || 1;
  const rest = rows.slice(visible);

  return (
    <div>
      {referenceLabel ? (
        <p className="mb-3 flex items-center gap-2 text-sm text-ink-2">
          <span aria-hidden="true" className="inline-block h-3.5 w-px bg-ink" />
          {referenceLabel}
        </p>
      ) : null}
      <Rows rows={rows.slice(0, visible)} max={max} reference={reference} />
      {rest.length > 0 ? (
        <details className="mt-3">
          <summary className="w-fit text-sm text-link hover:underline">{moreLabel ?? `Ver los ${rows.length}`}</summary>
          <div className="mt-3">
            <Rows rows={rest} max={max} reference={reference} />
          </div>
        </details>
      ) : null}
    </div>
  );
}
