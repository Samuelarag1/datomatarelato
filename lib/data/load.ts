import "server-only";
import type { Frequency } from "../format/es-ar";
import type { SeriesDef } from "../indicators/registry";
import type { Period } from "../normalize/periods";
import { cleanPoints, validatePoints, type Point } from "../normalize/validate";
import { readColumn } from "../sources/datos-csv";
import { getCsvTable } from "./cached";

/** Lo que cada visualización necesita para citar su dato. */
export interface SourceMeta {
  publisher: string;
  coverage: string;
  frequency: Frequency;
  lastPeriod: Period;
  fetchedAt: string;
  stale: boolean;
}

export interface LoadedSeries {
  label: string;
  points: Point[];
  meta: SourceMeta;
}

export async function loadSeries(def: SeriesDef): Promise<LoadedSeries | null> {
  const table = await getCsvTable(def.url);
  if (!table.ok) return null;

  const raw = readColumn(table.data, def.column);
  if (!raw) {
    console.error(`[fuentes] no existe la columna ${def.column}`);
    return null;
  }

  const points = cleanPoints(raw, { now: table.fetchedAt, from: def.from, scale: def.scale });
  const issues = validatePoints(points, def.rules);
  if (issues.length > 0) {
    console.error(`[fuentes] ${def.column}: ${issues.slice(0, 3).join("; ")}`);
    return null;
  }

  return {
    label: def.label,
    points,
    meta: {
      publisher: def.publisher,
      coverage: def.coverage,
      frequency: def.frequency,
      lastPeriod: points[points.length - 1].period,
      fetchedAt: table.fetchedAt,
      stale: table.stale,
    },
  };
}

/** Carga varias series. Devuelve null si falla alguna, para no mostrar comparaciones incompletas. */
export async function loadAll(defs: SeriesDef[]): Promise<LoadedSeries[] | null> {
  const results = await Promise.all(defs.map(loadSeries));
  return results.every((result) => result !== null) ? (results as LoadedSeries[]) : null;
}
