import * as XLSX from "xlsx";
import type { Period } from "../normalize/periods";
import { fetchSource, SourceError } from "./http";

// Planilla oficial de precios promedio del INDEC. Es la única fuente sin token con estas series
// completas y actualizadas: en Series de Tiempo faltan productos y hay etiquetas cruzadas.
export const PRECIOS_XLS_URL = "https://www.indec.gob.ar/ftp/cuadros/economia/sh_ipc_precios_promedio.xls";

const MAX_BYTES = 5 * 1024 * 1024;

const MONTH_NUMBERS: Record<string, number> = {
  enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6, julio: 7,
  agosto: 8, septiembre: 9, setiembre: 9, octubre: 10, noviembre: 11, diciembre: 12,
};

export interface PriceSeries {
  label: string;
  unit: string;
  /** Solo los meses con precio publicado. */
  points: { period: Period; value: number }[];
}

export interface RegionalPriceSeries extends PriceSeries {
  region: string;
}

export interface PreciosWorkbook {
  gba: PriceSeries[];
  regional: RegionalPriceSeries[];
}

type Row = (string | number | null)[];

/** Asigna un período a cada columna a partir de las filas de año ("Año 2017") y de mes. */
function readPeriods(rows: Row[], firstColumn: number): (Period | null)[] {
  const yearRow = rows[2] ?? [];
  const monthRow = rows[3] ?? [];
  const periods: (Period | null)[] = [];
  let year: number | null = null;

  for (let column = firstColumn; column < monthRow.length; column++) {
    // La planilla mezcla "Año 2017" con años numéricos en los períodos más recientes.
    const match = String(yearRow[column] ?? "").match(/\d{4}/);
    if (match) year = Number(match[0]);

    const monthCell = monthRow[column];
    const month = typeof monthCell === "string"
      ? MONTH_NUMBERS[monthCell.toLowerCase().replace(/[^a-z]/g, "")]
      : undefined;

    periods.push(month && year ? `${year}-${String(month).padStart(2, "0")}` : null);
  }

  return periods;
}

function readPoints(row: Row, periods: (Period | null)[], firstColumn: number) {
  const points: { period: Period; value: number }[] = [];
  periods.forEach((period, offset) => {
    const value = row[firstColumn + offset];
    // "///" es el signo del INDEC para "dato que no corresponde presentar".
    if (period && typeof value === "number" && value > 0) points.push({ period, value });
  });
  return points;
}

function sheetRows(workbook: XLSX.WorkBook, name: string): Row[] {
  const sheet = workbook.Sheets[name];
  if (!sheet) throw new SourceError(`La planilla de precios no tiene la hoja "${name}"`);
  return XLSX.utils.sheet_to_json<Row>(sheet, { header: 1, raw: true, defval: null });
}

export function parsePreciosWorkbook(data: Uint8Array): PreciosWorkbook {
  const workbook = XLSX.read(data, { type: "array", cellFormula: false, cellHTML: false });

  const gbaRows = sheetRows(workbook, "GBA");
  const gbaPeriods = readPeriods(gbaRows, 2);
  const gba = gbaRows.slice(5).flatMap((row): PriceSeries[] => {
    const [label, unit] = row;
    if (typeof label !== "string" || typeof unit !== "string") return [];
    const points = readPoints(row, gbaPeriods, 2);
    return points.length > 0 ? [{ label: label.trim(), unit: unit.trim(), points }] : [];
  });

  const nationalRows = sheetRows(workbook, "Nacional");
  const nationalPeriods = readPeriods(nationalRows, 3);
  const regional = nationalRows.slice(5).flatMap((row): RegionalPriceSeries[] => {
    const [region, label, unit] = row;
    if (typeof region !== "string" || typeof label !== "string" || typeof unit !== "string") return [];
    const points = readPoints(row, nationalPeriods, 3);
    return points.length > 0
      ? [{ region: region.trim(), label: label.trim(), unit: unit.trim(), points }]
      : [];
  });

  if (gba.length === 0 || regional.length === 0) {
    throw new SourceError("La planilla de precios cambió de formato: no se encontraron datos");
  }
  return { gba, regional };
}

export async function fetchPreciosWorkbook(): Promise<PreciosWorkbook> {
  const response = await fetchSource(PRECIOS_XLS_URL);
  const buffer = await response.arrayBuffer();
  if (buffer.byteLength > MAX_BYTES) {
    throw new SourceError(`La planilla de precios pesa ${buffer.byteLength} bytes: es demasiado grande`);
  }
  return parsePreciosWorkbook(new Uint8Array(buffer));
}
