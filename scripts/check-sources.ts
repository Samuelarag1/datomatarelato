// Control de las fuentes reales: npm run check:sources
// Detecta columnas renombradas, fechas corridas, huecos y datos faltantes antes de publicarlos.
// Con INDEC_API_TOKEN en .env.local también prueba la API del INDEC. Sale con código 1 si algo falla.

import { lastPoint, yearOverYear } from "../lib/analysis/changes";
import { GBA_PRODUCTS, PLAIN_GROUP_NAMES, PRICE_RULES, PRICES_FROM, REGIONAL_PRODUCTS } from "../lib/indicators/products";
import {
  basketFor,
  cityPoverty,
  HABER_MINIMO,
  ipcDivisions,
  ipcGeneral,
  POBREZA_TOTAL_HOGARES,
  POBREZA_TOTAL_PERSONAS,
  regionalBasket,
  SALARIO_NO_REGISTRADO,
  SALARIO_PRIVADO,
  SALARIO_PUBLICO,
  SMVM_MENSUAL,
  type SeriesDef,
} from "../lib/indicators/registry";
import { cleanPoints, validatePoints, type Point } from "../lib/normalize/validate";
import { CITIES, REGION_LIST } from "../lib/places";
import { fetchIndecRows } from "../lib/sources/api-indec";
import { fetchCsvTable, readColumn, type CsvTable } from "../lib/sources/datos-csv";
import { fetchPreciosWorkbook } from "../lib/sources/indec-xls";

let failures = 0;
const ok = (message: string) => console.log(`  ok    ${message}`);
const fail = (message: string) => {
  failures++;
  console.log(`  FALLA ${message}`);
};

// Valores publicados por el INDEC. Si la fuente corre fechas o cruza columnas, dejan de coincidir.
const ANCHORS: { def: SeriesDef; period: string; value: number; tolerance: number; what: string }[] = [
  { def: POBREZA_TOTAL_PERSONAS, period: "2024-01", value: 52.9, tolerance: 0.05, what: "pobreza S1 2024" },
  { def: POBREZA_TOTAL_PERSONAS, period: "2025-01", value: 31.6, tolerance: 0.05, what: "pobreza S1 2025" },
  { def: POBREZA_TOTAL_HOGARES, period: "2026-01", value: 24.4, tolerance: 0.05, what: "pobreza en hogares S1 2026" },
  { def: HABER_MINIMO, period: "2026-08", value: 419775.93, tolerance: 1, what: "haber mínimo ago-2026" },
  { def: regionalBasket("cbt", "gba"), period: "2026-06", value: 495622.3, tolerance: 1, what: "canasta GBA jun-2026 en el CSV regional" },
];

const now = new Date().toISOString();
const tables = new Map<string, Promise<CsvTable>>();
const readTable = (url: string) => {
  if (!tables.has(url)) tables.set(url, fetchCsvTable(url));
  return tables.get(url) as Promise<CsvTable>;
};

async function loadPoints(def: SeriesDef): Promise<Point[] | null> {
  try {
    const raw = readColumn(await readTable(def.url), def.column);
    if (!raw) {
      fail(`${def.label}: no existe la columna ${def.column}`);
      return null;
    }
    const points = cleanPoints(raw, { now, from: def.from, scale: def.scale });
    const issues = validatePoints(points, def.rules);
    if (issues.length > 0) {
      fail(`${def.label} (${def.column}): ${issues.slice(0, 3).join("; ")}`);
      return null;
    }
    return points;
  } catch (error) {
    fail(`${def.label} (${def.column}): ${error instanceof Error ? error.message : error}`);
    return null;
  }
}

async function checkGroup(name: string, defs: SeriesDef[]) {
  const results = await Promise.all(defs.map(loadPoints));
  const good = results.filter((points): points is Point[] => points !== null);
  const last = good.map((points) => points[points.length - 1].period).sort();
  if (good.length > 0) ok(`${name}: ${good.length}/${defs.length} series, último dato ${last[0]} a ${last[last.length - 1]}`);
}

