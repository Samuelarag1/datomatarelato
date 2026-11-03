import type { Frequency } from "../format/es-ar";
import type { Period } from "../normalize/periods";
import type { ValidationRules } from "../normalize/validate";
import { CITIES, REGIONS, type RegionKey } from "../places";

// Registro de indicadores. Sumar uno es sumar una entrada; cambiar de fuente no toca las pantallas.

export interface SeriesDef {
  label: string;
  url: string;
  column: string;
  frequency: Frequency;
  coverage: string;
  publisher: string;
  /** Primer período a mostrar. Evita unir tramos que la fuente no considera comparables. */
  from?: Period;
  scale?: number;
  rules: ValidationRules;
}

const DATASETS = "https://infra.datos.gob.ar/catalog/sspm/dataset";
const IPC_GENERAL = `${DATASETS}/145/distribution/145.3/download/indice-precios-al-consumidor-nivel-general-base-diciembre-2016-mensual.csv`;
const IPC_DIVISIONES = `${DATASETS}/145/distribution/145.5/download/indice-precios-al-consumidor-apertura-por-capitulos-base-diciembre-2016-mensual.csv`;
const SALARIOS = `${DATASETS}/149/distribution/149.1/download/indice-salarios-periodicidad-mensual-base-octubre-2016.csv`;
const SMVM = `${DATASETS}/57/distribution/57.1/download/indice-salario-minimo-vital-movil-valores-mensuales-pesos-corrientes-desde-1988.csv`;
const HABER = `${DATASETS}/58/distribution/58.1/download/haber-minimo-jubilatorio-pesos-corrientes-valores-mensuales-desde-1971.csv`;
const CANASTAS_GBA = `${DATASETS}/150/distribution/150.1/download/valores-canasta-basica-alimentos-canasta-basica-total-mensual-2016.csv`;
const CBT_REGIONES = `${DATASETS}/446/distribution/446.1/download/canasta-basica-total-regiones-del-pais.csv`;
const CBA_REGIONES = `${DATASETS}/445/distribution/445.1/download/canasta-basica-alimentaria-regiones-del-pais.csv`;
const POBREZA_PERSONAS = `${DATASETS}/64/distribution/64.2/download/poblacion-con-ingresos-por-debajo-linea-pobreza-eph-continua.csv`;
const POBREZA_HOGARES = `${DATASETS}/63/distribution/63.2/download/hogares-con-ingresos-por-debajo-linea-pobreza-eph-continua.csv`;

const IPC_FROM: Period = "2016-12";
// El mayor salto real de un índice fue Educación en el Noroeste en mar-2024 (+76%, confirmado en la API del INDEC).
const MONTHLY_INDEX: ValidationRules = { minPoints: 100, stepMonths: 1, maxStepChange: 1 };
const MONTHLY_PESOS: ValidationRules = { minPoints: 100, stepMonths: 1, maxStepChange: 1 };
// Valores en porcentaje: si la fuente corriera columnas, se escaparían de este rango.
const SEMESTER_RATE: ValidationRules = { minPoints: 15, stepMonths: 6, range: [0, 100] };
// Las ciudades chicas pueden no tener dato en algún semestre: se muestra el hueco, no se completa.
const CITY_RATE: ValidationRules = { minPoints: 10, stepMonths: 6, toleratedGaps: 3, range: [0, 100] };

const regionSuffix = (region: RegionKey | null) => region ?? "nacional";
const regionCoverage = (region: RegionKey | null) => (region ? `Región ${REGIONS[region].name}` : "Todo el país");

function ipc(label: string, url: string, column: string, region: RegionKey | null): SeriesDef {
  return {
    label,
    url,
    column,
    frequency: "mes",
    coverage: regionCoverage(region),
    publisher: "INDEC",
    from: IPC_FROM,
    rules: MONTHLY_INDEX,
  };
}

/** Índice de precios general del país o de una región. */
export const ipcGeneral = (region: RegionKey | null) =>
  ipc("Precios", IPC_GENERAL, `ipc_ng_${regionSuffix(region)}`, region);

