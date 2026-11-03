// Un período se representa siempre como "AAAA-MM": el primer mes del período
// (trimestre T2 = "AAAA-04", semestre S2 = "AAAA-07").

export type Period = string;

const PERIOD_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

export function isPeriod(value: string): value is Period {
  return PERIOD_RE.test(value);
}

/** Convierte "AAAA-MM-DD" o "AAAA-MM" en un período. Devuelve null si no es una fecha válida. */
export function toPeriod(date: string): Period | null {
  const period = date.trim().slice(0, 7);
  return isPeriod(period) ? period : null;
}

export function addMonths(period: Period, months: number): Period {
  const [year, month] = period.split("-").map(Number);
  const total = year * 12 + (month - 1) + months;
  const nextYear = Math.floor(total / 12);
  const nextMonth = total - nextYear * 12 + 1;
  return `${nextYear}-${String(nextMonth).padStart(2, "0")}`;
}

export function monthsBetween(from: Period, to: Period): number {
  const [fromYear, fromMonth] = from.split("-").map(Number);
  const [toYear, toMonth] = to.split("-").map(Number);
  return (toYear - fromYear) * 12 + (toMonth - fromMonth);
}
