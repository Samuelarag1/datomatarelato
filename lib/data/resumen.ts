import "server-only";
import { formatPercent, formatPeriod } from "../format/es-ar";
import { PLACES, type Place } from "../places";
import { getCobertura } from "./ingresos";
import type { SourceMeta } from "./load";
import { regionInName } from "./place";
import { getPobreza } from "./pobreza";
import { getPrecios } from "./precios";

export interface TopicStat {
  value: string;
  /** La frase completa que acompaña a la cifra. */
  text: string;
  /** La misma idea en pocas palabras, para las imágenes al compartir. */
  short: string;
  period: string;
  /** "INDEC · Región Noroeste · septiembre de 2026". */
  source: string;
}

/** Una cifra por tema. Null: esa fuente no está disponible ahora, sin afectar a las otras. */
export interface TopicSummary {
  precios: TopicStat | null;
  alcanza: TopicStat | null;
  pobreza: TopicStat | null;
}

const citation = ({ publisher, coverage, lastPeriod, frequency }: SourceMeta) => {
  const period = formatPeriod(lastPeriod, frequency);
  return { period, source: `${publisher} · ${coverage} · ${period}` };
};

async function preciosStat(place: Place): Promise<TopicStat | null> {
  const data = await getPrecios(place);
  if (!data) return null;
  const { lastMonth, lastYear, meta } = data;
  const verb = lastMonth.value >= 0 ? "subieron" : "bajaron";
  return {
    value: formatPercent(Math.abs(lastMonth.value)),
    text: `${verb} los precios ${regionInName(place)} en ${formatPeriod(lastMonth.period).split(" de ")[0]}. En un año: ${formatPercent(lastYear.value)}.`,
    short: `${verb} los precios ${regionInName(place)}`,
    ...citation(meta),
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
      short: "de la canasta básica cubre el salario mínimo, según la región",
      ...citation(data.meta),
    };
  }
  return {
    value: formatPercent(data.smvmShare, 0),
    text: `de la canasta básica de un adulto cubre el salario mínimo ${regionInName(place)}.`,
    short: `de la canasta básica cubre el salario mínimo ${regionInName(place)}`,
    ...citation(data.meta),
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
      short: "bajo la línea de pobreza, en las ciudades que releva el INDEC",
      ...citation(data.meta),
    };
  }
  const rest = others.map((city) => `${formatPercent(city.last.value)} en ${city.label}`).join("; ");
  const { period } = citation(data.meta);
  return {
    value: formatPercent(first.last.value),
    text: `de las personas está bajo la línea de pobreza en ${first.label}.${rest ? ` ${rest}.` : ""}`,
    short: `bajo la línea de pobreza en ${first.label}`,
    period,
    source: `${data.meta.publisher} · ${others.length > 0 ? `${data.cities.length} ciudades` : first.label} · ${period}`,
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

/** La cifra del tema como texto para compartir, o el texto general si la fuente no está disponible. */
export const statDescription = (stat: TopicStat | null, fallback: string) =>
  stat ? `${stat.value} ${stat.text}` : fallback;

/** Las tres cifras en una frase, para el resumen de un lugar. */
export function summaryDescription({ precios, alcanza, pobreza }: TopicSummary, fallback: string) {
  const stats = [precios, alcanza, pobreza].flatMap((stat) => (stat ? [`${stat.value} ${stat.short}.`] : []));
  return stats.length > 0 ? stats.join(" ") : fallback;
}
