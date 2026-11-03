import type { Period } from "../normalize/periods";

const MONTHS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];
const SHORT_MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

export type Frequency = "mes" | "trimestre" | "semestre";

const yearOf = (period: Period) => period.slice(0, 4);
const monthOf = (period: Period) => Number(period.slice(5, 7));

export function formatPeriod(period: Period, frequency: Frequency = "mes", short = false): string {
  const month = monthOf(period);
  const year = yearOf(period);
  if (frequency === "semestre") {
    if (short) return `S${month <= 6 ? 1 : 2} ${year}`;
    return `${month <= 6 ? "primer" : "segundo"} semestre de ${year}`;
  }
  if (frequency === "trimestre") {
    const quarter = Math.ceil(month / 3);
    return short ? `T${quarter} ${year}` : `${quarter}.º trimestre de ${year}`;
  }
  return short ? `${SHORT_MONTHS[month - 1]} ${year}` : `${MONTHS[month - 1]} de ${year}`;
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date(iso));
}

function formatNumber(value: number, decimals: number): string {
  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export const formatPercent = (value: number, decimals = 1) => `${formatNumber(value, decimals)}%`;

export function formatSignedPercent(value: number, decimals = 1): string {
  const rounded = Number(value.toFixed(decimals));
  if (rounded === 0) return `${formatNumber(0, decimals)}%`;
  return `${rounded > 0 ? "+" : "−"}${formatNumber(Math.abs(value), decimals)}%`;
}

/** "1,7 millones" o "397 mil": una cifra de población redonda, fácil de leer. */
export function formatPopulation(value: number): string {
  if (value >= 1_000_000) return `${formatNumber(value / 1_000_000, 1)} millones`;
  return `${formatNumber(Math.round(value / 1000), 0)} mil`;
}

export const formatPesos = (value: number) => `$${formatNumber(value, 0)}`;
export const formatRatio = (value: number) => formatNumber(value, 2);
export const formatIndex = (value: number) => formatNumber(value, 1);

export type ValueFormat = "percent" | "percent0" | "ratio" | "index" | "pesos";

export function formatValue(value: number, format: ValueFormat): string {
  switch (format) {
    case "percent":
      return formatPercent(value);
    case "percent0":
      return formatPercent(value, 0);
    case "ratio":
      return formatRatio(value);
    case "index":
      return formatIndex(value);
    case "pesos":
      return formatPesos(value);
  }
}

/** Formato compacto para el eje vertical: sin decimales innecesarios. */
export function formatTick(value: number, format: ValueFormat): string {
  switch (format) {
    case "percent":
    case "percent0":
      return `${formatNumber(value, Number.isInteger(value) ? 0 : 1)}%`;
    case "ratio":
      return formatNumber(value, 1);
    case "index":
      return formatNumber(value, 0);
    case "pesos":
      return value >= 1000 ? `$${formatNumber(value / 1000, 0)} mil` : `$${formatNumber(value, 0)}`;
  }
}
