import type { Point } from "../normalize/validate";
import { formatPeriod, formatValue, type Frequency, type ValueFormat } from "./es-ar";

export interface ChartSeries {
  key: string;
  label: string;
  /** Color validado de la paleta. El color sigue a la serie, no a su posición. */
  color: string;
  points: Point[];
}

export type ChartRow = { period: string } & Record<string, number | string | null>;

export function mergeSeries(series: ChartSeries[]): ChartRow[] {
  const rows = new Map<string, ChartRow>();
  for (const { key, points } of series) {
    for (const { period, value } of points) {
      const row = rows.get(period) ?? { period };
      row[key] = value;
      rows.set(period, row);
    }
  }
  return [...rows.values()].sort((a, b) => a.period.localeCompare(b.period));
}

/** Tabla equivalente a un gráfico, del dato más reciente al más viejo. */
export function seriesTable(series: ChartSeries[], frequency: Frequency, format: ValueFormat) {
  return {
    columns: ["Período", ...series.map(({ label }) => label)],
    rows: mergeSeries(series)
      .reverse()
      .map((row) => [
        formatPeriod(row.period, frequency, true),
        ...series.map(({ key }) => {
          const value = row[key];
          return typeof value === "number" ? formatValue(value, format) : "sin dato";
        }),
      ]),
  };
}
