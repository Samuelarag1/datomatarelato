import "server-only";
import { lastPoint, ratio, relativeTo, toMap, yearOverYear } from "../analysis/changes";
import {
  basketFor,
  HABER_MINIMO,
  ipcGeneral,
  regionalBasket,
  SALARIO_NO_REGISTRADO,
  SALARIO_PRIVADO,
  SALARIO_PUBLICO,
  SMVM_MENSUAL,
} from "../indicators/registry";
import { addMonths, toPeriod } from "../normalize/periods";
import type { Point } from "../normalize/validate";
import { REGION_LIST, type Place } from "../places";
import { getIndecRows, NO_TOKEN } from "./cached";
import { loadAll, loadSeries } from "./load";

/**
 * Bono previsional extraordinario, que no surge de ninguna serie oficial. El monto y el rango se
 * verificaron contra los decretos de cada mes: extender `to` solo tras comprobar el siguiente.
 */
const BONO_JUBILATORIO = { amount: 70_000, from: "2024-03", to: "2026-10" };

const toPercent = (points: Point[]) => points.map(({ period, value }) => ({ period, value: value * 100 }));

export async function getCobertura(place: Place) {
  const [smvm, haber] = await Promise.all([loadSeries(SMVM_MENSUAL), loadSeries(HABER_MINIMO)]);
  if (!smvm || !haber) return null;

  if (!place.region) {
    // No existe una canasta nacional: se compara cada región en el mismo mes.
    const baskets = await loadAll(REGION_LIST.map((region) => regionalBasket("cbt", region.key)));
    if (!baskets) return null;

    const smvmValues = toMap(smvm.points);
    const haberValues = toMap(haber.points);
    const rows = REGION_LIST.flatMap((region, index) => {
      const last = lastPoint(baskets[index].points);
      const minimum = last && smvmValues.get(last.period);
      const pension = last && haberValues.get(last.period);
      if (!last || minimum === undefined || pension === undefined) return [];
      return [{
        region: region.name,
        basket: last.value,
        smvmShare: (minimum / last.value) * 100,
        haberShare: (pension / last.value) * 100,
      }];
    }).sort((a, b) => b.smvmShare - a.smvmShare);
    if (rows.length === 0) return null;

    return { kind: "pais" as const, rows, meta: { ...baskets[0].meta, coverage: "6 regiones" } };
  }

  const basket = await loadSeries(basketFor("cbt", place.region));
  const last = basket && lastPoint(basket.points);
  if (!basket || !last) return null;

  const minimum = toMap(smvm.points).get(last.period);
  const pension = toMap(haber.points).get(last.period);
  if (minimum === undefined || pension === undefined) return null;

  const hasBono = last.period >= BONO_JUBILATORIO.from && last.period <= BONO_JUBILATORIO.to;

  return {
    kind: "region" as const,
    period: last.period,
    basket: last.value,
    minimum,
    pension,
    smvmShare: (minimum / last.value) * 100,
    haberShare: (pension / last.value) * 100,
    bono: hasBono
      ? {
          amount: BONO_JUBILATORIO.amount,
          total: pension + BONO_JUBILATORIO.amount,
          share: ((pension + BONO_JUBILATORIO.amount) / last.value) * 100,
        }
      : null,
    history: {
      smvm: toPercent(ratio(smvm.points, basket.points)),
      haber: toPercent(ratio(haber.points, basket.points)),
    },
    meta: basket.meta,
  };
}

export async function getSalarios() {
  const [ipc, privado, publico, noRegistrado] = await Promise.all([
    loadSeries(ipcGeneral(null)),
    loadSeries(SALARIO_PRIVADO),
    loadSeries(SALARIO_PUBLICO),
    loadSeries(SALARIO_NO_REGISTRADO),
  ]);
  if (!ipc || !privado || !publico || !noRegistrado) return null;

  const period = privado.meta.lastPeriod;
  const prices = yearOverYear(ipc.points).find((point) => point.period === period);
  if (!prices) return null;

  const base = addMonths(period, -12);
  const row = (series: Point[]) => {
    const nominal = lastPoint(yearOverYear(series));
    const real = relativeTo(series, ipc.points, base).find((point) => point.period === period);
    return nominal && real ? { nominal: nominal.value, real: real.value - 100 } : null;
  };

  const first = privado.points[0].period;
  return {
    period,
    prices: prices.value,
    privado: row(privado.points),
    publico: row(publico.points),
    noRegistrado: row(noRegistrado.points),
    history: {
      privado: relativeTo(privado.points, ipc.points, first),
      publico: relativeTo(publico.points, ipc.points, first),
    },
    meta: privado.meta,
  };
}

const TRAMOS = [
  { key: "men1", label: "Menos de 1 año" },
  { key: "1a3", label: "De 1 a 3 años" },
  { key: "4a5", label: "De 4 a 5 años" },
  { key: "6a12", label: "De 6 a 12 años" },
];

export type CrianzaResult =
  | { status: "sin-token" }
  | { status: "no-disponible" }
  | {
      status: "ok";
      period: string;
      fetchedAt: string;
      stale: boolean;
      rows: { label: string; goods: number; care: number; total: number; yearChange: number | null }[];
    };

/** Canasta de crianza (API del INDEC). Se controla la forma de la respuesta antes de mostrarla. */
export async function getCrianza(): Promise<CrianzaResult> {
  const result = await getIndecRows("canasta-crianza", { order: "Periodo" });
  if (!result.ok) return { status: result.error === NO_TOKEN ? "sin-token" : "no-disponible" };

  const byPeriod = new Map(
    result.data.flatMap((row) => {
      const raw = String(row.Periodo ?? "");
      const period = /^\d{6}$/.test(raw) ? toPeriod(`${raw.slice(0, 4)}-${raw.slice(4)}`) : null;
      return period ? ([[period, row]] as const) : [];
    }),
  );
  const period = [...byPeriod.keys()].sort().pop();
  if (!period) return { status: "no-disponible" };

  const latest = byPeriod.get(period);
  const previous = byPeriod.get(addMonths(period, -12));
  const rows = TRAMOS.map(({ key, label }) => {
    const total = Number(latest?.[`tot_${key}`]);
    const previousTotal = previous ? Number(previous[`tot_${key}`]) : NaN;
    return {
      label,
      goods: Number(latest?.[`bys_${key}`]),
      care: Number(latest?.[`cuid_${key}`]),
      total,
      yearChange: Number.isFinite(previousTotal) && previousTotal > 0 ? (total / previousTotal - 1) * 100 : null,
    };
  });

  const valid = rows.every(({ goods, care, total }) =>
    [goods, care, total].every((value) => Number.isFinite(value) && value > 0),
  );
  if (!valid) {
    console.error("[fuentes] canasta-crianza: la respuesta no tiene la forma documentada");
    return { status: "no-disponible" };
  }

  return { status: "ok", period, fetchedAt: result.fetchedAt, stale: result.stale, rows };
}