async function checkCsv() {
  console.log("\nCSV de datos.gob.ar");
  const regions = REGION_LIST.map(({ key }) => key);
  await checkGroup("Precios general", [ipcGeneral(null), ...regions.map(ipcGeneral)]);
  await checkGroup("Rubros", [null, ...regions].flatMap((region) => ipcDivisions(region)));
  await checkGroup("Canasta total por región", regions.map((region) => regionalBasket("cbt", region)));
  await checkGroup("Canasta alimentaria por región", regions.map((region) => regionalBasket("cba", region)));
  await checkGroup("Canastas GBA mensuales", [basketFor("cbt", "gba"), basketFor("cba", "gba")]);
  await checkGroup("Sueldos", [SALARIO_PRIVADO, SALARIO_PUBLICO, SALARIO_NO_REGISTRADO]);
  await checkGroup("Salario mínimo y jubilación", [SMVM_MENSUAL, HABER_MINIMO]);
  await checkGroup("Pobreza total", [POBREZA_TOTAL_PERSONAS, POBREZA_TOTAL_HOGARES]);
  await checkGroup("Pobreza por ciudad", Object.keys(CITIES).map(cityPoverty));

  console.log("\nValores oficiales de control");
  for (const { def, period, value, tolerance, what } of ANCHORS) {
    const points = await loadPoints(def);
    const found = points?.find((point) => point.period === period)?.value;
    if (found !== undefined && Math.abs(found - value) <= tolerance) ok(`${what}: ${found.toFixed(2)}`);
    else fail(`${what}: se esperaba ${value} y se leyó ${found}`);
  }
}

async function checkWorkbook() {
  console.log("\nPlanilla de precios del INDEC");
  try {
    const { gba, regional } = await fetchPreciosWorkbook();
    const labels = new Map(gba.map((row) => [row.label, row]));
    for (const product of GBA_PRODUCTS) {
      const row = labels.get(product.variety);
      if (!row) {
        fail(`GBA: no se encontró "${product.variety}"`);
        continue;
      }
      const issues = validatePoints(row.points.filter((point) => point.period >= PRICES_FROM), PRICE_RULES);
      if (issues.length > 0) fail(`${product.variety}: ${issues.slice(0, 2).join("; ")}`);
    }
    const lastPrice = gba[0].points.at(-1)?.period;
    const lastIpc = (await loadPoints(ipcGeneral(null)))?.at(-1)?.period;
    if (lastPrice === lastIpc) ok(`${GBA_PRODUCTS.length} productos GBA; último dato ${lastPrice}, igual que el IPC`);
    else fail(`la planilla llega a ${lastPrice} y el IPC a ${lastIpc}`);

    for (const region of REGION_LIST) {
      for (const product of REGIONAL_PRODUCTS) {
        const row = regional.find((candidate) => candidate.region === region.sourceLabel && candidate.label === product.variety);
        if (!row) {
          fail(`${region.name}: no se encontró "${product.variety}"`);
          continue;
        }
        const issues = validatePoints(row.points.filter((point) => point.period >= PRICES_FROM), PRICE_RULES);
        if (issues.length > 0) fail(`${region.name}, ${product.variety}: ${issues.slice(0, 2).join("; ")}`);
      }
    }
    ok(`${REGIONAL_PRODUCTS.length} productos en ${REGION_LIST.length} regiones`);

    // En Series de Tiempo estas dos etiquetas estaban cruzadas: desodorante nunca es más barato que jabón.
    const soap = labels.get("Jabón de tocador")?.points.at(-1)?.value ?? 0;
    const deodorant = labels.get("Desodorante")?.points.at(-1)?.value ?? 0;
    if (deodorant > soap) ok("desodorante y jabón de tocador sin cruzar");
    else fail(`desodorante ($${deodorant}) y jabón de tocador ($${soap}) parecen cruzados`);
  } catch (error) {
    fail(`planilla de precios: ${error instanceof Error ? error.message : error}`);
  }
}

