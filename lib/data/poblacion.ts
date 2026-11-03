import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { fetchIndecRows } from "../sources/api-indec";
import { readThrough } from "../sources/read-through";
import { GBA_PARTIDOS, type Place } from "../places";

/** Población estimada por lugar para el año en curso, de la API del INDEC, por departamento. */
async function getPoblacionPorLugar() {
  "use cache";
  cacheTag("datos");
  const token = process.env.INDEC_API_TOKEN?.trim();
  if (!token) {
    cacheLife("hours");
    return null;
  }

  const year = new Date().getFullYear();
  const result = await readThrough(`poblacion:${year}`, async () => {
    const rows = await fetchIndecRows(
      "estimaciones_poblacion_departamento_2022_2035",
      { fecha: `eq.${year}`, select: "jurisdiccion_cod,departamento_cod,poblacion", order: "departamento_cod,sexo_cod" },
      token,
    );
    const totals: Record<string, number> = {};
    for (const row of rows) {
      const value = Number(row.poblacion);
      if (!Number.isFinite(value)) continue;
      const jurisdiction = String(row.jurisdiccion_cod);
      // La provincia de Buenos Aires se separa igual que los lugares del sitio.
      const key = jurisdiction === "06"
        ? GBA_PARTIDOS.has(String(row.departamento_cod)) ? "conurbano" : "buenos-aires"
        : jurisdiction;
      totals[key] = (totals[key] ?? 0) + value;
      totals.pais = (totals.pais ?? 0) + value;
    }
    return { year, totals };
  });
  if (result.ok && !result.stale) cacheLife("datos");
  else cacheLife("minutes");
  return result.ok ? result.data : null;
}

export async function getPoblacion(place: Place) {
  const data = await getPoblacionPorLugar();
  if (!data) return null;
  const key = !place.provinceId
    ? "pais"
    : place.provinceId === "06" ? place.slug : place.provinceId;
  const value = data.totals[key];
  return value ? { value, year: data.year } : null;
}
