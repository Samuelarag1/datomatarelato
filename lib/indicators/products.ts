// Productos que se muestran. `variety` es el nombre exacto de la fila en la planilla del INDEC.
// El INDEC publica 14 productos por región y 59 en Gran Buenos Aires.

export interface ProductDef {
  variety: string;
  label: string;
}

/** Disponibles en las seis regiones. Primero los más cotidianos: son los que se ven sin expandir. */
export const REGIONAL_PRODUCTS: ProductDef[] = [
  { variety: "Pan francés", label: "Pan francés" },
  { variety: "Leche fresca entera sachet", label: "Leche en sachet" },
  { variety: "Carne picada común", label: "Carne picada" },
  { variety: "Pollo entero", label: "Pollo entero" },
  { variety: "Huevos de gallina", label: "Huevos" },
  { variety: "Papa", label: "Papa" },
  { variety: "Arroz blanco simple", label: "Arroz" },
  { variety: "Fideos secos tipo guisero", label: "Fideos secos" },
  { variety: "Aceite de girasol", label: "Aceite de girasol" },
  { variety: "Azúcar", label: "Azúcar" },
  { variety: "Harina de trigo común", label: "Harina" },
  { variety: "Detergente líquido", label: "Detergente" },
  { variety: "Lavandina", label: "Lavandina" },
  { variety: "Jabón de tocador", label: "Jabón de tocador" },
];

/** Selección para Gran Buenos Aires, donde hay más variedad publicada. */
export const GBA_PRODUCTS: ProductDef[] = [
  { variety: "Pan francés tipo flauta", label: "Pan francés" },
  { variety: "Leche fresca entera en sachet", label: "Leche en sachet" },
  { variety: "Asado", label: "Asado" },
  { variety: "Carne picada común", label: "Carne picada" },
  { variety: "Pollo entero", label: "Pollo entero" },
  { variety: "Yerba mate", label: "Yerba mate" },
  { variety: "Huevos de gallina", label: "Huevos" },
  { variety: "Papa", label: "Papa" },
  { variety: "Arroz blanco simple", label: "Arroz" },
  { variety: "Fideos secos tipo guisero", label: "Fideos secos" },
  { variety: "Aceite de girasol", label: "Aceite de girasol" },
  { variety: "Azúcar", label: "Azúcar" },
  { variety: "Harina de trigo común 000", label: "Harina" },
  { variety: "Café molido", label: "Café molido" },
  { variety: "Queso cremoso", label: "Queso cremoso" },
  { variety: "Tomate redondo", label: "Tomate" },
  { variety: "Cebolla", label: "Cebolla" },
  { variety: "Banana", label: "Banana" },
  { variety: "Gaseosa base cola", label: "Gaseosa cola" },
  { variety: "Vino común", label: "Vino común" },
  { variety: "Detergente líquido", label: "Detergente" },
  { variety: "Lavandina", label: "Lavandina" },
  { variety: "Champú", label: "Champú" },
  { variety: "Pañales descartables", label: "Pañales" },
];

/** Desde cuándo se validan los precios: empieza con el IPC, que sirve de referencia. */
export const PRICES_FROM = "2017-06";

// La planilla publica "///" en meses aislados (por ejemplo abril de 2020). No se completan:
// un hueco más largo sí indica un problema de la fuente.
export const PRICE_RULES = { minPoints: 100, stepMonths: 1, toleratedGaps: 1 };

/** Nombres claros para los grupos del IPC, por su código en la API del INDEC. */
export const PLAIN_GROUP_NAMES: Record<string, string> = {
  "01.1": "Alimentos",
  "01.2": "Bebidas sin alcohol",
  "02.1": "Bebidas alcohólicas",
  "02.2": "Cigarrillos",
  "03.1": "Ropa",
  "03.2": "Calzado",
  "04.1": "Alquiler de la vivienda",
  "04.3": "Arreglos de la vivienda",
  "04.5": "Luz, gas y otros combustibles",
  "05.6": "Limpieza y cuidado del hogar",
  "06.1": "Remedios y productos de salud",
  "07.1": "Compra de vehículos",
  "07.2": "Nafta y gastos del auto",
  "07.3": "Transporte público",
  "08.3": "Teléfono e internet",
  "09.1": "Electrónica",
  "09.4": "Salidas y cultura",
  "09.5": "Libros, diarios y librería",
  "11.1": "Comer afuera",
  "12.1": "Cuidado personal",
};
