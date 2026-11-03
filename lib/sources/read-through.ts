export type SourceResult<T> =
  | { ok: true; data: T; fetchedAt: string; stale: boolean }
  | { ok: false; error: string; fetchedAt: string };

// Último dato válido por proceso: si una fuente se cae al revalidar, se sigue mostrando
// lo último bueno con un aviso, y se reintenta pronto.
const lastGood = new Map<string, { data: unknown; fetchedAt: string }>();

export async function readThrough<T>(key: string, read: () => Promise<T>): Promise<SourceResult<T>> {
  const now = new Date().toISOString();
  try {
    const data = await read();
    lastGood.set(key, { data, fetchedAt: now });
    return { ok: true, data, fetchedAt: now, stale: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[fuentes] ${message}`);
    const previous = lastGood.get(key);
    if (previous) {
      return { ok: true, data: previous.data as T, fetchedAt: previous.fetchedAt, stale: true };
    }
    return { ok: false, error: message, fetchedAt: now };
  }
}
