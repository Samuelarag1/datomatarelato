"use client";

import { useMemo } from "react";
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatPeriod, formatTick, formatValue, type Frequency, type ValueFormat } from "@/lib/format/es-ar";
import { mergeSeries, type ChartRow, type ChartSeries } from "@/lib/format/tables";

interface TimeSeriesChartProps {
  series: ChartSeries[];
  frequency: Frequency;
  format: ValueFormat;
  mode?: "line" | "area" | "bar";
  height?: number;
  yDomain?: [number | "auto", number | "auto"];
  referenceLine?: { y: number; label: string };
  /** Descripción para lectores de pantalla. */
  summary: string;
}

function pickTicks(rows: ChartRow[], frequency: Frequency): string[] {
  const periods = rows.map((row) => row.period);
  if (frequency === "mes") {
    if (periods.length <= 15) return periods.filter((_, index) => index % 3 === (periods.length - 1) % 3);
    if (periods.length <= 40) return periods.filter((period) => /-(01|07)$/.test(period));
  }
  return periods.filter((period) => period.endsWith("-01"));
}

function tickLabel(period: string, frequency: Frequency, ticks: string[]): string {
  const yearly = ticks.every((tick) => tick.endsWith("-01"));
  return yearly ? period.slice(0, 4) : formatPeriod(period, frequency, true);
}

/** Con finales muy próximos las etiquetas se pisarían: quedan la leyenda y el detalle del cursor. */
function endLabelsFit(series: ChartSeries[]): boolean {
  const ends = series.map((item) => item.points[item.points.length - 1]?.value).filter((value) => value !== undefined);
  const values = series.flatMap((item) => item.points.map((point) => point.value));
  const range = Math.max(...values) - Math.min(...values) || 1;
  return ends.every((value, index) => ends.slice(index + 1).every((other) => Math.abs(value - other) / range > 0.07));
}

function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <ul className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-2">
      {items.map(({ label, color }) => (
        <li key={label} className="flex items-center gap-1.5">
          <span aria-hidden="true" className="h-0.5 w-4 rounded-full" style={{ backgroundColor: color }} />
          {label}
        </li>
      ))}
    </ul>
  );
}

function ChartTooltip({
  active,
  payload,
  series,
  frequency,
  format,
}: {
  active?: boolean;
  payload?: readonly { payload?: ChartRow }[];
  series: ChartSeries[];
  frequency: Frequency;
  format: ValueFormat;
}) {
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;

  return (
    <div className="rounded-md border border-rule bg-surface px-3 py-2 text-sm shadow-sm">
      <p className="text-xs text-ink-3">{formatPeriod(row.period, frequency)}</p>
      <ul className="mt-1 space-y-0.5">
        {series.map(({ key, label, color }) => {
          const value = row[key];
          return (
            <li key={key} className="flex items-center gap-2">
              {series.length > 1 ? (
                <span aria-hidden="true" className="h-0.5 w-3 rounded-full" style={{ backgroundColor: color }} />
              ) : null}
              <span className="font-semibold">{typeof value === "number" ? formatValue(value, format) : "sin dato"}</span>
              {series.length > 1 ? <span className="text-ink-3">{label}</span> : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function TimeSeriesChart({
  series,
  frequency,
  format,
  mode = "line",
  height = 280,
  yDomain,
  referenceLine,
  summary,
}: TimeSeriesChartProps) {
  const rows = useMemo(() => mergeSeries(series), [series]);
  const ticks = useMemo(() => pickTicks(rows, frequency), [rows, frequency]);
  const showEndLabels = mode !== "bar" && endLabelsFit(series);

  const renderEndDot = (color: string, lastIndex: number) =>
    function EndDot(props: { cx?: number; cy?: number; index?: number; value?: number | number[] }) {
      const { cx, cy, index, value } = props;
      if (index !== lastIndex || cx === undefined || cy === undefined) return <g key={index} />;
      // En un área, Recharts entrega [base, valor].
      const shown = Array.isArray(value) ? value[1] : value;
      return (
        <g key={index}>
          <circle cx={cx} cy={cy} r={4.5} fill={color} stroke="var(--surface)" strokeWidth={2} />
          {showEndLabels && typeof shown === "number" ? (
            <text x={cx + 9} y={cy + 4} fontSize={12} fontWeight={600} fill="var(--ink)">
              {formatValue(shown, format)}
            </text>
          ) : null}
        </g>
      );
    };

  const legendItems = [
    ...(series.length > 1 ? series.map(({ label, color }) => ({ label, color })) : []),
    ...(referenceLine ? [{ label: referenceLine.label, color: "var(--ink-3)" }] : []),
  ];

  return (
    <div>
      {legendItems.length > 0 ? <Legend items={legendItems} /> : null}
      <div style={{ height }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={rows}
            margin={{ top: 8, right: mode === "bar" ? 4 : 52, bottom: 0, left: 0 }}
            barCategoryGap="22%"
            title={summary}
          >
            <CartesianGrid vertical={false} stroke="var(--rule)" />
            <XAxis
              dataKey="period"
              ticks={ticks}
              interval="preserveStart"
              minTickGap={26}
              tickFormatter={(period: string) => tickLabel(period, frequency, ticks)}
              tick={{ fill: "var(--ink-3)", fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: "var(--rule-strong)" }}
            />
            <YAxis
              width={44}
              domain={yDomain ?? (mode === "line" ? ["auto", "auto"] : [0, "auto"])}
              tickFormatter={(value: number) => formatTick(value, format)}
              tick={{ fill: "var(--ink-3)", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              isAnimationActive={false}
              cursor={mode === "bar" ? { fill: "var(--surface-2)" } : { stroke: "var(--rule-strong)" }}
              content={(props) => (
                <ChartTooltip
                  active={props.active}
                  payload={props.payload as readonly { payload?: ChartRow }[]}
                  series={series}
                  frequency={frequency}
                  format={format}
                />
              )}
            />
            {referenceLine ? <ReferenceLine y={referenceLine.y} stroke="var(--ink-3)" /> : null}
            {series.map(({ key, label, color }) => {
              const lastIndex = rows.reduce((last, row, index) => (typeof row[key] === "number" ? index : last), -1);
              if (mode === "bar") {
                return (
                  <Bar key={key} dataKey={key} name={label} fill={color} radius={[3, 3, 0, 0]} maxBarSize={24} isAnimationActive={false} />
                );
              }
              if (mode === "area") {
                return (
                  <Area
                    key={key}
                    dataKey={key}
                    name={label}
                    type="linear"
                    stroke={color}
                    strokeWidth={2}
                    fill={color}
                    fillOpacity={0.08}
                    dot={renderEndDot(color, lastIndex)}
                    activeDot={{ r: 4.5, stroke: "var(--surface)", strokeWidth: 2 }}
                    isAnimationActive={false}
                  />
                );
              }
              return (
                <Line
                  key={key}
                  dataKey={key}
                  name={label}
                  type="linear"
                  stroke={color}
                  strokeWidth={2}
                  dot={renderEndDot(color, lastIndex)}
                  activeDot={{ r: 4.5, stroke: "var(--surface)", strokeWidth: 2 }}
                  connectNulls={false}
                  isAnimationActive={false}
                />
              );
            })}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
