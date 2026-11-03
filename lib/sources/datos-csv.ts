import type { RawPoint } from "../normalize/validate";
import { fetchSource, SourceError } from "./http";

// CSV de origen de datos.gob.ar. Son más frescos y completos que la API de Series de Tiempo
// para las series que usamos (ver docs/etapa-1-propuesta.md).

export interface CsvTable {
  header: string[];
  rows: string[][];
}

export function parseCsv(text: string): CsvTable {
  const lines = text.replace(/^﻿/, "").trim().split(/\r?\n/);
  const [headerLine, ...rowLines] = lines;
  if (!headerLine) throw new SourceError("CSV vacío");
  return {
    header: headerLine.split(",").map((cell) => cell.trim()),
    rows: rowLines.map((line) => line.split(",")),
  };
}

export async function fetchCsvTable(url: string): Promise<CsvTable> {
  const response = await fetchSource(url);
  return parseCsv(await response.text());
}

/** Lee una columna como puntos crudos. Devuelve null si la columna no existe. */
export function readColumn(table: CsvTable, column: string): RawPoint[] | null {
  const index = table.header.indexOf(column);
  if (index === -1) return null;

  return table.rows.map((row) => {
    const cell = row[index];
    const value = cell === undefined || cell.trim() === "" ? null : Number(cell);
    return { date: row[0], value: value !== null && Number.isFinite(value) ? value : null };
  });
}