async function checkIndecApi() {
  console.log("\nAPI del INDEC");
  const token = process.env.INDEC_API_TOKEN?.trim();
  if (!token) {
    console.log("  --    sin INDEC_API_TOKEN: se omite. Cargalo en .env.local para probarla.");
    return;
  }

  try {
    const crianza = await fetchIndecRows("canasta-crianza", { order: "Periodo" }, token);
    const last = crianza.at(-1);
    const complete = ["tot_men1", "bys_men1", "cuid_men1", "tot_6a12"].every((column) => Number(last?.[column]) > 0);
    if (complete) ok(`canasta-crianza: ${crianza.length} filas hasta ${last?.Periodo}`);
    else fail("canasta-crianza no tiene la forma documentada");

    const pobreza = await fetchIndecRows("pobreza_eph", { order: "periodo.desc", limit: "1" }, token);
    const csvPobreza = await loadPoints(POBREZA_TOTAL_PERSONAS);
    const csvLast = csvPobreza?.at(-1);
    if (csvLast && Math.abs(Number(pobreza[0]?.tasa_pobreza_personas) - csvLast.value) < 0.05) {
      ok(`pobreza_eph coincide con el CSV: ${pobreza[0]?.tasa_pobreza_personas}%; indigencia ${pobreza[0]?.tasa_indigencia_personas}%`);
    } else {
      fail(`pobreza_eph (${pobreza[0]?.tasa_pobreza_personas}) no coincide con el CSV (${csvLast?.value})`);
    }

    const ipc = await loadPoints(ipcGeneral("noa"));
    const computed = ipc && lastPoint(yearOverYear(ipc));
    if (computed) {
      const code = computed.period.replace("-", "");
      const official = await fetchIndecRows("ipc_nacional", {
        periodo: `eq.${code}`,
        region: "eq.Noroeste",
        nivel: "eq.Nivel General",
        tipo_de_indicador: "eq.v_ia",
        select: "valor",
      }, token);
      const value = Number(official[0]?.valor);
      if (Math.abs(value - computed.value) < 0.1) ok(`variación interanual del Noroeste: API ${value}%, calculada ${computed.value.toFixed(1)}%`);
      else fail(`variación interanual del Noroeste: API ${value}%, calculada ${computed.value.toFixed(1)}%`);

      for (const region of REGION_LIST) {
        const groups = await fetchIndecRows("ipc_nacional", {
          periodo: `eq.${code}`,
          region: `eq.${region.sourceLabel}`,
          nivel: "eq.Grupo",
          tipo_de_indicador: "eq.v_ia",
          select: "codigo",
        }, token);
        const unnamed = groups.filter((group) => !PLAIN_GROUP_NAMES[String(group.codigo)]);
        if (groups.length === 0) fail(`${region.name}: la API no devolvió rubros para ${code}`);
        else if (unnamed.length > 0) fail(`${region.name}: rubros sin nombre claro: ${unnamed.map((group) => group.codigo).join(", ")}`);
      }
      ok("rubros por región, con nombre claro");
    }

    const year = new Date().getFullYear();
    const poblacion = await fetchIndecRows("estimaciones_poblacion_departamento_2022_2035", {
      fecha: `eq.${year}`,
      select: "poblacion",
      order: "departamento_cod,sexo_cod",
    }, token);
    const total = poblacion.reduce((sum, row) => sum + Number(row.poblacion), 0);
    // El INDEC estima 46,5 millones para 2026 y 47,5 para 2040.
    if (total > 45_000_000 && total < 49_000_000) ok(`población ${year}: ${total.toLocaleString("es-AR")}`);
    else fail(`población ${year} fuera de rango: ${total}`);
  } catch (error) {
    fail(`API del INDEC: ${error instanceof Error ? error.message : error}`);
  }
}

async function main() {
  console.log(`Control de fuentes: ${now}`);
  await checkCsv();
  await checkWorkbook();
  await checkIndecApi();

  console.log(failures === 0 ? "\nTodo en orden." : `\n${failures} problema(s) para revisar.`);
  process.exitCode = failures === 0 ? 0 : 1;
}

void main();
