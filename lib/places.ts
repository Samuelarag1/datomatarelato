// Cada lugar sabe qué dato le corresponde: el INDEC no publica todo por provincia.
// Precios y canastas se miden por región; la pobreza, por ciudad (aglomerado urbano).

export type RegionKey = "gba" | "pampeana" | "nea" | "noa" | "cuyo" | "patagonia";

export interface Region {
  key: RegionKey;
  name: string;
  /** "en el Noroeste", listo para usar en una frase. */
  inName: string;
  members: string;
  /** Nombre de la región en la planilla de precios y en la API del INDEC. */
  sourceLabel: string;
  /** Columna en los CSV de canastas regionales. */
  basketColumn: string;
}

export const REGIONS: Record<RegionKey, Region> = {
  gba: {
    key: "gba",
    name: "Gran Buenos Aires",
    inName: "en Gran Buenos Aires",
    members: "la Ciudad de Buenos Aires y los 24 partidos del conurbano",
    sourceLabel: "GBA",
    basketColumn: "gran_buenos_aires",
  },
  pampeana: {
    key: "pampeana",
    name: "Pampeana",
    inName: "en la región Pampeana",
    members: "Córdoba, Entre Ríos, La Pampa, Santa Fe y el interior de Buenos Aires",
    sourceLabel: "Pampeana",
    basketColumn: "pampeana",
  },
  nea: {
    key: "nea",
    name: "Noreste",
    inName: "en el Noreste",
    members: "Chaco, Corrientes, Formosa y Misiones",
    sourceLabel: "Noreste",
    basketColumn: "noreste",
  },
  noa: {
    key: "noa",
    name: "Noroeste",
    inName: "en el Noroeste",
    members: "Catamarca, Jujuy, La Rioja, Salta, Santiago del Estero y Tucumán",
    sourceLabel: "Noroeste",
    basketColumn: "noroeste",
  },
  cuyo: {
    key: "cuyo",
    name: "Cuyo",
    inName: "en Cuyo",
    members: "Mendoza, San Juan y San Luis",
    sourceLabel: "Cuyo",
    basketColumn: "cuyo",
  },
  patagonia: {
    key: "patagonia",
    name: "Patagonia",
    inName: "en la Patagonia",
    members: "Chubut, Neuquén, Río Negro, Santa Cruz y Tierra del Fuego",
    sourceLabel: "Patagonia",
    basketColumn: "patagonia",
  },
};

export const REGION_LIST = Object.values(REGIONS);

/** Ciudades relevadas por la EPH. La clave coincide con el nombre de columna del CSV de pobreza. */
export const CITIES: Record<string, string> = {
  caba: "Ciudad de Buenos Aires",
  partidos_gran_buenos_aires: "Conurbano (24 partidos)",
  gran_mendoza: "Gran Mendoza",
  gran_san_juan: "Gran San Juan",
  san_luis_el_chorrillo: "San Luis y El Chorrillo",
  corrientes: "Corrientes",
  formosa: "Formosa",
  gran_resistencia: "Gran Resistencia",
  posadas: "Posadas",
  gran_tucuman_tafi_viejo: "Gran Tucumán y Tafí Viejo",
  gran_catamarca: "Gran Catamarca",
  jujuy_palpala: "Jujuy y Palpalá",
  la_rioja: "La Rioja",
  salta: "Salta",
  santiago_estero_la_banda: "Santiago del Estero y La Banda",
  gran_cordoba: "Gran Córdoba",
  gran_la_plata: "Gran La Plata",
  gran_rosario: "Gran Rosario",
  mar_plata_batan: "Mar del Plata y Batán",
  concordia: "Concordia",
  bahia_blanca_cerri: "Bahía Blanca y Cerri",
  gran_parana: "Gran Paraná",
  gran_santa_fe: "Gran Santa Fe",
  rio_cuarto: "Río Cuarto",
  santa_rosa_toay: "Santa Rosa y Toay",
  san_nicolas_villa_constitucion: "San Nicolás y Villa Constitución",
  comodoro_rivadavia_rada_tilly: "Comodoro Rivadavia y Rada Tilly",
  neuquen_plottier: "Neuquén y Plottier",
  rio_gallegos: "Río Gallegos",
  ushuaia_rio_grande: "Ushuaia y Río Grande",
  rawson_trelew: "Rawson y Trelew",
  viedma_carmen_patagones: "Viedma y Carmen de Patagones",
};

export interface Place {
  slug: string;
  name: string;
  /** "en Tucumán", listo para usar en una frase. */
  inName: string;
  /** Código de jurisdicción del INDEC, igual al id de provincia en Georef. Null: todo el país. */
  provinceId: string | null;
  region: RegionKey | null;
  cities: string[];
}

const province = (
  slug: string,
  name: string,
  provinceId: string,
  region: RegionKey,
  cities: string[],
): Place => ({ slug, name, inName: `en ${name}`, provinceId, region, cities });

export const COUNTRY: Place = {
  slug: "argentina",
  name: "Todo el país",
  inName: "en todo el país",
  provinceId: null,
  region: null,
  cities: [],
};

