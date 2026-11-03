import "server-only";
import { lastPoint, toMap } from "../analysis/changes";
import { basketFor, cityPoverty, POBREZA_TOTAL_HOGARES, POBREZA_TOTAL_PERSONAS } from "../indicators/registry";
import type { Point } from "../normalize/validate";
import { CITIES, REGIONS, type Place } from "../places";
import { getIndecRows, NO_TOKEN } from "./cached";
import { loadSeries } from "./load";

/**
 * Indigencia de la API del INDEC, que solo se publica para el total. Se contrasta contra la
 * pobreza del CSV para confirmar el área, el período y la escala: si no coinciden, no se muestra.
 */
async function getIndigencia(personas: Point[]) {
  const result = await getIndecRows("pobreza_eph", { order: "area_geografica_nom,periodo" });
  if (!result.ok) return { status: result.error === NO_TOKEN ? ("sin-token" as const) : ("no-disponible" as const) };

  const expected = toMap(personas);
  const rows = result.data
    .map((row) => ({
      period: `${row.anio}-${Number(row.semestre) === 1 ? "01" : "07"}`,
      poverty: Number(row.tasa_pobreza_personas),
      extreme: Number(row.tasa_indigencia_personas),
    }))
    .filter((row) => Number.isFinite(row.extreme) && row.extreme > 0);

  const anchor = rows.find((row) => expected.has(row.period) && Number.isFinite(row.poverty));
  if (!anchor || Math.abs(anchor.poverty - (expected.get(anchor.period) as number)) >= 0.5) {
    console.error("[fuentes] pobreza_eph no coincide con el CSV");
    return { status: "no-disponible" as const };
  }

  const points = rows
    .filter((row) => expected.has(row.period))
    .map((row) => ({ period: row.period, value: row.extreme }))
    .sort((a, b) => a.period.localeCompare(b.period));
  return { status: "ok" as const, points };
}

export async function getPobreza(place: Place) {
  const [personas, hogares] = await Promise.all([
    loadSeries(POBREZA_TOTAL_PERSONAS),
    loadSeries(POBREZA_TOTAL_HOGARES),
  ]);
  const lastPersonas = personas && lastPoint(personas.points);
  const lastHogares = hogares && lastPoint(hogares.points);
  if (!personas || !hogares || !lastPersonas || !lastHogares) return null;

  const cities = (await Promise.all(place.cities.map((city) => loadSeries(cityPoverty(city))))).flatMap((city) => {
    const last = city && lastPoint(city.points);
    return city && last ? [{ label: city.label, last, points: city.points }] : [];
  });

  const indigencia = !place.region ? await getIndigencia(personas.points) : null;
  const previous = toMap(personas.points);

  return {
    personas: personas.points,
    lastPersonas,
    lastHogares,
    previousYear: previous.get(`${Number(lastPersonas.period.slice(0, 4)) - 1}${lastPersonas.period.slice(4)}`) ?? null,
    indigencia,
    cities,
    meta: personas.meta,
  };
}

/** Líneas de pobreza e indigencia por adulto en la región del lugar. Sin región: la referencia del INDEC. */
export async function getLineas(place: Place) {
  const region = place.region ?? "gba";
  const [cbt, cba] = await Promise.all([loadSeries(basketFor("cbt", region)), loadSeries(basketFor("cba", region))]);
  const lastCbt = cbt && lastPoint(cbt.points);
  const lastCba = cba && toMap(cba.points).get(lastCbt?.period ?? "");
  if (!cbt || !cba || !lastCbt || lastCba === undefined || lastCba === null) return null;

  return { period: lastCbt.period, cbt: lastCbt.value, cba: lastCba, regionName: REGIONS[region].name, meta: cbt.meta };
}

export async function getCiudades() {
  const results = await Promise.all(Object.keys(CITIES).map((city) => loadSeries(cityPoverty(city))));
  const rows = results.flatMap((city) => {
    const last = city && lastPoint(city.points);
    return city && last ? [{ label: city.label, value: last.value, period: last.period }] : [];
  });
  if (rows.length === 0) return null;

  // Solo se comparan las ciudades con dato en el semestre más reciente.
  const latest = rows.map((row) => row.period).sort().at(-1) as string;
  return {
    period: latest,
    rows: rows.filter((row) => row.period === latest).sort((a, b) => b.value - a.value),
  };
}
