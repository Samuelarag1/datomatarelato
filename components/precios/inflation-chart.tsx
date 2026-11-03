"use client";

import { useState } from "react";
import { TimeSeriesChart } from "@/components/charts/time-series-chart";
import { Segmented } from "@/components/editorial/controls";
import { formatPercent, formatPeriod } from "@/lib/format/es-ar";
import type { Point } from "@/lib/normalize/validate";

const RANGES = [
  { value: "year", label: "Último año" },
  { value: "all", label: "Desde 2017" },
];

export function InflationChart({ monthly }: { monthly: Point[] }) {
  const [range, setRange] = useState("year");
  const lastYear = range === "year";
  const points = lastYear ? monthly.slice(-12) : monthly;
  const last = points[points.length - 1];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[15px] font-medium">Aumento de precios, mes a mes</p>
        <Segmented label="Período del gráfico" options={RANGES} value={range} onChange={setRange} />
      </div>
      <TimeSeriesChart
        series={[{ key: "precios", label: "Aumento mensual", color: "var(--series-1)", points }]}
        frequency="mes"
        format="percent"
        mode={lastYear ? "bar" : "area"}
        yDomain={[0, "auto"]}
        height={260}
        summary={`Aumento mensual de precios. Último dato: ${formatPercent(last.value)} en ${formatPeriod(last.period)}.`}
      />
    </div>
  );
}