const DIVISIONS: [string, string][] = [
  ["Alimentos y bebidas sin alcohol", "alimentos_bebidas_no_alcoholicas"],
  ["Bebidas alcohólicas y cigarrillos", "bebidas_alcoholicas_tabaco"],
  ["Ropa y calzado", "prendas_vestir_calzado"],
  ["Vivienda, luz, gas y agua", "vivienda_agua_electricidad_combustibles"],
  ["Equipamiento del hogar", "equipamiento_mantenimientos_hogar"],
  ["Salud", "salud"],
  ["Transporte", "transporte"],
  ["Teléfono e internet", "comunicaciones"],
  ["Salidas y cultura", "recreacion_cultura"],
  ["Educación", "educacion"],
  ["Restaurantes y hoteles", "restaurantes_hoteles"],
  ["Otros bienes y servicios", "bienes_servicios_varios"],
];

/** Los 12 rubros del IPC. Es lo único disponible para el total del país y no requiere token. */
export const ipcDivisions = (region: RegionKey | null): SeriesDef[] =>
  DIVISIONS.map(([label, slug]) => ipc(label, IPC_DIVISIONES, `ipc_${slug}_${regionSuffix(region)}`, region));

const salary = (label: string, column: string): SeriesDef => ({
  label,
  url: SALARIOS,
  column,
  frequency: "mes",
  coverage: "Todo el país",
  publisher: "INDEC",
  from: IPC_FROM,
  rules: MONTHLY_INDEX,
});

export const SALARIO_PRIVADO = salary("Privado registrado", "indice_salarios_registrado_sector_privado");
export const SALARIO_PUBLICO = salary("Sector público", "indice_salarios_registrado_sector_publico");
export const SALARIO_NO_REGISTRADO = salary("Privado no registrado", "indice_salarios_no_registrado_sector_privado");

export const SMVM_MENSUAL: SeriesDef = {
  label: "Salario mínimo",
  url: SMVM,
  column: "salario_minimo_vital_movil_mensual",
  frequency: "mes",
  coverage: "Todo el país",
  publisher: "Secretaría de Trabajo",
  from: IPC_FROM,
  rules: MONTHLY_PESOS,
};

export const HABER_MINIMO: SeriesDef = {
  label: "Jubilación mínima",
  url: HABER,
  column: "mensual_pesos_corrientes",
  frequency: "mes",
  coverage: "Todo el país",
  publisher: "ANSES",
  from: IPC_FROM,
  rules: MONTHLY_PESOS,
};

export type BasketKind = "cbt" | "cba";

const BASKET_LABELS: Record<BasketKind, string> = {
  cbt: "Canasta básica total",
  cba: "Canasta básica alimentaria",
};

/** Canasta de una región, publicada en forma semestral. Sirve para comparar regiones en un mismo mes. */
export function regionalBasket(kind: BasketKind, region: RegionKey): SeriesDef {
  return {
    label: BASKET_LABELS[kind],
    url: kind === "cbt" ? CBT_REGIONES : CBA_REGIONES,
    column: REGIONS[region].basketColumn,
    frequency: "mes",
    coverage: regionCoverage(region),
    publisher: "INDEC",
    from: IPC_FROM,
    rules: MONTHLY_PESOS,
  };
}

/** Canasta para mostrar en un lugar: Gran Buenos Aires tiene una serie mensual más actualizada. */
export function basketFor(kind: BasketKind, region: RegionKey): SeriesDef {
  if (region !== "gba") return regionalBasket(kind, region);
  return {
    ...regionalBasket(kind, "gba"),
    url: CANASTAS_GBA,
    column: kind === "cbt" ? "canasta_basica_total" : "canasta_basica_alimentaria",
  };
}

const poverty = (label: string, url: string, column: string, coverage: string, rules: ValidationRules): SeriesDef => ({
  label,
  url,
  column,
  frequency: "semestre",
  coverage,
  publisher: "INDEC",
  // El CSV también trae 2003-2006, pero 2007-2015 no existe y no se unen esos tramos.
  from: "2016-07",
  scale: 100,
  rules,
});

export const POBREZA_TOTAL_PERSONAS = poverty(
  "Personas",
  POBREZA_PERSONAS,
  "poblacion_pobre_pct_total_continua",
  "31 ciudades del país",
  SEMESTER_RATE,
);
export const POBREZA_TOTAL_HOGARES = poverty(
  "Hogares",
  POBREZA_HOGARES,
  "hogares_pobres_pct_total_continua",
  "31 ciudades del país",
  SEMESTER_RATE,
);

/** Pobreza en personas de una ciudad relevada por la EPH. */
export const cityPoverty = (city: string): SeriesDef =>
  poverty(CITIES[city], POBREZA_PERSONAS, `poblacion_pobre_pct_${city}_continua`, CITIES[city], CITY_RATE);
