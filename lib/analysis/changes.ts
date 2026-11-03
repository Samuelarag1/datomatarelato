import { addMonths, type Period } from "../normalize/periods";
import type { Point } from "../normalize/validate";

export function toMap(points: Point[]): Map<Period, number> {
  return new Map(points.map((point) => [point.period, point.value]));
}

export function lastPoint(points: Point[]): Point | undefined {
  return points[points.length - 1];
}

/** Variación porcentual contra el valor de `lagMonths` meses antes. */
export function changeOver(points: Point[], lagMonths: number): Point[] {
  const values = toMap(points);
  const result: Point[] = [];
  for (const { period, value } of points) {
    const previous = values.get(addMonths(period, -lagMonths));
    if (previous !== undefined && previous !== 0) {
      result.push({ period, value: (value / previous - 1) * 100 });
    }
  }
  return result;
}

export const monthlyChange = (points: Point[]) => changeOver(points, 1);
export const yearOverYear = (points: Point[]) => changeOver(points, 12);

/** Variación acumulada desde diciembre del año anterior para el último período disponible. */
export function yearToDate(points: Point[]): number | undefined {
  const last = lastPoint(points);
  if (!last) return undefined;
  const december = toMap(points).get(`${Number(last.period.slice(0, 4)) - 1}-12`);
  return december === undefined ? undefined : (last.value / december - 1) * 100;
}

export function peak(points: Point[]): Point | undefined {
  if (points.length === 0) return undefined;
  return points.reduce((max, point) => (point.value > max.value ? point : max));
}

/** Cociente de dos series, en los períodos que comparten. */
export function ratio(numerator: Point[], denominator: Point[]): Point[] {
  const values = toMap(denominator);
  const result: Point[] = [];
  for (const { period, value } of numerator) {
    const divisor = values.get(period);
    if (divisor !== undefined && divisor !== 0) {
      result.push({ period, value: value / divisor });
    }
  }
  return result;
}

/**
 * Evolución de una serie frente a otra, con 100 en el período base. Sirve para el salario
 * real y para saber si un precio subió más o menos que el nivel general.
 * Más de 100 significa que la serie subió más que la referencia desde esa fecha.
 */
export function relativeTo(series: Point[], reference: Point[], base: Period): Point[] {
  const seriesBase = toMap(series).get(base);
  const referenceBase = toMap(reference).get(base);
  if (seriesBase === undefined || referenceBase === undefined) return [];

  const referenceValues = toMap(reference);
  const result: Point[] = [];
  for (const { period, value } of series) {
    if (period < base) continue;
    const referenceValue = referenceValues.get(period);
    if (referenceValue === undefined) continue;
    result.push({
      period,
      value: (value / seriesBase / (referenceValue / referenceBase)) * 100,
    });
  }
  return result;
}