const CABA = province("caba", "Ciudad de Buenos Aires", "02", "gba", ["caba"]);
const CONURBANO: Place = {
  ...province("conurbano", "Conurbano bonaerense", "06", "gba", ["partidos_gran_buenos_aires"]),
  inName: "en el conurbano",
};
const BUENOS_AIRES: Place = {
  ...province("buenos-aires", "Buenos Aires (interior)", "06", "pampeana", [
    "gran_la_plata",
    "mar_plata_batan",
    "bahia_blanca_cerri",
    "san_nicolas_villa_constitucion",
  ]),
  inName: "en el interior de Buenos Aires",
};

export const PLACES: Place[] = [
  COUNTRY,
  CABA,
  CONURBANO,
  BUENOS_AIRES,
  province("catamarca", "Catamarca", "10", "noa", ["gran_catamarca"]),
  province("chaco", "Chaco", "22", "nea", ["gran_resistencia"]),
  province("chubut", "Chubut", "26", "patagonia", ["comodoro_rivadavia_rada_tilly", "rawson_trelew"]),
  province("cordoba", "Córdoba", "14", "pampeana", ["gran_cordoba", "rio_cuarto"]),
  province("corrientes", "Corrientes", "18", "nea", ["corrientes"]),
  province("entre-rios", "Entre Ríos", "30", "pampeana", ["gran_parana", "concordia"]),
  province("formosa", "Formosa", "34", "nea", ["formosa"]),
  province("jujuy", "Jujuy", "38", "noa", ["jujuy_palpala"]),
  province("la-pampa", "La Pampa", "42", "pampeana", ["santa_rosa_toay"]),
  province("la-rioja", "La Rioja", "46", "noa", ["la_rioja"]),
  province("mendoza", "Mendoza", "50", "cuyo", ["gran_mendoza"]),
  province("misiones", "Misiones", "54", "nea", ["posadas"]),
  province("neuquen", "Neuquén", "58", "patagonia", ["neuquen_plottier"]),
  province("rio-negro", "Río Negro", "62", "patagonia", ["viedma_carmen_patagones"]),
  province("salta", "Salta", "66", "noa", ["salta"]),
  province("san-juan", "San Juan", "70", "cuyo", ["gran_san_juan"]),
  province("san-luis", "San Luis", "74", "cuyo", ["san_luis_el_chorrillo"]),
  province("santa-cruz", "Santa Cruz", "78", "patagonia", ["rio_gallegos"]),
  province("santa-fe", "Santa Fe", "82", "pampeana", ["gran_rosario", "gran_santa_fe"]),
  province("santiago-del-estero", "Santiago del Estero", "86", "noa", ["santiago_estero_la_banda"]),
  province("tierra-del-fuego", "Tierra del Fuego", "94", "patagonia", ["ushuaia_rio_grande"]),
  province("tucuman", "Tucumán", "90", "noa", ["gran_tucuman_tafi_viejo"]),
];

/** Los 24 partidos que el INDEC incluye en el Gran Buenos Aires, con su id en Georef. */
export const GBA_PARTIDOS = new Set([
  "06028", "06035", "06091", "06260", "06270", "06274", "06371", "06408",
  "06410", "06412", "06427", "06434", "06490", "06515", "06539", "06560",
  "06568", "06658", "06749", "06756", "06760", "06805", "06840", "06861",
]);

export function getPlace(slug: string | null | undefined): Place | undefined {
  return PLACES.find((place) => place.slug === slug);
}

/** El nombre para usar en medio de una frase: "para Tucumán", "para todo el país". */
export const placeLabel = (place: Place) => (place === COUNTRY ? "todo el país" : place.name);

/**
 * Traduce la respuesta de Georef a un lugar. La provincia de Buenos Aires se divide porque el
 * conurbano integra la región Gran Buenos Aires y el resto, la región Pampeana.
 */
export function placeFromLocation(provinceId: string | null, departmentId: string | null): Place | undefined {
  if (!provinceId) return undefined;
  if (provinceId === "06") return departmentId && GBA_PARTIDOS.has(departmentId) ? CONURBANO : BUENOS_AIRES;
  return PLACES.find((place) => place.provinceId === provinceId);
}

/** Cómo se relaciona el lugar con la región en la que el INDEC mide los precios y las canastas. */
export function regionNote(place: Place, measured: string): string {
  if (!place.region) return `Elegí tu provincia para ver ${measured} de tu región.`;
  const region = REGIONS[place.region];
  if (region.key === "gba") {
    return `El INDEC mide ${measured} de la Ciudad de Buenos Aires y el conurbano en conjunto, como región Gran Buenos Aires.`;
  }
  if (place === BUENOS_AIRES) {
    return `El INDEC mide ${measured} por región: el interior de Buenos Aires forma parte de la región Pampeana.`;
  }
  return `El INDEC mide ${measured} por región, no por provincia: ${place.name} forma parte de la región ${region.name}.`;
}
