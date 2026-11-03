import { isPeriod, monthsBetween, toPeriod, type Period } from "./periods";

export interface Point {
  period: Period;
  value: number;
}

export interface RawPoint {
  date: string;
  value: number | null;
}

export interface CleanOptions {
  /** Fecha de la consulta (ISO). Descarta valores futuros, como el salario mínimo programado. */
  now: string;
  /** Descarta períodos anteriores a este, sin unir tramos no comparables. */
  from?: Period;
  /** Multiplicador, por ejemplo 100 cuando la fuente publica fracciones. */
  scale?: number;
}

export function cleanPoints(raw: RawPoint[], options: CleanOptions): Point[] {
  const nowPeriod = options.now.slice(0, 7);
  const scale = options.scale ?? 1;
  const points: Point[] = [];

  for (const { date, value } of raw) {
    const period = toPeriod(date);
    if (period === null || value === null || !Number.isFinite(value)) continue;
    if (period > nowPeriod) continue;
    if (options.from && period < options.from) continue;
    points.push({ period, value: value * scale });
  }

  return points.sort((a, b) => a.period.localeCompare(b.period));
}

export interface ValidationRules {
  minPoints: number;
  /** Separación esperada entre períodos consecutivos, en meses. */
  stepMonths: number;
  /** Cuántos períodos seguidos pueden faltar. Por omisión ninguno: un hueco invalida la serie. */
  toleratedGaps?: number;
  /** Variación máxima tolerada entre dos períodos consecutivos, como fracción (0,5 = 50%). */
  maxStepChange?: number;
  /** Rango posible de los valores, para detectar fechas o columnas cruzadas. */
  range?: [number, number];
}

/** Devuelve los problemas encontrados. Una lista vacía significa que la serie es usable. */
export function validatePoints(points: Point[], rules: ValidationRules): string[] {
  const issues: string[] = [];

  if (points.length < rules.minPoints) {
    issues.push(`tiene ${points.length} datos y se esperaban al menos ${rules.minPoints}`);
    return issues;
  }

  points.forEach((point, index) => {
    if (!isPeriod(point.period)) issues.push(`período inválido: ${point.period}`);
    if (rules.range && (point.value < rules.range[0] || point.value > rules.range[1])) {
      issues.push(`${point.period}: valor fuera de rango (${point.value})`);
    }

    const previous = points[index - 1];
    if (!previous) return;

    const gap = monthsBetween(previous.period, point.period);
    const maxGap = rules.stepMonths * (1 + (rules.toleratedGaps ?? 0));
    if (gap <= 0 || gap > maxGap) {
      issues.push(`hueco entre ${previous.period} y ${point.period}`);
    }
    if (rules.maxStepChange !== undefined && previous.value !== 0) {
      const change = Math.abs(point.value / previous.value - 1);
      if (change > rules.maxStepChange) {
        issues.push(`${point.period}: salto de ${(change * 100).toFixed(0)}%`);
      }
    }
  });

  return issues;
}
