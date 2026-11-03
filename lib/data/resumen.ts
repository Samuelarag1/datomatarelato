import "server-only";
import { formatPercent, formatPeriod } from "../format/es-ar";
import { PLACES, type Place } from "../places";
import { getCobertura } from "./ingresos";
import { regionInName } from "./place";
import { getPobreza } from "./pobreza";
import { getPrecios } from "./precios";

export interface TopicStat {
  value: string;
  text: string;
}

/** Una cifra por tema. Null: esa fuente no está disponible ahora, sin afectar a las otras. */
export interface TopicSummary {
  precios: TopicStat | null;
  alcanza: TopicStat | null;
  pobreza: TopicStat | null;
}

async function preciosStat(place: Place): Promise<TopicStat | null> {
  const data = await getPrecios(place);
  if (!data) return null;
  const { lastMonth, lastYear } = data;
  return {
    value: formatPercent(Math.abs(lastMonth.value)),
    text: `${lastMonth.value >= 0 ? "subieron" : "bajaron"} los precios ${regionInName(place)} en ${formatPeriod(lastMonth.period).split(" de ")[0]}. En un año: ${formatPercent(lastYear.value)}.`,
  };
}

async function alcanzaStat(place: Place): Promise<TopicStat | null> {
  const data = await getCobertura(place);
  if (!data) return null;
  if (data.kind === "pais") {
    const shares = data.rows.map((row) => row.smvmShare);
    return {
      value: `${formatPercent(Math.min(...shares), 0)} a ${formatPercent(Math.max(...shares), 0)}`,
      text: "de la canasta básica de un adulto cubre el salario mínimo, según la región.",
    };
  }
  return {
    value: formatPercent(data.smvmShare, 0),
    text: `de la canasta básica de un adulto cubre el salario mínimo ${regionInName(place)}.`,
  };
}

async function pobrezaStat(place: Place): Promise<TopicStat | null> {
  const data = await getPobreza(place);
  if (!data) return null;
  const [first, ...others] = data.cities;
  if (!first) {
    return {
      value: formatPercent(data.lastPersonas.value),
      text: "de las personas está bajo la línea de pobreza, en las ciudades que releva el INDEC.",
    };
  }
  const rest = others.map((city) => `${formatPercent(city.last.value)} en ${city.label}`).join("; ");
  return {
    value: formatPercent(first.last.value),
    text: `de las personas está bajo la línea de pobreza en ${first.label}.${rest ? ` ${rest}.` : ""}`,
  };
}

const orNull = (stat: Promise<TopicStat | null>) =>
  stat.catch((error) => {
    console.error("[resumen]", error);
    return null;
  });

export async function getTopicSummary(place: Place): Promise<TopicSummary> {
  const [precios, alcanza, pobreza] = await Promise.all([
    orNull(preciosStat(place)),
    orNull(alcanzaStat(place)),
    orNull(pobrezaStat(place)),
  ]);
  return { precios, alcanza, pobreza };
}

/** Los resúmenes de todos los lugares, para que el inicio muestre el elegido sin pedir nada más. */
export async function getAllSummaries() {
  const summaries: Record<string, TopicSummary> = {};
  // De a uno: el primer lugar llena la caché de cada archivo y el resto no vuelve a descargarlo.
  for (const place of PLACES) summaries[place.slug] = await getTopicSummary(place);
  return summaries;
}
