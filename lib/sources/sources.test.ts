import assert from "node:assert/strict";
import { test } from "node:test";
import * as XLSX from "xlsx";
import { parseCsv, readColumn } from "./datos-csv";
import { parsePreciosWorkbook } from "./indec-xls";
import { readThrough } from "./read-through";

test("si una fuente se cae sin datos previos, avisa en lugar de inventar", async (context) => {
  context.mock.method(console, "error", () => {});
  const result = await readThrough("sin-previo", async () => {
    throw new Error("caída");
  });
  assert.equal(result.ok, false);
});

test("si una fuente se cae después de responder, sirve el último dato marcado como viejo", async (context) => {
  context.mock.method(console, "error", () => {});
  const first = await readThrough("con-previo", async () => "dato bueno");
  assert.deepEqual([first.ok, first.ok && first.stale], [true, false]);

  const second = await readThrough("con-previo", async () => {
    throw new Error("caída");
  });
  assert.ok(second.ok);
  assert.equal(second.data, "dato bueno");
  assert.equal(second.stale, true);
  assert.equal(second.fetchedAt, first.fetchedAt);

  const recovered = await readThrough("con-previo", async () => "dato nuevo");
  assert.ok(recovered.ok);
  assert.equal(recovered.data, "dato nuevo");
  assert.equal(recovered.stale, false);
});

test("parseCsv y readColumn leen por nombre de columna", () => {
  const table = parseCsv("indice_tiempo,a,b\r\n2026-08-01,1.5,\r\n2026-09-01,2.5,x\r\n");
  assert.deepEqual(readColumn(table, "a"), [
    { date: "2026-08-01", value: 1.5 },
    { date: "2026-09-01", value: 2.5 },
  ]);
});

test("readColumn: celdas vacías o no numéricas son nulos, nunca ceros", () => {
  const table = parseCsv("indice_tiempo,b\n2026-08-01,\n2026-09-01,x\n");
  assert.deepEqual(readColumn(table, "b"), [
    { date: "2026-08-01", value: null },
    { date: "2026-09-01", value: null },
  ]);
});

test("readColumn devuelve null si la fuente renombró la columna", () => {
  assert.equal(readColumn(parseCsv("indice_tiempo,a\n2026-08-01,1\n"), "otra"), null);
});

function workbookFixture(): Uint8Array {
  const gba = [
    ["Precios GBA"],
    [],
    ["Variedad", "Unidad de medida", "Año 2016", null, "Año 2017", 2018],
    [null, null, "Noviembre", "Diciembre", "Enero", "Enero"],
    [null, null, "Pesos"],
    [],
    ["Asado", "kg", 100, 110, 120, 130],
    ["Jabón de tocador ", "125 g", "///", 20, 21, 22],
    ["Nota: se presentan precios promedio"],
  ];
  const nacional = [
    ["Precios regionales"],
    [],
    ["Región", "Productos seleccionados", "Unidad de medida", "Año 2017"],
    [null, null, null, "Junio", "Julio"],
    [null, null, null, "Pesos"],
    [],
    ["GBA", "Pan francés", "kg", 38.64, 39.12],
    ["Noreste", "Pan francés", "kg", 30, "///"],
  ];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(nacional), "Nacional");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(gba), "GBA");
  return XLSX.write(workbook, { type: "array", bookType: "biff8" });
}

test("la planilla de precios asigna períodos a través del cambio de año", () => {
  const { gba } = parsePreciosWorkbook(workbookFixture());
  assert.deepEqual(gba[0], {
    label: "Asado",
    unit: "kg",
    points: [
      { period: "2016-11", value: 100 },
      { period: "2016-12", value: 110 },
      { period: "2017-01", value: 120 },
      { period: "2018-01", value: 130 },
    ],
  });
});

test("la planilla de precios omite el signo /// sin convertirlo en cero, y limpia etiquetas", () => {
  const { gba, regional } = parsePreciosWorkbook(workbookFixture());
  assert.equal(gba[1].label, "Jabón de tocador");
  assert.deepEqual(gba[1].points.map((point) => point.period), ["2016-12", "2017-01", "2018-01"]);
  assert.equal(regional[1].region, "Noreste");
  assert.equal(regional[1].points.length, 1);
});

test("la planilla de precios ignora las notas al pie", () => {
  const { gba } = parsePreciosWorkbook(workbookFixture());
  assert.equal(gba.length, 2);
});
