import { fetchSource, SourceError } from "./http";

// API del INDEC (beta). Filtros estilo PostgREST y hasta 1000 filas por respuesta.
// El token se recibe por parámetro: solo se lee del entorno en el servidor (lib/data).
const BASE_URL = "https://api.indec.gob.ar/v1";
const PAGE_SIZE = 1000;
const MAX_PAGES = 5;

export type IndecRow = Record<string, unknown>;

export async function fetchIndecRows(
  table: string,
  params: Record<string, string>,
  token: string,
): Promise<IndecRow[]> {
  const rows: IndecRow[] = [];
  // Si se pide un límite explícito se respeta y no se pagina.
  const limit = params.limit ?? String(PAGE_SIZE);

  for (let page = 0; page < MAX_PAGES; page++) {
    const query = new URLSearchParams({ ...params, limit, offset: String(page * PAGE_SIZE) });
    const response = await fetchSource(`${BASE_URL}/${table}?${query}`, {
      headers: { authorization: `Bearer ${token}` },
    });

    const body: unknown = await response.json();
    if (!Array.isArray(body)) {
      throw new SourceError(`La API del INDEC no devolvió una lista para ${table}`);
    }
    rows.push(...(body as IndecRow[]));
    if (params.limit || body.length < PAGE_SIZE) return rows;
  }

  throw new SourceError(`${table} excede las ${MAX_PAGES * PAGE_SIZE} filas previstas`);
}
