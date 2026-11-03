import assert from "node:assert/strict";
import { test } from "node:test";
import { addMonths, monthsBetween, toPeriod } from "../normalize/periods";
import { cleanPoints, validatePoints, type Point } from "../normalize/validate";
import { monthlyChange, peak, ratio, relativeTo, yearOverYear, yearToDate } from "./changes";
import { adultEquivalents, needsSex, REFERENCE_HOUSEHOLD } from "./household";

const points = (values: Record<string, number>): Point[] =>
  Object.entries(values).map(([period, value]) => ({ period, value }));

test("los períodos cruzan el año sin errores", () => {
  assert.equal(addMonths("2026-01", -1), "2025-12");
  assert.equal(addMonths("2025-12", 1), "2026-01");
  assert.equal(addMonths("2026-09", -12), "2025-09");
  assert.equal(monthsBetween("2016-12", "2026-09"), 117);
  assert.equal(toPeriod("2026-09-01"), "2026-09");
  assert.equal(toPeriod("sin fecha"), null);
});

test("variaciones: reproducen el dato oficial del IPC de septiembre de 2026", () => {
  // Índices del CSV oficial. El INDEC publicó 1,9% mensual, 23,6% acumulado y 33,4% interanual.
  const ipc = points({
    "2025-09": 9384.0922,
    "2025-12": 10121.3715,
    "2026-08": 12276.766,
    "2026-09": 12514.1508,
  });
  assert.equal(monthlyChange(ipc).at(-1)?.value.toFixed(1), "1.9");
  assert.equal(yearOverYear(ipc).at(-1)?.value.toFixed(1), "33.4");
  assert.equal(yearToDate(ipc)?.toFixed(1), "23.6");
});

test("una variación sin el período de comparación no se inventa", () => {
  const series = points({ "2026-08": 100, "2026-09": 110 });
  assert.deepEqual(yearOverYear(series), []);
  assert.equal(yearToDate(series), undefined);
});

test("relativeTo: 100 en la base y mide contra la referencia", () => {
  const salary = points({ "2016-12": 100, "2026-08": 8040 });
  const prices = points({ "2016-12": 100, "2026-08": 10000 });
  const real = relativeTo(salary, prices, "2016-12");
  assert.equal(real[0].value, 100);
  assert.equal(real[1].value.toFixed(1), "80.4");
});

test("relativeTo: sin el período base no devuelve datos", () => {
  assert.deepEqual(relativeTo(points({ "2020-01": 1 }), points({ "2020-01": 1 }), "2019-01"), []);
});

test("ratio solo usa los períodos que ambas series comparten", () => {
  const result = ratio(points({ "2026-08": 376600, "2026-09": 383800 }), points({ "2026-09": 528318.67 }));
  assert.equal(result.length, 1);
  assert.equal(result[0].value.toFixed(2), "0.73");
});

test("peak encuentra el máximo", () => {
  assert.equal(peak(points({ "2023-11": 12.8, "2023-12": 25.5, "2024-01": 20.6 }))?.period, "2023-12");
  assert.equal(peak([]), undefined);
});

test("cleanPoints descarta futuro, nulos y tramos anteriores, y aplica la escala", () => {
  const cleaned = cleanPoints(
    [
      { date: "2015-01-01", value: 0.5 },
      { date: "2026-08-01", value: 0.3 },
      { date: "2026-09-01", value: null },
      { date: "2027-04-01", value: 0.4 },
      { date: "fila rota", value: 0.9 },
    ],
    { now: "2026-11-02T12:00:00Z", from: "2016-07", scale: 100 },
  );
  assert.deepEqual(cleaned, [{ period: "2026-08", value: 30 }]);
});

test("validatePoints detecta huecos, saltos, rangos y series cortas", () => {
  const rules = { minPoints: 2, stepMonths: 1, maxStepChange: 0.5, range: [0, 100] as [number, number] };
  assert.deepEqual(validatePoints(points({ "2026-01": 10, "2026-02": 12 }), rules), []);
  assert.match(validatePoints(points({ "2026-01": 10, "2026-03": 12 }), rules)[0], /hueco/);
  assert.match(validatePoints(points({ "2026-01": 10, "2026-02": 50 }), rules)[0], /salto/);
  assert.match(validatePoints(points({ "2026-01": 10, "2026-02": 12, "2026-03": 13 }), { ...rules, range: [0, 11] })[0], /rango/);
  assert.match(validatePoints(points({ "2026-01": 10 }), rules)[0], /datos/);
});

test("el hogar de referencia del INDEC suma 3,09 adultos equivalentes", () => {
  assert.equal(adultEquivalents(REFERENCE_HOUSEHOLD), 3.09);
  assert.equal(adultEquivalents([]), 0);
});

test("el sexo solo cuenta desde los 10 años, como en la tabla oficial", () => {
  assert.equal(needsSex("6"), false);
  assert.equal(needsSex("10"), true);
  assert.equal(adultEquivalents([{ ageGroupId: "6", sex: "mujer" }]), adultEquivalents([{ ageGroupId: "6", sex: "varon" }]));
});
