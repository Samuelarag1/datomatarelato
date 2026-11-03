import "server-only";
import { changeOver, lastPoint, monthlyChange, toMap, yearOverYear, yearToDate } from "../analysis/changes";
import { GBA_PRODUCTS, PLAIN_GROUP_NAMES, PRICE_RULES, PRICES_FROM, REGIONAL_PRODUCTS } from "../indicators/products";
import { ipcDivisions, ipcGeneral } from "../indicators/registry";
import { validatePoints } from "../normalize/validate";
import { REGION_LIST, REGIONS, type Place } from "../places";
import type { PriceSeries } from "../sources/indec-xls";
import { getIndecRows, getPreciosWorkbook } from "./cached";
import { loadAll, loadSeries, type SourceMeta } from "./load";

export async function getPrecios(place: Place) {
  const [local, national] = await Promise.all([
    loadSeries(ipcGeneral(place.region)),
    place.region ? loadSeries(ipcGeneral(null)) : null,
  ]);
  if (!local) return null;

  const monthly = monthlyChange(local.points);
  const yearly = yearOverYear(local.points);
  const lastMonth = lastPoint(monthly);
  const lastYear = lastPoint(yearly);
  const accumulated = yearToDate(local.points);
  if (!lastMonth || !lastYear || accumulated === undefined) return null;

  return {
    monthly,
    yearly,
    lastMonth,
    lastYear,
    accumulated,
    nationalYear: national ? lastPoint(yearOverYear(national.points)) ?? null : null,
    meta: local.meta,
  };
}

export interface RubroRow {
  label: string;
  value: number;
}

/**
 * Qué subió más en un año. Por región se usan los grupos de la API del INDEC ("Alquiler",
 * "Transporte público"), que se entienden mejor. Sin token, o para el total del país, donde no
 * existen, se usan los 12 rubros de los CSV.
 */
export async function getRubros(place: Place) {
  const general = await loadSeries(ipcGeneral(place.region));
  const average = general && lastPoint(yearOverYear(general.points));
  if (!general || !average) return null;

  if (place.region) {
    const groups = await getIndecRows("ipc_nacional", {
      periodo: `eq.${average.period.replace("-", "")}`,
      region: `eq.${REGIONS[place.region].sourceLabel}`,
      nivel: "eq.Grupo",
      tipo_de_indicador: "eq.v_ia",
      select: "codigo,descripcion,valor",
      order: "codigo",
    });
    if (groups.ok) {
      const rows = groups.data.flatMap((row): RubroRow[] => {
        const value = Number(row.valor);
        if (row.valor === null || !Number.isFinite(value)) return [];
        return [{ label: PLAIN_GROUP_NAMES[String(row.codigo)] ?? String(row.descripcion), value }];
      });
      if (rows.length > 0) {
        return { rows: rows.sort((a, b) => b.value - a.value), average: average.value, meta: general.meta };
      }
    }
  }

  const divisions = await loadAll(ipcDivisions(place.region));
  if (!divisions) return null;
  const rows = divisions.flatMap((division): RubroRow[] => {
    const last = lastPoint(yearOverYear(division.points));
    return last ? [{ label: division.label, value: last.value }] : [];
  });
  return { rows: rows.sort((a, b) => b.value - a.value), average: average.value, meta: general.meta };
}

export interface ProductRow {
  label: string;
  unit: string;
  price: number;
  yearChange: number | null;
}

function toProductRow(label: string, series: PriceSeries, lastPeriod: string): ProductRow[] {
  const points = series.points.filter((point) => point.period >= PRICES_FROM);
  const issues = validatePoints(points, PRICE_RULES);
  if (issues.length > 0) {
    console.error(`[fuentes] precio de ${series.label}: ${issues[0]}`);
    return [];
  }
  const price = toMap(points).get(lastPeriod);
  if (price === undefined) return [];
  const change = lastPoint(changeOver(points, 12));
  return [{
    label,
    unit: series.unit.toLowerCase(),
    price,
    yearChange: change?.period === lastPeriod ? change.value : null,
  }];
}

function meta(lastPeriod: string, fetchedAt: string, stale: boolean, coverage: string): SourceMeta {
  return { publisher: "INDEC", coverage, frequency: "mes", lastPeriod, fetchedAt, stale };
}

/** Precios de una región. En Gran Buenos Aires se usa la hoja con más productos. */
export async function getProductos(place: Place) {
  const workbook = await getPreciosWorkbook();
  if (!workbook.ok) return null;

  if (!place.region) return getRangoPorProducto(workbook.data.regional, workbook.fetchedAt, workbook.stale);

  const region = REGIONS[place.region];
  const defs = place.region === "gba" ? GBA_PRODUCTS : REGIONAL_PRODUCTS;
  const series: PriceSeries[] = place.region === "gba"
    ? workbook.data.gba
    : workbook.data.regional.filter((row) => row.region === region.sourceLabel);
  const byLabel = new Map(series.map((row) => [row.label, row]));

  const lastPeriod = series[0]?.points.at(-1)?.period;
  if (!lastPeriod) return null;

  const rows = defs.flatMap((def) => {
    const row = byLabel.get(def.variety);
    if (!row) {
      console.error(`[fuentes] planilla de precios: no se encontró "${def.variety}"`);
      return [];
    }
    return toProductRow(def.label, row, lastPeriod);
  });
  if (rows.length === 0) return null;

  return {
    kind: "region" as const,
    rows,
    meta: meta(lastPeriod, workbook.fetchedAt, workbook.stale, `Región ${region.name}`),
  };
}

/** No hay un precio nacional: para el total del país se muestra la región más barata y la más cara. */
function getRangoPorProducto(
  regional: (PriceSeries & { region: string })[],
  fetchedAt: string,
  stale: boolean,
) {
  const lastPeriod = regional[0]?.points.at(-1)?.period;
  if (!lastPeriod) return null;
  const nameOf = (label: string) => REGION_LIST.find((region) => region.sourceLabel === label)?.name ?? label;

  const rows = REGIONAL_PRODUCTS.flatMap((def) => {
    const prices = regional
      .filter((row) => row.label === def.variety && row.points.at(-1)?.period === lastPeriod)
      .map((row) => ({ region: nameOf(row.region), price: row.points.at(-1)?.value as number, unit: row.unit }))
      .sort((a, b) => a.price - b.price);
    if (prices.length < 2) return [];
    return [{
      label: def.label,
      unit: prices[0].unit.toLowerCase(),
      lowest: prices[0],
      highest: prices[prices.length - 1],
    }];
  });
  if (rows.length === 0) return null;

  return { kind: "pais" as const, rows, meta: meta(lastPeriod, fetchedAt, stale, "6 regiones") };
}


