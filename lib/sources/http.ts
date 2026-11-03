const USER_AGENT = "DatoMataRelato/0.1 (visualizacion de datos publicos de Argentina)";

export class SourceError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "SourceError";
  }
}

interface FetchOptions {
  headers?: Record<string, string>;
  timeoutMs?: number;
  /** Reintentos ante caídas de red o errores 5xx. Un 4xx no se reintenta: no se va a arreglar solo. */
  retries?: number;
}

// Next corta en 50 segundos el llenado de una caché durante el prerender:
// el peor caso (dos intentos de 15 s) tiene que entrar con margen.
export async function fetchSource(
  url: string,
  { headers, timeoutMs = 15_000, retries = 1 }: FetchOptions = {},
): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: { "user-agent": USER_AGENT, ...headers },
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (response.ok) return response;

      const error = new SourceError(`HTTP ${response.status} en ${url}`, response.status);
      if (response.status < 500) throw error;
      lastError = error;
    } catch (error) {
      if (error instanceof SourceError && error.status !== undefined && error.status < 500) {
        throw error;
      }
      lastError = error;
    }
  }

  const detail = lastError instanceof Error ? lastError.message : String(lastError);
  throw new SourceError(`No se pudo leer ${url}: ${detail}`);
}
