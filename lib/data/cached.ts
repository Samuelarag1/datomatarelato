import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { fetchIndecRows, type IndecRow } from "../sources/api-indec";
import { fetchCsvTable, type CsvTable } from "../sources/datos-csv";
import { fetchPreciosWorkbook, type PreciosWorkbook } from "../sources/indec-xls";
import { readThrough, type SourceResult } from "../sources/read-through";

export type { SourceResult };

export const NO_TOKEN = "sin-token";

export async function getCsvTable(url: string): Promise<SourceResult<CsvTable>> {
  "use cache";
  cacheTag("datos");
  const result = await readThrough(`csv:${url}`, () => fetchCsvTable(url));
  if (result.ok && !result.stale) cacheLife("datos");
  else cacheLife("minutes");
  return result;
}

export async function getPreciosWorkbook(): Promise<SourceResult<PreciosWorkbook>> {
  "use cache";
  cacheTag("datos");
  const result = await readThrough("xls:precios", fetchPreciosWorkbook);
  if (result.ok && !result.stale) cacheLife("datos");
  else cacheLife("minutes");
  return result;
}

export async function getIndecRows(
  table: string,
  params: Record<string, string>,
): Promise<SourceResult<IndecRow[]>> {
  "use cache";
  cacheTag("datos");

  const token = process.env.INDEC_API_TOKEN?.trim();
  if (!token) {
    // Sin token no hay nada que reintentar: el valor solo cambia al reiniciar con el token cargado.
    cacheLife("hours");
    return { ok: false, error: NO_TOKEN, fetchedAt: new Date().toISOString() };
  }

  const result = await readThrough(`indec:${table}:${JSON.stringify(params)}`, () =>
    fetchIndecRows(table, params, token),
  );
  if (result.ok && !result.stale) cacheLife("datos");
  else cacheLife("minutes");
  return result;
}
