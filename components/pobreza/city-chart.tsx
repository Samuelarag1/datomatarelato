"use client";

import { useState } from "react";
import { TimeSeriesChart } from "@/components/charts/time-series-chart";
import { Segmented } from "@/components/editorial/controls";
import { formatPercent } from "@/lib/format/es-ar";
import type { Point } from "@/lib/normalize/validate";

interface City {
  label: string;
  points: Point[];
}

/** Evolución de una ciudad frente al total. Con varias ciudades, se elige de a una para no saturar. */
export function CityChart({ cities, total }: { cities: City[]; total: Point[] }) {
  const [selected, setSelected] = useState(cities[0].label);
  const city = cities.find(({ label }) => label === selected) ?? cities[0];
  const last = city.points[city.points.length - 1];

  return (
    <div>
      {cities.length > 1 ? (
        <div className="mb-4">
          <Segmented
            label="Ciudad"
            options={cities.map(({ label }) => ({ value: label, label }))}
            value={selected}
            onChange={setSelected}
          />
        </div>
      ) : null}
      <TimeSeriesChart
        series={[
          { key: "ciudad", label: city.label, color: "var(--series-1)", points: city.points },
          { key: "total", label: "Promedio de las 31 ciudades", color: "var(--series-2)", points: total },
        ]}
        frequency="semestre"
        format="percent"
        yDomain={[0, "auto"]}
        height={280}
        summary={`Personas bajo la línea de pobreza en ${city.label} y en el promedio de las 31 ciudades. Último dato de ${city.label}: ${formatPercent(last.value)}.`}
      />
    </div>
  );
}
